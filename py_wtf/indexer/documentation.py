import logging
import re
from inspect import cleandoc

import rst_to_myst

from py_wtf.types import Documentation

logger = logging.getLogger(__name__)
RST_ROLE = re.compile(
    r"(:[a-zA-Z]+:`)"  # references
    r"|(::\n)"  # literal blocks
    r"|((^|\n)\.\. )"  # definitions
    r"|([^`]``[^`]+``[^`])"  # inline literal
)


def convert_to_myst(src: str) -> Documentation:
    text = cleandoc(src)
    if is_rst(text):
        try:
            text = rst_to_myst.rst_to_myst(text).text
        except Exception:
            logger.exception("Error while parsing RST")
    return Documentation(text)


def is_rst(src: str) -> bool:
    return bool(RST_ROLE.search(src))
