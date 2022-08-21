import json
from pathlib import Path
from tarfile import TarFile
from zipfile import ZipFile

import pytest

from py_wtf.indexer.pypi import _build_symbol_table, download
from py_wtf.types import FQName, Project

from pytest_httpx import HTTPXMock


@pytest.fixture(params=[None, ["click (>=8.0.0)", "aiohttp (>=3.7.4) ; extra == 'd'"]])
def requirements(request: pytest.FixtureRequest) -> None | list[str]:
    return request.param  # type: ignore


@pytest.fixture
def pypi_json(requirements: None | list[str]) -> bytes:
    return json.dumps(
        {
            "info": {
                "author": "foo",
                "classifiers": [
                    "Development Status :: 5 - Production/Stable",
                    "Environment :: Console",
                    "Intended Audience :: Developers",
                ],
                "description": "description",
                "summary": "The summary of foo",
                "version": "0.0",
                "license": "BSD",
                "home_page": "https://rick.ro/ll",
                "project_urls": {
                    "Homepage": "https://rick.ro/ll",
                    "Documentation": "https://tinyurl.com/alpha-docs",
                },
                "requires_dist": requirements,
            },
            "releases": {
                "0.0": [
                    {"packagetype": "ivenoidea"},
                    {
                        "packagetype": "sdist",
                        "url": "https://files.pythonhosted.org/packages/lol.tar.gz",
                        "md5_digest": "HAHA I'm an MD5 hash",
                    },
                ]
            },
        }
    ).encode()


@pytest.fixture(params=["foo.whl", "foo.zip", "foo.tar.gz", "foo.tar.bz2"])
def pypi_artifact(request: pytest.FixtureRequest, tmp_path: Path) -> Path:
    out_file: Path = tmp_path / request.param  # type: ignore
    if ".tar" in out_file.suffixes:
        with TarFile.open(out_file, mode=f"w:{out_file.suffix.lstrip('.')}") as archive:
            foo = tmp_path / "foo.py"
            foo.write_text("# hi I'm foo")
            archive.add(foo, "foo_mod.py")
            foo.unlink()
    else:
        with ZipFile(out_file, mode="w") as archive:
            archive.writestr("foo_mod.py", "# hi I'm foo")
    return out_file


@pytest.mark.asyncio
async def test_download(
    tmp_path: Path, httpx_mock: HTTPXMock, pypi_json: bytes, pypi_artifact: Path
) -> None:
    httpx_mock.add_response(url="https://pypi.org/pypi/foo/json", content=pypi_json)
    httpx_mock.add_response(
        url=f"https://files.pythonhosted.org/packages/lol.tar.gz",
        content=pypi_artifact.read_bytes(),
    )
    path, metadata = await download("foo", tmp_path)
    assert metadata.license == "BSD"
    assert path.is_relative_to(tmp_path)
    assert (path / "foo_mod.py").exists()


@pytest.mark.asyncio
async def test_no_extras_in_deps(
    tmp_path: Path, httpx_mock: HTTPXMock, pypi_json: bytes, pypi_artifact: Path
) -> None:
    httpx_mock.add_response(url="https://pypi.org/pypi/foo/json", content=pypi_json)
    httpx_mock.add_response(
        url=f"https://files.pythonhosted.org/packages/lol.tar.gz",
        content=pypi_artifact.read_bytes(),
    )
    _, metadata = await download("foo", tmp_path)
    assert "aiohttp" not in metadata.dependencies


def test_symbol_table_building(project: Project) -> None:
    table = _build_symbol_table([project])
    assert table[FQName("foo")] == "testproject"
