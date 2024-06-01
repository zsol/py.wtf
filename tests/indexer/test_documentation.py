from py_wtf.indexer.documentation import convert_to_myst, is_rst
from py_wtf.types import ProjectDescription


def test_simple_rst() -> None:
    docstring = """Break *iterable* into lists of length *n*:

    >>> list(chunked([1, 2, 3, 4, 5, 6], 3))
    [[1, 2, 3], [4, 5, 6]]

By the default, the last yielded list will have fewer than *n* elements
if the length of *iterable* is not divisible by *n*:

    >>> list(chunked([1, 2, 3, 4, 5, 6, 7, 8], 3))
    [[1, 2, 3], [4, 5, 6], [7, 8]]

To use a fill-in value instead, see the :func:`grouper` recipe.
If the length of *iterable* is not divisible by *n* and *strict* is
``True``, then ``ValueError`` will be raised before the last
list is yielded.

    """
    result = convert_to_myst(docstring)
    assert "{func}`grouper`" in result
    # two code blocks in total (4 markers)
    assert result.count("```") == 4


def test_is_rst() -> None:
    assert is_rst("foo :code:`lol`")
    assert not is_rst("foo")
    assert is_rst(".. foo:")
    assert is_rst("like ``foo``.")
    assert is_rst(
        """blahblah::

    """
    )
    assert is_rst("hello\n.. foo:\nbar")
    assert is_rst(">>> 1+1")
    assert is_rst(
        """foo bar
>>> print(1)
1
"""
    )
    assert is_rst("foo\n:param blah:")
    assert is_rst("foo\n:param blah: blahblah")
    assert is_rst("foo\n:type blah: blahblah")
    assert is_rst("foo\n  :raises blah: blahblah")
    assert is_rst("   :Example:")
    assert is_rst("foo\n :return: something")
    assert is_rst("foo\n :rtype: something")


def test_description_content_type_md() -> None:
    assert "like ``foo``." == convert_to_myst(
        ProjectDescription(description="like ``foo``.", content_type="text/markdown")
    )


def test_description_content_type_rst() -> None:
    assert "like `foo`.\n" == convert_to_myst(
        ProjectDescription(description="like ``foo``.", content_type="text/x-rst")
    )


def test_params() -> None:
    doc = """Initialize a Version object.
        :param version:
            The string representation of a version which will be parsed and normalized
            before use.
        :raises InvalidVersion:
            If the ``version`` does not conform to PEP 440 in any way then this
            exception will be raised."""
    myst = convert_to_myst(doc)
    assert "Initialize a Version object" in myst
    assert "InvalidVersion" in myst
    assert "The string representation of a version" in myst
    assert "does not conform to PEP 440" in myst
    assert "{eval-rst}" not in myst  # this is not supported by the js rendering


def test_unknown_directive() -> None:
    doc = """
.. testsetup::

    from packaging.specifiers import Specifier, SpecifierSet, InvalidSpecifier
    from packaging.version import Version
"""
    myst = convert_to_myst(doc)
    assert "from packaging.version import Version" in myst
    assert "{eval-rst}" not in myst  # this is not supported by the js rendering
