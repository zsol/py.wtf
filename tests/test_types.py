from typing import TypeVar

import pytest

from py_wtf.repository import converter

from py_wtf.types import Export, FQName, ProjectName, Type, XRef

T = TypeVar("T")


@pytest.fixture(params=["str", "foo.bar.Foo.Bar.foo"])
def fqname(request: pytest.FixtureRequest) -> FQName:
    return FQName(request.param)  # type: ignore


@pytest.fixture(params=[None, ProjectName("alpha")])
def xref(request: pytest.FixtureRequest, fqname: FQName) -> XRef:
    return XRef(fqname, project=request.param)  # type: ignore


def roundtrip(obj: T) -> T:
    return converter.loads(converter.dumps(obj), type(obj))


def test_xref_serialization(xref: XRef) -> None:
    assert roundtrip(xref) == xref


def test_type_serialization(xref: XRef) -> None:
    ty = Type("foo", xref, [])
    assert roundtrip(ty) == ty
    ty = Type("bar", xref, [ty])
    assert roundtrip(ty) == ty


@pytest.fixture(params=[None, [], [Type("foo", None)]])
def ty(request: pytest.FixtureRequest, xref: XRef) -> Type:
    return Type("ty", xref, params=request.param)  # type: ignore


def test_export_serialization(xref: XRef) -> None:
    ex = Export(FQName("a"), xref)
    assert roundtrip(ex) == ex


@pytest.fixture
def export(fqname: FQName, xref: XRef) -> Export:
    return Export(fqname, xref)
