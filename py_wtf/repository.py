import asyncio
import logging
from asyncio import Future
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from time import time
from typing import AsyncIterable, Callable, Tuple

from cattrs.preconf.json import make_converter

from py_wtf.types import Index, Project, ProjectMetadata, ProjectName

converter = make_converter()
logger = logging.getLogger(__name__)

METADATA_FILENAME = ".metadata"


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

        if not fut.done():
            raise ValueError(f"{key} was never yielded by {factory}")
        return fut.result()

    def generate_index(self, timestamp: int | None) -> Index:
        max_counts = 5
        latest_project_mtimes: list[Tuple[ProjectName, float]] = []
        all_project_names: list[ProjectName] = []
        dep_counts: Counter[str] = Counter()

        for item in self.directory.iterdir():
            if item.suffix != ".json" or not item.is_file():
                continue
            name = ProjectName(item.stem)
            all_project_names.append(name)
            if name not in self._cache:
                self._load_from_disk(name)
            project = self._cache[name].result()

            for dep in project.metadata.dependencies:
                dep_counts[dep] += 1

            mtime = project.metadata.upload_time
            if latest_project_mtimes == []:
                latest_project_mtimes.append((name, mtime))
            for i in reversed(range(len(latest_project_mtimes))):
                if mtime < latest_project_mtimes[i][1]:
                    latest_project_mtimes.insert(i + 1, (name, mtime))
            while len(latest_project_mtimes) > max_counts:
                latest_project_mtimes.pop()

        latest_projects = [
            self._cache[name].result().metadata for name, _ in latest_project_mtimes
        ]
        top_projects: list[ProjectMetadata] = []
        for rawname, _ in dep_counts.most_common(max_counts):
            prjname = ProjectName(rawname)
            if prjname not in self._cache:
                logger.error(f"Top-{max_counts} project '{rawname}' not indexed.")
                continue
            top_projects.append(self._cache[prjname].result().metadata)

        return Index(
            generated_at=int(time()) if timestamp is None else timestamp,
            latest_projects=latest_projects,
            top_projects=top_projects,
            all_project_names=all_project_names,
        )

    def write_index(self, timestamp: int | None = None) -> None:
        metadata = self.directory / METADATA_FILENAME
        metadata.write_text(converter.dumps(self.generate_index(timestamp)))
