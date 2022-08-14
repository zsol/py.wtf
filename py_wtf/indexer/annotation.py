import logging
from dataclasses import replace

import libcst as cst

from py_wtf.types import FQName, SymbolTable, Type, XRef

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


def dumb_annotation(node: cst.CSTNode) -> Type:
    code = cst.Module(body=[]).code_for_node(node)
    log.warning(f"Found unparseable annotation: '{code}'")
    return Type(code, None)


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

        return dumb_annotation(node)

    def handle_name(self, node: cst.Name) -> Type:
        name = node.value
        fqname = self._symbols.get(name, FQName(name))
        return Type(name, XRef(fqname, self._external_symbols.get(fqname)))

    def handle_subscript(self, node: cst.Subscript) -> Type:
        value = self(node.value)
        if value.is_dumb:
            return value

        params: list[Type] = []
        for el in node.slice:
            if not isinstance(el.slice, cst.Index):
                params.append(dumb_annotation(el.slice))
                continue
            params.append(self(el.slice.value))

        return replace(value, params=params)
