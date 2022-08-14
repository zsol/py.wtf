import json
import logging
from functools import partial
from pathlib import Path
from tarfile import is_tarfile, TarFile
from tempfile import TemporaryDirectory
from typing import Iterable, Sequence, Tuple
from urllib.request import urlopen, urlretrieve
from zipfile import is_zipfile, ZipFile

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
            for _, exp in mod.exports:
                ret[exp] = pname
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


def index_project(
    project_name: ProjectName, repo: ProjectRepository
) -> Iterable[Project]:
    logging.info(f"Indexing {project_name}")
    deps: list[Project] = []
    with TemporaryDirectory() as tmpdir:
        src_dir, info = download(project_name, Path(tmpdir))
        dep_project_names = [ProjectName(dep) for dep in info.dependencies]
        for name in dep_project_names:
            proj = repo.get(name, partial(index_project, repo=repo))
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


def download(project_name: str, directory: Path) -> Tuple[Path, ProjectMetadata]:
    with urlopen(f"https://pypi.org/pypi/{project_name}/json") as pypi:
        proj_data = json.load(pypi)
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
        raise ValueError(f"Couldn't find sdist for {project_name}=={latest_version}")
    src_archive, _ = urlretrieve(src_url)
    with open_archive(src_archive) as opened:
        opened.extractall(directory)

    return (pick_project_dir(directory), proj_metadata)
