from dataclasses import replace
from pathlib import Path
from typing import AsyncIterable

import pytest
from py_wtf.repository import converter, METADATA_FILENAME, ProjectRepository
from py_wtf.types import Index, Project, ProjectMetadata, ProjectName


@pytest.fixture
def project() -> Project:
    name = ProjectName("testproject")
    return Project(
        name,
        metadata=ProjectMetadata(
            name,
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
    assert repo._cache[project.name].result() == project


def test_save_writes_to_disk(repo: ProjectRepository, project: Project) -> None:
    repo._save(project)
    assert (repo.directory / f"{project.name}.json").exists()


@pytest.mark.asyncio
async def test_get_loads_from_disk(repo: ProjectRepository, project: Project) -> None:
    index_file = repo.directory / f"{project.name}.json"
    index_file.write_text(converter.dumps(project))

    async def _factory(_: ProjectName) -> AsyncIterable[Project]:
        # this should never be called
        assert False
        yield project

    got = await repo.get(project.name, _factory)
    assert got == project


def test_double_save(repo: ProjectRepository, project: Project) -> None:
    other_project = replace(project, documentation=["foo"])
    assert project != other_project
    repo._save(project)
    assert repo._cache[project.name].result() == project
    repo._save(other_project)
    assert repo._cache[other_project.name].result() == project


@pytest.mark.asyncio
async def test_get_with_bad_factory(repo: ProjectRepository, project: Project) -> None:
    async def _factory(_: ProjectName) -> AsyncIterable[Project]:
        yield project

    with pytest.raises(ValueError):
        await repo.get(ProjectName("DefinitelyNotproject.name"), _factory)


def test_update_index(repo: ProjectRepository, project: Project) -> None:
    metadata_file = repo.directory / METADATA_FILENAME
    repo._save(project)
    repo.write_index(timestamp=1)
    metadata_before = converter.loads(metadata_file.read_text(), Index)
    assert metadata_before.generated_at == 1
    repo._save(
        replace(
            project,
            name=ProjectName("other"),
            metadata=replace(
                project.metadata,
                name=ProjectName("other"),
                upload_time=project.metadata.upload_time + 1,
            ),
        )
    )
    repo.update_index()
    metadata_after = converter.loads(metadata_file.read_text(), Index)
    assert metadata_after.generated_at > metadata_before.generated_at
    assert metadata_after.latest_projects[0].name == "other"
    assert metadata_after.latest_projects[1].name == project.name
