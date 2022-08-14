import itertools
from functools import partial
from pathlib import Path
from textwrap import dedent
from typing import Iterable, Protocol, TypeVar

import libcst as cst
import trailrunner
from libcst.codemod import CodemodContext
from libcst.codemod.visitors import GatherExportsVisitor
from libcst.helpers.expression import get_full_name_for_node

from py_wtf.types import (
    Class,
    Documentation,
    FQName,
    Function,
    Module,
    Parameter,
    Type,
    Variable,
)


def index_dir(dir: Path) -> Iterable[Module]:
    # TODO: do something with .pyi files
    # If there's a .pyi file with no corresponding .py -> just index .pyi
    # If both of them exist, do a best effort merge? 🤷
    trailrunner.core.INCLUDE_PATTERN = r".+\.py$"

    # Skip looking for root markers, we definitely want to index this directory.
    trailrunner.core.ROOT_MARKERS = []
    for (_, mod) in trailrunner.run_iter(
        paths=trailrunner.walk(dir), func=partial(index_file, dir)
    ):
        yield mod


def index_file(base_dir: Path, path: Path) -> Module:
    name_parts = path.relative_to(base_dir).with_suffix("").parts
    if name_parts[-1] == "__init__":
        name_parts = name_parts[:-1]
    name = ".".join(name_parts)
    indexer = Indexer(name)
    try:
        mod = cst.MetadataWrapper(
            cst.parse_module(path.read_bytes()), unsafe_skip_copy=True
        )
        mod.visit(indexer)
    except Exception as e:
        err = Documentation(f"Failed to index {path.relative_to(base_dir)} due to {e}")
        indexer.documentation = [err]
        print(err)
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


def extract_type(annotation: cst.Annotation) -> Type:
    return Type(cst.Module(()).code_for_node(annotation.annotation))


def extract_func_params(params: cst.Parameters) -> Iterable[Parameter]:
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
            ann = extract_type(param.annotation)
        else:
            ann = None
        yield Parameter(
            f"{star}{param.name.value}", ann, default="..." if param.default else None
        )


class Indexer(cst.CSTVisitor):
    def __init__(self, scope: str | None = None) -> None:
        super().__init__()
        self._scope_name: str | None = scope
        self._symbol_table: dict[str, FQName] = {}
        self.classes: list[Class] = []
        self.functions: list[Function] = []
        self.variables: list[Variable] = []
        self.documentation: list[Documentation] = []
        self.exports: list[FQName] = []

    def leave_Module(self, original_node: cst.Module) -> None:
        vis = GatherExportsVisitor(CodemodContext())
        original_node.visit(vis)
        # Maybe have an exports section?
        self.exports.extend(
            self._symbol_table.get(name, FQName(name))
            for name in vis.explicit_exported_objects
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
            if self._scope_name is None:
                raise ValueError("Tried relative import when scope name is empty")
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
            self._symbol_table[target] = FQName(source)
        return False

    def visit_IndentedBlock(self, node: cst.IndentedBlock) -> bool:
        if (hdr := extract_documentation(node.header)) is not None:
            self.documentation.append(hdr)
        if len(node.body) == 0:
            return False
        first_stmt = node.body[0]
        if not isinstance(first_stmt, cst.SimpleStatementLine):
            return True
        self.documentation.extend(
            filter(
                None, (extract_documentation(line) for line in first_stmt.leading_lines)
            )
        )
        if isinstance((first_expr := first_stmt.body[0]), cst.Expr) and isinstance(
            (docstring := first_expr.value),
            (cst.SimpleString, cst.ConcatenatedString),
        ):
            evaled_docstring = docstring.evaluated_value
            if evaled_docstring:
                self.documentation.append(
                    Documentation(dedent(evaled_docstring).strip())
                )

        return True

    def visit_ClassDef(self, node: cst.ClassDef) -> bool:
        my_name = self.scoped_name(ensure(name(node.name)))
        bases = tuple(filter(None, (name(arg.value) for arg in node.bases)))
        comments = filter(
            None, (extract_documentation(line) for line in node.leading_lines)
        )
        indexer = Indexer(scope=my_name)
        node.body.visit(indexer)
        self.classes.append(
            Class(
                my_name,
                bases,
                methods=indexer.functions,
                class_variables=indexer.variables,
                instance_variables=(),  # TODO
                inner_classes=indexer.classes,
                documentation=(*indexer.documentation, *comments),
            )
        )
        return False

    def visit_FunctionDef(self, node: cst.FunctionDef) -> bool:
        my_name = self.scoped_name(ensure(name(node.name)))
        asynchronous = node.asynchronous is not None
        returns = extract_type(node.returns) if node.returns else None
        comments = filter(
            None, (extract_documentation(line) for line in node.leading_lines)
        )
        # TODO: this is way too much work for just extracting docs
        indexer = Indexer(self._scope_name)
        node.body.visit(indexer)

        params = extract_func_params(node.params)

        self.functions.append(
            Function(
                my_name,
                asynchronous,
                params=tuple(params),
                returns=returns,
                documentation=(*indexer.documentation, *comments),
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
                documentation=(),  # TODO
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
        type = extract_type(node.annotation)
        self.variables.append(
            Variable(
                my_name,
                type,
                documentation=(),  # TODO
            )
        )
        return False
