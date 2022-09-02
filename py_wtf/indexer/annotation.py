import logging
from dataclasses import replace
from typing import Iterable, Sequence

import libcst as cst

from py_wtf.types import FQName, ProjectName, stdlib_project, SymbolTable, Type, XRef

log = logging.getLogger(__name__)


def index(
    annotation: str | cst.BaseExpression,
    symbols: dict[str, FQName],
    external_symbols: SymbolTable,
) -> Type:
    if isinstance(annotation, str):
        annotation = cst.parse_expression(annotation)
    indexer = AnnotationIndexer(symbols, external_symbols)
    return indexer(annotation)


def dumb_annotation(node: cst.CSTNode, warning: bool = True) -> Type:
    code = cst.Module(body=[]).code_for_node(node)
    if warning:
        log.warning(f"Found unparseable annotation: '{code}'")
    return Type(code, None)


def is_fqname(ty: Type, name: FQName) -> bool:
    if not ty.xref:
        return ty.name == str(name)
    return ty.xref.fqname == name


typing_Literal = FQName("typing.Literal")
typing_Callable = FQName("typing.Callable")

BUILTIN_CONSTANTS = frozenset(
    (
        "False",
        "True",
        "None",
        "NotImplemented",
        "Ellipsis",
        "__debug__",
        "quit",
        "exit",
        "copyright",
        "credits",
        "license",
    )
)


class AnnotationIndexer(cst.CSTVisitor):
    def __init__(
        self, symbols: dict[str, FQName], external_symbols: SymbolTable
    ) -> None:
        super().__init__()
        self._symbols = symbols
        self._external_symbols = external_symbols

    def __call__(self, node: cst.CSTNode) -> Type:
        if isinstance(node, cst.Name):
            return self.handle_name(node)
        elif isinstance(node, cst.Subscript):
            return self.handle_subscript(node)
        elif isinstance(node, cst.Attribute):
            return self.handle_attribute(node)
        elif isinstance(node, (cst.SimpleString, cst.ConcatenatedString)):
            return self.handle_string_like(node)
        elif isinstance(node, cst.Ellipsis):
            return dumb_annotation(node, warning=False)

        return dumb_annotation(node)

    def handle_name(self, node: cst.Name) -> Type:
        name = node.value
        fqname = self._symbols.get(name)
        project: ProjectName | None = None
        if fqname is None and name in __builtins__:  # type: ignore
            fqname = FQName(
                f"constants.{name}"
                if name in BUILTIN_CONSTANTS
                else f"functions.{name}"
            )
            project = stdlib_project
        elif fqname is None:
            fqname = FQName(name)
        if project is None:
            project = self._external_symbols.get(fqname)
        return Type(name, XRef(fqname, project))

    def handle_subscript(self, node: cst.Subscript) -> Type:
        value = self(node.value)
        if value.is_dumb:
            return value

        params: list[Type] = []
        if is_fqname(value, typing_Literal):
            params.extend(self.handle_literal_params(node.slice))
        elif is_fqname(value, typing_Callable):
            params.extend(self.handle_callable_args(node.slice))
        else:
            for el in node.slice:
                if not isinstance(el.slice, cst.Index):
                    params.append(dumb_annotation(el.slice))
                    continue
                params.append(self(el.slice.value))

        return replace(value, params=params)

    def handle_attribute(self, node: cst.Attribute) -> Type:
        attr = node.attr.value
        value = self(node.value)
        replacements = {"name": f"{value.name}.{attr}"}
        if value.xref and value.xref.fqname:
            xref: XRef = replace(value.xref, fqname=f"{value.xref.fqname}.{attr}")
            replacements["xref"] = xref  # type: ignore
        return replace(value, **replacements)

    def handle_string_like(
        self, node: cst.SimpleString | cst.ConcatenatedString
    ) -> Type:
        contents = node.evaluated_value
        if not contents:
            return dumb_annotation(node)
        try:
            return self(cst.parse_expression(contents))
        except Exception as e:
            log.warning(f"Unparseable string annotation ({e}): {contents}")
            return dumb_annotation(node)

    def handle_literal_params(
        self, params: Sequence[cst.SubscriptElement]
    ) -> Iterable[Type]:
        for param in params:
            yield dumb_annotation(param.slice, warning=False)

    def handle_callable_args(
        self, args: Sequence[cst.SubscriptElement]
    ) -> Iterable[Type]:
        if len(args) != 2:
            log.warning(f"Callable with {len(args)} args")
            for arg in args:
                yield dumb_annotation(arg.slice, warning=False)
            return

        params = args[0].slice
        if isinstance(params, cst.Index) and isinstance(params.value, cst.List):
            yield Type(
                "",
                None,
                params=[self(param.value) for param in params.value.elements],
            )
        else:
            yield dumb_annotation(params)

        ret_ty = args[1].slice
        if isinstance(ret_ty, cst.Index):
            yield self(ret_ty.value)
        else:
            yield dumb_annotation(ret_ty)
