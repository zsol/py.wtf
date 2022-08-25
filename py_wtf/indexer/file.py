import asyncio
import itertools
import logging
from concurrent.futures import Executor
from inspect import cleandoc
from pathlib import Path
from typing import AsyncIterable, cast, Iterable, Protocol, TypeVar

import libcst as cst
import trailrunner
from libcst import matchers as m
from libcst.codemod import CodemodContext
from libcst.codemod.visitors import GatherExportsVisitor
from libcst.helpers.expression import get_full_name_for_node

from py_wtf.types import (
    Class,
    Documentation,
    Export,
    FQName,
    Function,
    Module,
    Parameter,
    SymbolTable,
    Type,
    Variable,
    XRef,
)

from .annotation import index as extract_type

logger = logging.getLogger(__name__)


async def index_dir(
    dir: Path,
    symbol_table: SymbolTable | None = None,
    executor: Executor | None = None,
) -> AsyncIterable[Module]:
    # TODO: do something with .pyi files
    # If there's a .pyi file with no corresponding .py -> just index .pyi
    # If both of them exist, do a best effort merge? 🤷
    trailrunner.core.INCLUDE_PATTERN = r".+\.py$"

    # Skip looking for root markers, we definitely want to index this directory.
    trailrunner.core.ROOT_MARKERS = []

    loop = asyncio.get_event_loop()
    for coro in asyncio.as_completed(
        [
            loop.run_in_executor(executor, index_file, dir, file, symbol_table)
            for file in trailrunner.walk(dir)
        ]
    ):
        mod = await coro
        yield mod


def index_file(
    base_dir: Path,
    path: Path,
    symbol_table: SymbolTable | None = None,
) -> Module:
    if not symbol_table:
        symbol_table = {}
    name_parts = path.relative_to(base_dir).with_suffix("").parts
    is_pkg = False
    if name_parts[-1] == "__init__":
        name_parts = name_parts[:-1]
        is_pkg = True
    name = ".".join(name_parts)
    indexer = Indexer(is_pkg, name, symbol_table)
    try:
        mod = cst.MetadataWrapper(
            cst.parse_module(path.read_bytes()), unsafe_skip_copy=True
        )
        mod.visit(indexer)
    except Exception as e:
        err = Documentation(f"Failed to index {path.relative_to(base_dir)} due to {e}")
        indexer.documentation = [err]
        logger.error(err)
    return Module(
        name,
        documentation=indexer.documentation,
        classes=indexer.classes,
        functions=indexer.functions,
        variables=indexer.variables,
        exports=indexer.exports,
    )


def name(val: cst.BaseExpression) -> str | None:
    if not isinstance(val, (cst.Name, cst.Attribute)):
        return None
    if isinstance(val, cst.Attribute) and (base := name(val.value)) is not None:
        return f"{base}.{name(val.attr)}"
    if isinstance(val, cst.Name):
        return val.value
    return None


T = TypeVar("T")


def ensure(val: T | None) -> T:
    if val is None:
        raise ValueError(f"Unexpected None")  # no cov
    return val


class HasComment(Protocol):
    @property
    def comment(self) -> cst.Comment | None:
        ...


def extract_documentation(node: HasComment) -> Documentation | None:
    if node.comment is None:
        return None
    return Documentation(node.comment.value[1:].lstrip())


def extract_docstring(node: cst.Module | cst.BaseSuite) -> list[Documentation]:
    if match := m.extract(
        node,
        m.TypeOf(m.Module, m.IndentedBlock, m.SimpleStatementSuite)(
            body=[
                m.SimpleStatementLine(
                    body=[
                        m.Expr(
                            value=m.SaveMatchedNode(m.SimpleString(), name="docstring")
                        )
                    ]
                ),
                m.AtLeastN(m.DoNotCare(), n=0),
            ]
        ),
    ):
        docstring = cast(cst.SimpleString, match["docstring"])
        docstring_quotes = {'"""', "'''"}
        if any(docstring.value.startswith(quote) for quote in docstring_quotes):
            return [Documentation(cleandoc(docstring.evaluated_value))]
    return []


