import asyncio
import logging
from asyncio import CancelledError, Future, InvalidStateError
from collections import Counter, defaultdict
from dataclasses import dataclass, field, replace
from pathlib import Path
from time import time
from typing import AsyncIterable, Callable, Tuple

from cattrs.preconf.json import make_converter
from keke import ktrace

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

    @ktrace("project.name")
    def _save(self, project: Project) -> None:
        name = ProjectName(project.name)
        if self._cache[name].done():
            return

        self._cache[name].set_result(project)
        index_file = self._index_file(name)
        index_file.write_text(converter.dumps(project))

    def __contains__(self, key: ProjectName) -> bool:
        if key in self._cache:
            return self._cache[key].done()

        try:
            self._load_from_disk(key)
            return True
        except OSError:
            return False

    @ktrace("key")
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
            fut.set_exception(ValueError(f"{key} was never yielded by factory"))
        return fut.result()

    def generate_index(
        self, timestamp: int | None, skip_hydration: bool = False
    ) -> Index:
        max_counts = 5
        project_mtimes: list[Tuple[ProjectName, float]] = []
        all_project_names: list[ProjectName] = []
        dep_counts: Counter[str] = Counter()

        if not skip_hydration:
            for item in self.directory.iterdir():
                if item.suffix != ".json" or not item.is_file():
                    continue
                name = ProjectName(item.stem)
                if name not in self._cache:
                    self._load_from_disk(name)

        for name, proj_fut in self._cache.items():
            all_project_names.append(name)
            try:
                project = proj_fut.result()
                for dep in project.metadata.dependencies:
                    dep_counts[dep] += 1
                project_mtimes.append((name, project.metadata.upload_time))
            except (CancelledError, InvalidStateError):
                logger.error(f"Project {name} hasn't finished indexing")

        latest_projects = [
            self._cache[name].result().metadata
            for name, _ in sorted(
                project_mtimes, key=lambda item: item[1], reverse=True
            )[:max_counts]
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
            all_project_names=sorted(all_project_names),
        )

    def write_index(self, timestamp: int | None = None) -> None:
        metadata = self.directory / METADATA_FILENAME
        metadata.write_text(converter.dumps(self.generate_index(timestamp)))

    def update_index(self) -> None:
        metadata = self.directory / METADATA_FILENAME
        index = converter.loads(metadata.read_text(), Index)
        new_index = self.generate_index(int(time()), skip_hydration=True)
        index = replace(
            index,
            generated_at=new_index.generated_at,
            latest_projects=sorted(
                index.latest_projects + new_index.latest_projects,
                key=lambda m: m.upload_time,
                reverse=True,
            )[:5],
            all_project_names=sorted(
                {*index.all_project_names, *new_index.all_project_names}
            ),
        )
        metadata.write_text(converter.dumps(index))

    def pending_items(self) -> None:
        pending = []
        for name, fut in self._cache.items():
            if not fut.done():
                pending.append(name)
        if pending:
            logger.warning(f"{len(pending)} projects are pending: {pending}")
        else:
            logger.info("No projects pending")
