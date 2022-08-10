# SPDX-FileCopyrightText: 2022-present U.N. Owen <void@some.where>
#
# SPDX-License-Identifier: MIT
from __future__ import annotations

import json
import os
from dataclasses import dataclass
from functools import partial
from pathlib import Path
from tarfile import is_tarfile, TarFile
from tempfile import TemporaryDirectory

from typing import Iterable, Sequence, Tuple
from urllib.request import urlopen, urlretrieve
from zipfile import is_zipfile, ZipFile

import click
import rich
import trailrunner

from ..__about__ import __version__
from ..indexer import index_file
from ..types import Module, Package


@click.group(
    context_settings={"help_option_names": ["-h", "--help"]},
    invoke_without_command=True,
)
@click.version_option(version=__version__, prog_name="py.wtf")
@click.pass_context
def py_wtf(ctx: click.Context) -> None:
    os.environ["LIBCST_PARSER_TYPE"] = "native"


@py_wtf.command()
@click.argument("directory")
@click.option("--package-name", required=True)
@click.option("--pretty", is_flag=True)
def index(package_name: str, directory: str, pretty: bool) -> None:
    out_dir = Path(directory)
    out_dir.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory() as tmpdir:
        src_dir, info = download(package_name, Path(tmpdir))
        modules = list(index_dir(src_dir))

    pkg = Package(
        package_name,
        version=info.version,
        modules=modules,
        documentation=(),
    )
    if pretty:
        rich.print(pkg)
    else:
        out = out_dir / f"{package_name}.json"
        out.write_text(pkg.to_json())  # type: ignore


@py_wtf.command(name="index-file")
@click.argument("file")
def index_file_cmd(file: str) -> None:
    path = Path(file)
    mod = index_file(path.parent, path)
    rich.print(mod)


@py_wtf.command(name="index-dir")
@click.argument("dir")
def index_dir_cmd(dir: str) -> None:
    path = Path(dir)
    cnt = 0
    for cnt, mod in enumerate(index_dir(path), start=1):
        rich.print(mod)
    rich.print(f"Found {cnt} modules in total.")


def index_dir(dir: Path) -> Iterable[Module]:
    # TODO: do something with .pyi files
    # If there's a .pyi file with no corresponding .py -> just index .pyi
    # If both of them exist, do a best effort merge? 🤷
    trailrunner.core.INCLUDE_PATTERN = r".+\.py$"
    for (_, mod) in trailrunner.run_iter(
        paths=trailrunner.walk(dir), func=partial(index_file, dir)
    ):
        yield mod


Archive = TarFile | ZipFile


def open_archive(src: str) -> Archive:
    if is_tarfile(src):
        return TarFile.open(src)
    if is_zipfile(src):
        return ZipFile(src)
    raise NotImplementedError()


def archive_list(arc: Archive) -> list[str]:
    if isinstance(arc, TarFile):
        return arc.getnames()
    else:
        return arc.namelist()


@dataclass
class PkgInfo:
    version: str
    classifiers: Sequence[str] | None
    home_page: str | None
    license: str | None
    documentation_url: str | None
    dependencies: Sequence[str]
    summary: str | None


def pick_project_dir(directory: Path) -> Path:
    for entry in (e for e in directory.iterdir() if e.is_dir()):
        project_directory = entry
        break
    else:
        project_directory = directory

    if (dir := project_directory / "src").is_dir():
        return dir

    return project_directory


def parse_deps(maybe_deps: None | Sequence[str]) -> Sequence[str]:
    if not maybe_deps:
        return ()
    return tuple(dep.split(" ")[0] for dep in maybe_deps if "extra" not in dep)


def download(package_name: str, directory: Path) -> Tuple[Path, PkgInfo]:
    with urlopen(f"https://pypi.org/pypi/{package_name}/json") as pypi:
        pkg_data = json.load(pypi)
    pypi_info = pkg_data["info"]
    latest_version = pypi_info["version"]
    pkg_info = PkgInfo(
        latest_version,
        summary=pypi_info.get("summary"),
        home_page=pypi_info.get("home_page"),
        license=pypi_info.get("license"),
        documentation_url=pypi_info.get("project_urls", {}).get("Documentation"),
        classifiers=pypi_info.get("classifiers"),
        dependencies=parse_deps(pypi_info.get("requires_dist")),
    )
    src_url = None
    for artifact in pkg_data["releases"][latest_version]:
        if artifact["packagetype"] == "sdist":
            src_url = artifact["url"]
            # src_md5 = artifact['md5_digest']
            break
    if not src_url:
        raise ValueError(f"Couldn't find sdist for {package_name}=={latest_version}")
    src_archive, _ = urlretrieve(src_url)
    with open_archive(src_archive) as opened:
        opened.extractall(directory)

    return (pick_project_dir(directory), pkg_info)
