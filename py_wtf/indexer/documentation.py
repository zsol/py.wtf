import re
from inspect import cleandoc

import rst_to_myst

from py_wtf.types import Documentation

RST_ROLE = re.compile(r":[a-zA-Z]+:`")


def convert_to_myst(src: str) -> Documentation:
    text = cleandoc(src)
    if is_rst(text):
        text = rst_to_myst.rst_to_myst(text).text
    return Documentation(text)


def is_rst(src: str) -> bool:
    return bool(RST_ROLE.finditer(src))