class Indexer(cst.CSTVisitor):
    def __init__(
        self,
        is_pkg: bool,
        scope: str,
        external_symbol_table: SymbolTable,
        symbol_table: dict[str, FQName] | None = None,
    ) -> None:
        super().__init__()
        self._is_pkg = is_pkg
        self._scope_name: str = scope
        # we don't want to modify parent's symbol table copy
        self._symbol_table: dict[str, FQName] = dict(symbol_table or {})
        self._external_symbol_table = external_symbol_table
        self.classes: list[Class] = []
        self.functions: list[Function] = []
        self.variables: list[Variable] = []
        self.documentation: list[Documentation] = []
        self.exports: list[Export] = []

    def visit_Module(self, node: cst.Module) -> bool:
        self.documentation.extend(extract_docstring(node))

        if node.header:
            self.documentation.extend(
                filter(None, (extract_documentation(line) for line in node.header))
            )
        return True

    def leave_Module(self, original_node: cst.Module) -> None:
        vis = GatherExportsVisitor(CodemodContext())
        original_node.visit(vis)
        if vis.explicit_exported_objects:
            # This means there's an __all__, so we don't need exports coming from
            # imports

            self.exports = []
        for name in vis.explicit_exported_objects:
            fqname = self._symbol_table.get(name, self.scoped_name(name))
            self.exports.append(
                Export(
                    self.scoped_name(name),
                    XRef(fqname, project=self._external_symbol_table.get(fqname)),
                )
            )

    def extract_type(self, ann: cst.Annotation) -> Type:
        return extract_type(
            ann.annotation, self._symbol_table, self._external_symbol_table
        )

    def extract_func_params(self, params: cst.Parameters) -> Iterable[Parameter]:
        for param in itertools.chain(
            params.params,
            params.posonly_params,
            [params.star_arg],
            params.kwonly_params,
            [params.star_kwarg],
        ):
            if not isinstance(param, cst.Param):
                # TODO: ParamStar, MaybeSentinel isnt handled
                continue
            star = param.star if isinstance(param.star, str) else ""
            if param.annotation:
                ann = self.extract_type(param.annotation)
            else:
                ann = None
            yield Parameter(
                f"{star}{param.name.value}",
                ann,
                default="..." if param.default else None,
            )

    def scoped_name(self, name: str) -> FQName:
        if self._scope_name:
            return FQName(f"{self._scope_name}.{name}")
        return FQName(name)

    def visit_Import(self, node: cst.Import) -> bool:
        for name in node.names:
            if (asname := name.evaluated_alias) is not None:
                self._symbol_table[asname] = FQName(name.evaluated_name)
        return False

    def visit_ImportFrom(self, node: cst.ImportFrom) -> bool:
        if isinstance(node.names, cst.ImportStar):
            return False

        from_mod = ""
        if node.relative:
            from_mod = self._scope_name.rsplit(".", len(node.relative) - 1)[0] + "."
        if node.module:
            from_mod += get_full_name_for_node(node.module) or ""
        for name in node.names:
            source = f"{from_mod}.{name.evaluated_name}"
            target = (
                asname
                if (asname := name.evaluated_alias) is not None
                else name.evaluated_name
            )
            source_fqname = FQName(source)
            self._symbol_table[target] = source_fqname
            if self._is_pkg:
                self.exports.append(
                    Export(
                        self.scoped_name(target),
                        XRef(
                            source_fqname,
                            self._external_symbol_table.get(source_fqname),
                        ),
                    )
                )
        return False

    def visit_ClassDef(self, node: cst.ClassDef) -> bool:
        unqual_name = ensure(name(node.name))
        my_name = self.scoped_name(unqual_name)
        self._symbol_table[unqual_name] = my_name
        bases = list(filter(None, (name(arg.value) for arg in node.bases)))
        comments = filter(
            None, (extract_documentation(line) for line in node.leading_lines)
        )
        documentation = extract_docstring(node.body)
        indexer = Indexer(
            False, my_name, self._external_symbol_table, self._symbol_table
        )
        node.body.visit(indexer)
        self.classes.append(
            Class(
                my_name,
                bases,
                methods=indexer.functions,
                class_variables=indexer.variables,
                instance_variables=[],  # TODO
                inner_classes=indexer.classes,
                documentation=[*documentation, *comments],
            )
        )
        return False

    def visit_FunctionDef(self, node: cst.FunctionDef) -> bool:
        my_name = self.scoped_name(ensure(name(node.name)))
        asynchronous = node.asynchronous is not None
        returns = self.extract_type(node.returns) if node.returns else None
        comments = filter(
            None, (extract_documentation(line) for line in node.leading_lines)
        )
        documentation = extract_docstring(node.body)

        params = self.extract_func_params(node.params)

        self.functions.append(
            Function(
                my_name,
                asynchronous,
                params=list(params),
                returns=returns,
                documentation=[*documentation, *comments],
            )
        )
        return False

    def visit_Assign(self, node: cst.Assign) -> bool:
        if len(node.targets) > 1:
            # not supported:
            # a, b = ...
            return False

        target = node.targets[0].target
        my_name = name(target)
        if my_name is None:
            # it's not a Name or Attribute
            return False

        if my_name == "__all__":
            # Handled by GatherExportsVisitor
            return False

        self.variables.append(
            Variable(
                name=self.scoped_name(my_name),
                type=None,
                documentation=[],  # TODO
            )
        )
        return False

    def visit_AnnAssign(self, node: cst.AnnAssign) -> bool:
        if not isinstance(node.target, cst.Name):
            # we don't deal with weirdos here
            # ...
            # yet?
            return False

        my_name = self.scoped_name(ensure(name(node.target)))
        type = self.extract_type(node.annotation)
        self.variables.append(
            Variable(
                my_name,
                type,
                documentation=[],  # TODO
            )
        )
        return False
