import asyncio
from asyncio import Future
from dataclasses import dataclass, field
from pathlib import Path
from typing import AsyncIterable, Callable

from cattrs.preconf.json import make_converter

from py_wtf.types import Project, ProjectName

converter = make_converter()


@dataclass(slots=True)
class ProjectRepository:
    directory: Path

    _cache: dict[ProjectName, Future[Project]] = field(init=False)

    def __post_init__(self) -> None:
        self._cache = {}

    def __getitem__(self, key: ProjectName) -> Project:
        if key not in self._cache:
            try:
                self._load_from_disk(key)
            except OSError:
                raise KeyError(key)

        fut = self._cache[key]
        if not fut.done():
            raise KeyError(key)

        return fut.result()

    def _index_file(self, key: ProjectName) -> Path:
        return self.directory / f"{key}.json"

    def _load_from_disk(self, key: ProjectName) -> None:
        index_file = self._index_file(key)
        index_contents = index_file.read_bytes()
        proj = converter.loads(index_contents, Project)
        loop = asyncio.get_event_loop_policy().get_event_loop()
        self._cache[key] = Future(loop=loop)
        self._cache[key].set_result(proj)

    def _save(self, project: Project) -> None:
        name = ProjectName(project.name)
        if name in self._cache and self._cache[name].done():
            return

        if name not in self._cache:
            loop = asyncio.get_event_loop_policy().get_event_loop()
            self._cache[name] = Future(loop=loop)
        self._cache[name].set_result(project)
        index_file = self._index_file(name)
        index_file.write_text(converter.dumps(project))

    async def get(
        self,
        key: ProjectName,
        factory: Callable[[ProjectName], AsyncIterable[Project]],
    ) -> Project:
        if key in self._cache:
            return await self._cache[key]

        try:
            self._load_from_disk(key)
            return await self._cache[key]
        except OSError:
            pass  # continued below

        self._cache[key] = Future()

        async for project in factory(key):
            self._save(project)

        return self[key]
