# SPDX-FileCopyrightText: 2022-present U.N. Owen <void@some.where>
#
# SPDX-License-Identifier: MIT
from __future__ import annotations

import asyncio

import json
import logging
import os
import shutil
from functools import partial, wraps
from pathlib import Path

from typing import Callable, Coroutine, Iterable, ParamSpec, TypeVar

import click
import httpx
import rich
import rich.progress

from py_wtf.__about__ import __version__
from py_wtf.indexer import index_dir, index_file, index_project
from py_wtf.logging import setup_logging
from py_wtf.repository import converter, ProjectRepository
from py_wtf.types import Documentation, FQName, Project, ProjectMetadata, ProjectName


logger = logging.getLogger(__name__)
P = ParamSpec("P")
T = TypeVar("T")


def coroutine(f: Callable[P, Coroutine[None, None, T]]) -> Callable[P, T]:
    @wraps(f)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        return asyncio.run(f(*args, **kwargs))

    return wrapper


@click.group(
    context_settings={"help_option_names": ["-h", "--help"]},
    invoke_without_command=True,
)
@click.version_option(version=__version__, prog_name="py.wtf")
@click.option("--log-level", type=logging.getLevelName)
@click.pass_context
def py_wtf(ctx: click.Context, log_level: int | None) -> None:
    os.environ["LIBCST_PARSER_TYPE"] = "native"
    setup_logging(log_level)


@py_wtf.command()
@click.argument("directory")
@click.option("--project-name", required=True)
@click.option("--pretty", is_flag=True)
@click.option("--force", is_flag=True, help="Blow away index repository and reindex")
@coroutine
async def index(project_name: str, directory: str, pretty: bool, force: bool) -> None:
    out_dir = Path(directory)
    if force:
        shutil.rmtree(out_dir, ignore_errors=True)
    out_dir.mkdir(parents=True, exist_ok=True)
    repo = ProjectRepository(out_dir)

    proj = await repo.get(ProjectName(project_name), partial(index_project, repo=repo))

    if pretty:
        rich.print(proj)


@py_wtf.command()
@click.argument("directory")
@click.option("--top", type=int, default=50)
@coroutine
async def index_top_pypi(directory: str, top: int) -> None:
    out_dir = Path(directory)
    out_dir.mkdir(parents=True, exist_ok=True)
    repo = ProjectRepository(out_dir)
    async with httpx.AsyncClient() as client:
        top_pkgs = (
            await client.get(
                "https://hugovk.github.io/top-pypi-packages/top-pypi-packages-30-days.json"
            )
        ).json()
        projects: Iterable[str] = (row["project"] for row in top_pkgs["rows"][:top])

    with rich.progress.Progress(
        rich.progress.TimeElapsedColumn(),
        rich.progress.TextColumn("{task.fields[action]} {task.description}"),
        rich.progress.BarColumn(),
    ) as progress:
        progress.console.height = max(2, progress.console.height // 2)
        rets = await asyncio.gather(
            *[
                repo.get(
                    ProjectName(name),
                    partial(index_project, repo=repo, progress=progress),
                )
                for name in projects
            ],
            return_exceptions=True,
        )
        for ret in rets:
            if isinstance(ret, Exception):
                logger.exception(ret)


@py_wtf.command(name="index-file")
@click.argument("file")
def index_file_cmd(file: str) -> None:
    path = Path(file)
    mod = index_file(path.parent, path)
    rich.print(mod)


@py_wtf.command(name="index-dir")
@click.argument("dir")
@coroutine
async def index_dir_cmd(dir: str) -> None:
    path = Path(dir)
    cnt = 0
    async for mod in index_dir(path):
        cnt += 1
        rich.print(mod)
    rich.print(f"Found {cnt} modules in total.")


@py_wtf.command()
@click.argument("dir", required=False)
@coroutine
async def generate_test_index(dir: str | None) -> None:
    root_dir = Path(__file__).parent.parent.parent
    out_dir = Path(dir) if dir else root_dir / "www" / "public" / "_index"
    out_dir.mkdir(parents=True, exist_ok=True)
    fixtures = root_dir / "test_fixtures"
    for proj_dir in fixtures.iterdir():
        if not (proj_json := proj_dir / "project.json").exists():
            continue
        proj_metadata = json.loads(proj_json.read_bytes())
        proj_info = ProjectMetadata(
            proj_metadata["version"],
            classifiers=proj_metadata.get("classifiers"),
            home_page=proj_metadata.get("home_page"),
            license=proj_metadata.get("license"),
            documentation_url=proj_metadata.get("documentation_url"),
            dependencies=proj_metadata["dependencies"],
            summary=proj_metadata.get("summary"),
        )
        symbol_table = {FQName("alpha.bar"): ProjectName("project-alpha")}
        mods = [mod async for mod in index_dir(proj_dir, symbol_table)]
        proj = Project(
            ProjectName(proj_dir.name),
            metadata=proj_info,
            modules=mods,
            documentation=[Documentation(proj_info.summary or "")],
        )
        (out_dir / f"{proj.name}.json").write_text(converter.dumps(_sort(proj)))


def _sort(o: object) -> object:
    for i in dir(o):
        if i.startswith("_") or i == "documentation":
            continue
        if not isinstance(getattr(o, i), (list, tuple)):
            continue
        object.__setattr__(
            o, i, sorted((_sort(item) for item in getattr(o, i)), key=str)
        )
    return o
