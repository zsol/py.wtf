import itertools
from pathlib import Path
from textwrap import dedent
from typing import Iterable, Protocol, Tuple, TypeVar

import libcst as cst

from .types import (
    Class,
    Documentation,
    Function,
    Module,
    Package,
    Parameter,
    Type,
    Variable,
)


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
        raise ValueError(f"Expected type {T}, got None")
    return val


class HasComment(Protocol):
    comment: cst.Comment | None


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
        self.classes: list[Class] = []
        self.functions: list[Function] = []
        self.variables: list[Variable] = []
        self.documentation: list[Documentation] = []

    def scoped_name(self, name: str) -> str:
        if self._scope_name:
            return f"{self._scope_name}.{name}"
        return name

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
        indexer = Indexer()
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
