from functools import partial
from typing import Callable

import pytest

from py_wtf.indexer.annotation import index
from py_wtf.types import FQName, ProjectName, stdlib_project, SymbolTable, Type, XRef

IF = Callable[[str], Type | None]
"""Indexer Function"""


@pytest.fixture
def indexer() -> IF:
    symbols = {
        "Generator": FQName("typing.Generator"),
        "foo_alias": FQName("foo.Foo"),
    }
    external_symbols = SymbolTable(
        {
            FQName("foo.Foo"): ProjectName("foooid"),
        }
    )
    return partial(index, symbols=symbols, external_symbols=external_symbols)


def test_str(indexer: IF) -> None:
    assert indexer("str") == Type("str", XRef(FQName("functions.str"), stdlib_project))


def test_alias(indexer: IF) -> None:
    assert indexer("foo_alias") == Type(
        "foo_alias", XRef(FQName("foo.Foo"), ProjectName("foooid"))
    )


def test_generator(indexer: IF) -> None:
    assert indexer("Generator[None, str, None]") == Type(
        "Generator",
        XRef(FQName("typing.Generator"), stdlib_project),
        params=[
            Type("None", XRef(FQName("constants.None"), stdlib_project)),
            Type("str", XRef(FQName("functions.str"), stdlib_project)),
            Type("None", XRef(FQName("constants.None"), stdlib_project)),
        ],
    )


def test_nesting(indexer: IF) -> None:
    assert indexer("list[list[str]]") == Type(
        "list",
        XRef(FQName("functions.list"), stdlib_project),
        params=[
            Type(
                "list",
                XRef(FQName("functions.list"), stdlib_project),
                params=[Type("str", XRef(FQName("functions.str"), stdlib_project))],
            )
        ],
    )


def test_attributes(indexer: IF) -> None:
    assert indexer("foo_alias.bar.baz") == Type(
        "foo_alias.bar.baz", XRef(FQName("foo.Foo.bar.baz"), ProjectName("foooid"))
    )


def test_pep_604_alternative(indexer: IF) -> None:
    assert indexer("a | b") == Type("a | b", None)


def test_empty_callable(indexer: IF) -> None:
    assert indexer("typing.Callable[[], str]") == Type(
        "typing.Callable",
        XRef(FQName("typing.Callable"), stdlib_project),
        params=[
            Type("", None, params=[]),
            Type("str", XRef(FQName("functions.str"), stdlib_project)),
        ],
    )


def test_callable(indexer: IF) -> None:
    assert indexer("typing.Callable[[str], str]") == Type(
        "typing.Callable",
        XRef(FQName("typing.Callable"), stdlib_project),
        params=[
            Type(
                "",
                None,
                params=[Type("str", XRef(FQName("functions.str"), stdlib_project))],
            ),
            Type("str", XRef(FQName("functions.str"), stdlib_project)),
        ],
    )


def test_invalid_callable(indexer: IF) -> None:
    assert indexer("typing.Callable[..., str]") == Type(
        "typing.Callable",
        XRef(FQName("typing.Callable"), stdlib_project),
        params=[
            Type("...", None),
            Type("str", XRef(FQName("functions.str"), stdlib_project)),
        ],
    )


def test_string_annotation(indexer: IF) -> None:
    assert indexer('"foo"') == indexer("foo")


def test_literals(indexer: IF) -> None:
    assert indexer("typing.Literal[1, '2']") == Type(
        "typing.Literal",
        XRef(FQName("typing.Literal"), stdlib_project),
        params=[
            Type("1", None),
            Type("'2'", None),
        ],
    )


def test_ellipsis(indexer: IF) -> None:
    assert indexer("...") == Type("...", None)
