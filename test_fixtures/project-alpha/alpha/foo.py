"""The One True Foo"""

from typing import Generator

# bar comment
def bar() -> Generator[int, None, str]:
    # bar inner comment
    """But this is the real docstring 🤪"""
    yield 1
    return "foo"
