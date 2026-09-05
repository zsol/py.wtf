import asyncio
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


@pytest.mark.asyncio
async def test_concurrent_get_shares_pending_project(
    repo: ProjectRepository, project: Project
) -> None:
    started = asyncio.Event()
    release = asyncio.Event()
    calls = 0

    async def factory(key: ProjectName) -> AsyncIterable[Project]:
        nonlocal calls
        calls += 1
        started.set()
        await release.wait()
        yield project

    async with asyncio.timeout(5):
        first = asyncio.create_task(repo.get(project.name, factory))
        await started.wait()
        second = asyncio.create_task(repo.get(project.name, factory))
        await asyncio.sleep(0)
        assert not second.done()
        release.set()
        assert await asyncio.gather(first, second) == [project, project]
    assert calls == 1


def test_disk_index_without_event_loop(
    repo: ProjectRepository, project: Project
) -> None:
    (repo.directory / f"{project.name}.json").write_text(converter.dumps(project))
    index = repo.generate_index(timestamp=123)
    assert index.all_project_names == [project.name]
    assert index.latest_projects == [project.metadata]


@pytest.mark.asyncio
async def test_index_with_pending_dependency(
    repo: ProjectRepository, project: Project, caplog: pytest.LogCaptureFixture
) -> None:
    pending = ProjectName("pending")
    started = asyncio.Event()
    release = asyncio.Event()

    async def factory(key: ProjectName) -> AsyncIterable[Project]:
        started.set()
        await release.wait()
        yield replace(project, name=key, metadata=replace(project.metadata, name=key))

    repo._save(
        replace(project, metadata=replace(project.metadata, dependencies=[pending]))
    )
    async with asyncio.timeout(5):
        task = asyncio.create_task(repo.get(pending, factory))
        await started.wait()
        try:
            # Run outside the event loop so a blocking regression can time out.
            index = await asyncio.to_thread(repo.generate_index, timestamp=123)
            assert index.all_project_names == [pending, project.name]
            assert [item.name for item in index.latest_projects] == [project.name]
            assert index.top_projects == []
            assert "hasn't finished indexing" in caplog.text
            assert not task.done()
        finally:
            release.set()
            await task
