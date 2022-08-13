import json
from contextlib import contextmanager
from io import BytesIO
from pathlib import Path
from tarfile import TarFile
from typing import Callable, ContextManager, Generator, IO
from zipfile import ZipFile

import pytest
from py_wtf.indexer import pypi as module_under_test

from py_wtf.indexer.pypi import download


@pytest.fixture(params=[None, ["click (>=8.0.0)", "aiohttp (>=3.7.4) ; extra == 'd'"]])
def requirements(request: pytest.FixtureRequest) -> None | list[str]:
    return request.param  # type: ignore


@pytest.fixture
def pypi_json(
    requirements: None | list[str],
) -> Callable[[...], ContextManager[IO[bytes]]]:  # type: ignore
    @contextmanager
    def inner(*args, **kwargs) -> Generator[BytesIO, None, None]:  # type: ignore
        yield BytesIO(
            json.dumps(
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
        )

    return inner


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


@pytest.fixture(autouse=True)
def no_pypi_requests(
    monkeypatch: pytest.MonkeyPatch, pypi_json: ContextManager[IO[bytes]]
) -> None:
    monkeypatch.setattr(module_under_test, "urlopen", pypi_json)


@pytest.fixture(autouse=True)
def no_pypi_downloads(monkeypatch: pytest.MonkeyPatch, pypi_artifact: Path) -> None:
    monkeypatch.setattr(
        module_under_test,
        "urlretrieve",
        lambda *args, **kwargs: (pypi_artifact, None),
    )


def test_download(tmp_path: Path) -> None:
    path, metadata = download("foo", tmp_path)
    assert metadata.license == "BSD"
    assert path.is_relative_to(tmp_path)
    assert (path / "foo_mod.py").exists()
