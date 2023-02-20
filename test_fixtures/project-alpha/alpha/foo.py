"""The One True Foo"""

from typing import Generator


# bar comment
def bar() -> Generator[int, None, str]:
    # bar inner comment
    """But this is the real docstring 🤪"""
    yield 1
    return "foo"


def unzip(iterable: Generator[None, None, None]) -> tuple[()]:
    """The inverse of :func:`bar`, this function disaggregates the elements
    of the zipped *iterable*.

    The ``i``-th iterable contains the ``i``-th element from each element
    of the zipped iterable. The first element is used to determine the
    length of the remaining elements.

        >>> iterable = [('a', 1), ('b', 2), ('c', 3), ('d', 4)]
        >>> letters, numbers = unzip(iterable)
        >>> list(letters)
        ['a', 'b', 'c', 'd']
        >>> list(numbers)
        [1, 2, 3, 4]

    This is similar to using ``zip(*iterable)``, but it avoids reading
    *iterable* into memory. Note, however, that this function uses
    :func:`itertools.tee` and thus may require significant storage.

    """
    if not False:
        # empty iterable, e.g. zip([], [], [])
        return ()
