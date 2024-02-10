import logging
import re
from inspect import cleandoc
from typing import NoReturn

from docutils.nodes import SkipNode, field_list, Node, table
from rst_to_myst import markdownit, to_docutils_ast
from rst_to_myst.mdformat_render import from_tokens
from rst_to_myst.nodes import EvalRstNode

from py_wtf.types import Documentation, ProjectDescription

logger = logging.getLogger(__name__)
RST_ROLE = re.compile(
    r"(:[a-zA-Z]+:`)"  # references
    r"|(::\n)"  # literal blocks
    r"|((^|\n)\.\. )"  # definitions
    r"|([^`]``[^`]+``[^`])"  # inline literal
)


def convert_to_myst(src: str | ProjectDescription) -> Documentation:
    if isinstance(src, ProjectDescription):
        if src.content_type and src.content_type != "text/x-rst":
            # https://github.com/pypi/warehouse/blob/050fa1b833ef96c03ec911611ab446ce8a10840b/warehouse/utils/readme.py#L26
            return Documentation(src.description)
        text = src.description
    else:
        text = cleandoc(src)
    if is_rst(text):
        try:
            text = rst_to_myst(text)
        except Exception:
            logger.exception("Error while parsing RST")
    return Documentation(text)


def is_rst(src: str) -> bool:
    return bool(RST_ROLE.search(src))


def rst_to_myst(src: str) -> str:
    document, warning_stream = to_docutils_ast(
        src, use_sphinx=True, default_domain="py"
    )
    renderer = MarkdownItRenderer(document, warning_stream=warning_stream)
    output = renderer.to_tokens()
    myst = from_tokens(output, warning_stream=warning_stream)  # this logs too
    return myst


class MarkdownItRenderer(markdownit.MarkdownItRenderer):
    def _rst_as_text(self, node: Node) -> NoReturn:
        text = node.astext()
        if not text.endswith("\n"):
            text += "\n"
        self.add_token("fence", "code", 0, content=text)
        raise SkipNode

    def visit_field_list(self, node: field_list) -> NoReturn:
        self._rst_as_text(node)

    def visit_EvalRstNode(self, node: EvalRstNode) -> NoReturn:
        self._rst_as_text(node)

    def visit_table(self, node: table) -> None:
        if not self.parse_gfm_table(node):
            self._rst_as_text(node)
        self.add_token("table_open", "table", 1)
