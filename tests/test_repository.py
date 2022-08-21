from dataclasses import replace
from pathlib import Path
from typing import AsyncIterable

import pytest
from py_wtf.repository import converter, ProjectRepository
from py_wtf.types import Project, ProjectMetadata, ProjectName


@pytest.fixture
def project() -> Project:
    return Project(
        name=ProjectName("testproject"),
        metadata=ProjectMetadata(
            version="1.1.1.1.1",
            classifiers=None,
            home_page=None,
            license=None,
            documentation_url=None,
            dependencies=[],
            summary=None,
        ),
        modules=[],
        documentation=[],
    )


@pytest.fixture
def repo(tmp_path: Path) -> ProjectRepository:
    return ProjectRepository(tmp_path)


def test_empty_raises(repo: ProjectRepository) -> None:
    with pytest.raises(KeyError):
        repo[ProjectName("foo")]


@pytest.mark.asyncio
async def test_get_calls_factory_once(
    repo: ProjectRepository, project: Project
) -> None:
    called = False

    async def factory(key: ProjectName) -> AsyncIterable[Project]:
        nonlocal called
        called = True
        yield project

    ret = await repo.get(project.name, factory)
    assert called
    assert ret == project

    called = False

    ret = await repo.get(project.name, factory)
    assert not called
    assert ret == project


def test_index_works(repo: ProjectRepository, project: Project) -> None:
    repo._save(project)
    assert repo[project.name] == project


def test_save_writes_to_disk(repo: ProjectRepository, project: Project) -> None:
    repo._save(project)
    assert (repo.directory / f"{project.name}.json").exists()


def test_getitem_loads_from_disk(repo: ProjectRepository, project: Project) -> None:
    index_file = repo.directory / f"{project.name}.json"
    index_file.write_text(converter.dumps(project))
    assert repo[project.name] == project


def test_double_save(repo: ProjectRepository, project: Project) -> None:
    other_project = replace(project, documentation=["foo"])
    assert project != other_project
    repo._save(project)
    assert repo[project.name] == project
    repo._save(other_project)
    assert repo[other_project.name] == project
