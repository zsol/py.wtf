from functools import partial
from typing import Callable

import pytest

from py_wtf.indexer.annotation import index
from py_wtf.types import FQName, ProjectName, Type, XRef

IF = Callable[[str], Type | None]
"""Indexer Function"""


@pytest.fixture
def indexer() -> IF:
    symbols = {
        "Generator": FQName("typing.Generator"),
        "foo_alias": FQName("foo.Foo"),
    }
    external_symbols = {
        FQName("foo.Foo"): ProjectName("foooid"),
    }
    return partial(index, symbols=symbols, external_symbols=external_symbols)


def test_str(indexer: IF) -> None:
    assert indexer("str") == Type("str", XRef(FQName("str"), None))


def test_alias(indexer: IF) -> None:
    assert indexer("foo_alias") == Type(
        "foo_alias", XRef(FQName("foo.Foo"), ProjectName("foooid"))
    )


def test_generator(indexer: IF) -> None:
    assert indexer("Generator[None, str, None]") == Type(
        "Generator",
        XRef(FQName("typing.Generator")),
        params=[
            Type("None", XRef(FQName("None"))),
            Type("str", XRef(FQName("str"))),
            Type("None", XRef(FQName("None"))),
        ],
    )


def test_nesting(indexer: IF) -> None:
    assert indexer("list[list[str]]") == Type(
        "list",
        XRef(FQName("list")),
        params=[
            Type(
                "list",
                XRef(FQName("list")),
                params=[Type("str", XRef(FQName("str")))],
            )
        ],
    )


def test_pep_604_alternative(indexer: IF) -> None:
    assert indexer("a | b") == Type("a | b", None)


def test_callable(indexer: IF) -> None:
    assert indexer("Callable[[], str]") == Type(
        "Callable",
        XRef(FQName("Callable")),
        params=[Type("[]", None), Type("str", XRef(FQName("str")))],
    )
