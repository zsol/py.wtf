import logging
import os
from functools import partial
from pathlib import Path
from tarfile import is_tarfile, TarFile
from tempfile import TemporaryDirectory
from typing import AsyncIterable, Iterable, Sequence, Tuple
from zipfile import is_zipfile, ZipFile

import aiofiles.tempfile
import httpx

from packaging.requirements import Requirement

from py_wtf.repository import ProjectRepository

from py_wtf.types import FQName, Project, ProjectMetadata, ProjectName, SymbolTable
from .file import index_dir

logger = logging.getLogger(__name__)


def _build_symbol_table(projects: Iterable[Project]) -> SymbolTable:
    ret: SymbolTable = {}
    for project in projects:
        pname = project.name
        for mod in project.modules:
            ret[FQName(mod.name)] = pname
            for exp in mod.exports:
                ret[exp.name] = pname
            for func in mod.functions:
                ret[FQName(func.name)] = pname
            for var in mod.variables:
                ret[FQName(var.name)] = pname
            for cls in mod.classes:
                ret[FQName(cls.name)] = pname
                for func in cls.methods:
                    ret[FQName(func.name)] = pname
                for var in cls.class_variables:
                    ret[FQName(var.name)] = pname
                for var in cls.instance_variables:
                    ret[FQName(var.name)] = pname
                # TODO: inner classes and more
    return ret


async def index_project(
    project_name: ProjectName, repo: ProjectRepository
) -> AsyncIterable[Project]:
    logging.info(f"Indexing {project_name}")
    deps: list[Project] = []
    with TemporaryDirectory() as tmpdir:
        src_dir, info = await download(project_name, Path(tmpdir))
        dep_project_names = [ProjectName(dep) for dep in info.dependencies]
        for name in dep_project_names:
            proj = await repo.get(name, partial(index_project, repo=repo))
            deps.append(proj)

        modules = list(index_dir(src_dir, _build_symbol_table(deps)))

    proj = Project(
        project_name,
        metadata=info,
        modules=modules,
        documentation=[],
    )
    yield proj


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


def pick_project_dir(directory: Path) -> Path:
    for entry in (e for e in directory.iterdir() if e.is_dir()):
        project_directory = entry
        break
    else:
        project_directory = directory

    if (dir := project_directory / "src").is_dir():
        return dir

    return project_directory


def parse_deps(maybe_deps: None | Sequence[str]) -> list[str]:
    if not maybe_deps:
        return []

    return list(
        req.name
        for dep in maybe_deps
        if (req := Requirement(dep))
        if not req.extras
        if not req.marker
    )


async def download(project_name: str, directory: Path) -> Tuple[Path, ProjectMetadata]:
    async with httpx.AsyncClient(http2=True) as client:
        proj_data = (
            await client.get(f"https://pypi.org/pypi/{project_name}/json")
        ).json()
        pypi_info = proj_data["info"]
        latest_version = pypi_info["version"]
        proj_metadata = ProjectMetadata(
            latest_version,
            summary=pypi_info.get("summary"),
            home_page=pypi_info.get("home_page"),
            license=pypi_info.get("license"),
            documentation_url=pypi_info.get("project_urls", {}).get("Documentation"),
            classifiers=pypi_info.get("classifiers"),
            dependencies=parse_deps(pypi_info.get("requires_dist")),
        )
        src_url = None
        for artifact in proj_data["releases"][latest_version]:
            if artifact["packagetype"] == "sdist":
                src_url = artifact["url"]
                # src_md5 = artifact['md5_digest']
                break
        if not src_url:
            raise ValueError(
                f"Couldn't find sdist for {project_name}=={latest_version}"
            )

        # this is a bit unnecessary 🙃
        async with (
            client.stream("GET", src_url) as response,
            aiofiles.tempfile.NamedTemporaryFile("wb+", delete=False) as src_archive,
        ):
            async for chunk in response.aiter_bytes():
                await src_archive.write(chunk)

        with open_archive(src_archive.name) as opened:
            opened.extractall(directory)
        os.unlink(src_archive.name)

    return (pick_project_dir(directory), proj_metadata)
