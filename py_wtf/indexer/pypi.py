import asyncio
import logging
import multiprocessing
import os
from concurrent.futures import ProcessPoolExecutor
from dataclasses import replace
from datetime import datetime, timezone
from functools import partial
from pathlib import Path
from tarfile import is_tarfile, TarFile
from tempfile import TemporaryDirectory
from typing import AsyncIterable, Iterable, Sequence, Tuple, TypedDict
from zipfile import is_zipfile, ZipFile

import aiofiles.tempfile
import httpx

from packaging.requirements import Requirement
from rich.progress import Progress, TaskID

from py_wtf.logging import setup_logging

from py_wtf.repository import ProjectRepository

from py_wtf.types import FQName, Project, ProjectMetadata, ProjectName, SymbolTable
from .file import index_dir

logger = logging.getLogger(__name__)


def _build_symbol_table(projects: Iterable[Project]) -> SymbolTable:
    ret = SymbolTable()
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


executor = ProcessPoolExecutor(
    initializer=setup_logging,
    initargs=(
        logging.getLogger().level,
        True,
    ),
    mp_context=multiprocessing.get_context("spawn"),
)
PROJECT_BLOCKLIST = frozenset(
    {
        "poetry-plugin-export",  # circular dependency on poetry
    }
)


def blocklisted_project_factory(project_name: ProjectName) -> Project:
    return Project(
        project_name,
        ProjectMetadata(
            project_name,
            version="BLOCKLISTED",
            classifiers=None,
            home_page=None,
            license=None,
            documentation_url=None,
            dependencies=[],
            summary="BLOCKLISTED",
            upload_time=0,
        ),
        documentation=[],
        modules=[],
    )


async def index_project(
    project_name: ProjectName, repo: ProjectRepository, progress: Progress | None = None
) -> AsyncIterable[Project]:
    if project_name in PROJECT_BLOCKLIST:
        yield blocklisted_project_factory(project_name)
        return
    task_id = TaskID(0)
    if progress:
        task_id = progress.add_task(project_name, action="Fetching", total=3)
    deps: list[Project] = []
    with TemporaryDirectory() as tmpdir:
        src_dir, info = await download(project_name, Path(tmpdir))
        if progress:
            progress.update(
                task_id, action="Gathering deps for", visible=False, advance=1
            )
        dep_project_names = [ProjectName(dep) for dep in info.dependencies]

        dep_projects = await asyncio.gather(
            *[
                repo.get(name, partial(index_project, repo=repo, progress=progress))
                for name in dep_project_names
            ],
            return_exceptions=True,
        )

        for i, proj in enumerate(dep_projects):
            if isinstance(proj, Exception):
                logger.error(f"Error in {dep_project_names[i]}", exc_info=proj)
                continue
            deps.append(proj)

        symbols = _build_symbol_table(deps)

        if progress:
            progress.update(task_id, action="Indexing", visible=True, advance=1)

        modules = [mod async for mod in index_dir(src_dir, symbols, executor)]

        if progress:
            progress.advance(task_id)

    proj = Project(
        project_name,
        metadata=info,
        modules=modules,
        documentation=[],
    )
    if progress:
        progress.update(task_id, visible=False)
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


def parse_upload_time(time: str) -> int:
    try:
        dt = datetime.strptime(time, "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)
        return int(dt.timestamp())
    except ValueError:
        return 0


class Artifact(TypedDict):
    filename: str
    url: str
    yanked: bool
    packagetype: str
    upload_time: str


def pick_artifact(artifacts: list[Artifact]) -> Artifact | None:
    sdist: Artifact | None = None
    candidate: Artifact | None = None
    for a in artifacts:
        if a["yanked"]:
            continue
        if a["packagetype"] == "sdist":
            sdist = a
        if a["packagetype"] == "bdist_wheel" and a["filename"].endswith(
            "-none-any.whl"
        ):
            candidate = a
            break

    if candidate is None:
        candidate = sdist
    return candidate


sem = asyncio.BoundedSemaphore(value=20)


async def download(project_name: str, directory: Path) -> Tuple[Path, ProjectMetadata]:
    async with sem, httpx.AsyncClient(timeout=httpx.Timeout(None)) as client:
        proj_data = (
            await client.get(f"https://pypi.org/pypi/{project_name}/json")
        ).json()
        pypi_info = proj_data["info"]
        latest_version = pypi_info["version"]
        project_urls = pypi_info.get("project_urls") or {}
        proj_metadata = ProjectMetadata(
            pypi_info.get("name", project_name),
            latest_version,
            summary=pypi_info.get("summary"),
            home_page=pypi_info.get("home_page"),
            license=pypi_info.get("license"),
            documentation_url=project_urls.get("Documentation"),
            classifiers=pypi_info.get("classifiers"),
            dependencies=parse_deps(pypi_info.get("requires_dist")),
        )
        artifact = pick_artifact(proj_data["releases"][latest_version])
        if not artifact:
            error = (
                f"Couldn't find suitable artifact for {project_name}=={latest_version}"
            )
            logger.warning(error)
            return (directory, replace(proj_metadata, summary=error))

        proj_metadata = replace(
            proj_metadata,
            upload_time=parse_upload_time(artifact["upload_time"]),
        )

        # this is a bit unnecessary 🙃
        async with (
            client.stream("GET", artifact["url"]) as response,
            aiofiles.tempfile.NamedTemporaryFile("wb+", delete=False) as src_archive,
        ):
            async for chunk in response.aiter_bytes():
                await src_archive.write(chunk)

        archive_name = str(src_archive.name)
        with open_archive(archive_name) as opened:
            opened.extractall(directory)
        os.unlink(archive_name)

    return (
        pick_project_dir(directory)
        if artifact["packagetype"] == "sdist"
        else directory,
        proj_metadata,
    )
