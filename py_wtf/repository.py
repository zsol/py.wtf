import asyncio
from asyncio import Future
from collections import defaultdict
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
        self._cache = defaultdict(
            lambda: Future(loop=asyncio.get_event_loop_policy().get_event_loop())
        )

    def _index_file(self, key: ProjectName) -> Path:
        return self.directory / f"{key}.json"

    def _load_from_disk(self, key: ProjectName) -> None:
        index_file = self._index_file(key)
        index_contents = index_file.read_bytes()
        proj = converter.loads(index_contents, Project)
        self._cache[key].set_result(proj)

    def _save(self, project: Project) -> None:
        name = ProjectName(project.name)
        if self._cache[name].done():
            return

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

        # It's important to force the creation of this future before we await
        # to make sure everyone awaits on the same future and so avoid duplicating work
        fut = self._cache[key]

        async for project in factory(key):
            self._save(project)

        return await fut
