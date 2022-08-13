# SPDX-FileCopyrightText: 2022-present U.N. Owen <void@some.where>
#
# SPDX-License-Identifier: MIT
from __future__ import annotations

import json
import os
import shutil
from pathlib import Path

import click
import rich

from py_wtf.__about__ import __version__
from py_wtf.indexer import index_dir, index_file, index_project
from py_wtf.repository import ProjectRepository
from py_wtf.types import Documentation, Project, ProjectMetadata, ProjectName


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
@click.option("--project-name", required=True)
@click.option("--pretty", is_flag=True)
@click.option("--force", is_flag=True, help="Blow away index repository and reindex")
def index(project_name: str, directory: str, pretty: bool, force: bool) -> None:
    out_dir = Path(directory)
    if force:
        shutil.rmtree(out_dir, ignore_errors=True)
    out_dir.mkdir(parents=True, exist_ok=True)
    repo = ProjectRepository(out_dir)

    proj = repo.get(ProjectName(project_name), index_project)

    if pretty:
        rich.print(proj)


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


@py_wtf.command()
def generate_test_index() -> None:
    root_dir = Path(__file__).parent.parent.parent
    out_dir = root_dir / "www" / "public" / "_index"
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
        mods = index_dir(proj_dir)
        proj = Project(
            ProjectName(proj_dir.name),
            metadata=proj_info,
            modules=list(mods),
            documentation=[Documentation(proj_info.summary or "")],
        )
        (out_dir / f"{proj.name}.json").write_text(proj.to_json())  # type: ignore
