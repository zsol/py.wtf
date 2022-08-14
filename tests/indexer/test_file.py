from pathlib import Path
from textwrap import dedent

import pytest
from py_wtf.indexer import file as mod_under_test
from py_wtf.indexer.file import index_dir, index_file
from py_wtf.types import Export, FQName, Module, ProjectName, SymbolTable, XRef

empty_module = Module("testmod", [], [], [], [], [])


def mock_index_file(
    base_dir: Path, path: Path, symbol_table: SymbolTable | None = None
) -> Module:
    return empty_module


def test_index_dir(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setattr(
        mod_under_test,
        "index_file",
        mock_index_file,
    )

    some_file = tmp_path / "somefile.py"
    some_file.touch()
    assert list(index_dir(tmp_path)) == [empty_module]


def test_index_file_syntax_error(tmp_path: Path) -> None:
    some_file = tmp_path / "somefile.py"
    some_file.write_text("Haha no.")

    mod = index_file(tmp_path, some_file)
    assert mod.documentation
    assert "Failed to index" in next(iter(mod.documentation))


@pytest.fixture(params=["one", "two", "three"])
def module_file(request: pytest.FixtureRequest, tmp_path: Path) -> Path:
    name = f"{request.param}.py"  # type: ignore
    some_file = tmp_path / name
    code = dedent(
        """
    import sys
    from os import path
    var_with_ann: str = "foo"
    '''docs for var_with_ann'''
    var = "bar"
    '''docs for var'''
    # lol?
    lol: path

    def func(param: str) -> int:
        '''func docs'''
        return len(param)

    class Cls:
        '''class docs'''
        def meth(self) -> "Cls":
            '''meth docs'''
            return Cls()

        class Inner(Cls):
            '''inner docs'''

    # this is a factory, not a fact
    def fact() -> Cls:
        return Cls()
    """
    )
    some_file.write_text(code)
    return some_file


@pytest.fixture
def package_file(tmp_path: Path) -> Path:
    some_file = tmp_path / "mypackage" / "__init__.py"
    some_file.parent.mkdir()
    code = dedent(
        """
        from dependencyproject import helper
        def foo(): ...
        bar = 2

        __all__ = ["foo", "helper"]
        """
    )
    some_file.write_text(code)
    return some_file


@pytest.fixture
def mod(module_file: Path) -> Module:
    return index_file(module_file.parent, module_file)


@pytest.fixture
def package(package_file: Path) -> Module:
    return index_file(package_file.parent.parent, package_file)


def test_index_file_mod_name(mod: Module, module_file: Path) -> None:
    assert mod.name == module_file.stem


def test_index_file_variables(mod: Module) -> None:
    assert len(list(mod.variables)) == 3


def test_index_package(package: Module, package_file: Path) -> None:
    assert package.name == package_file.parent.name


def test_index_package_exports(package: Module) -> None:
    assert set(package.exports) == {
        Export(
            FQName("mypackage.helper"),
            XRef(FQName("dependencyproject.helper"), None),
        ),
        Export(
            FQName("mypackage.foo"),
            XRef(FQName("mypackage.foo"), None),
        ),
    }


@pytest.fixture
def package_with_dep(package_file: Path) -> Module:
    return index_file(
        package_file.parent.parent,
        package_file,
        {FQName("dependencyproject.helper"): ProjectName("dependency")},
    )


def test_index_package_exports_with_dependencies(package_with_dep: Module) -> None:
    assert set(package_with_dep.exports) == {
        Export(
            FQName("mypackage.helper"),
            XRef(FQName("dependencyproject.helper"), ProjectName("dependency")),
        ),
        Export(
            FQName("mypackage.foo"),
            XRef(FQName("mypackage.foo"), None),
        ),
    }
