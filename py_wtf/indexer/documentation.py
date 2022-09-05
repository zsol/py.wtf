import logging
import re
from inspect import cleandoc

import rst_to_myst

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
            text = rst_to_myst.rst_to_myst(text).text
        except Exception:
            logger.exception("Error while parsing RST")
    return Documentation(text)


def is_rst(src: str) -> bool:
    return bool(RST_ROLE.search(src))
