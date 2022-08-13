from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Iterable

from py_wtf.types import Project, ProjectName


@dataclass(slots=True)
class ProjectRepository:
    directory: Path

    _cache: dict[ProjectName, Project] = field(init=False)

    def __post_init__(self) -> None:
        self._cache = {}

    def __getitem__(self, key: ProjectName) -> Project:
        if key not in self._cache:
            try:
                self._load_from_disk(key)
            except OSError:
                raise KeyError(key)

        return self._cache[key]

    def _index_file(self, key: ProjectName) -> Path:
        return self.directory / f"{key}.json"

    def _load_from_disk(self, key: ProjectName) -> None:
        index_file = self._index_file(key)
        index_contents = index_file.read_bytes()
        proj: Project = Project.from_json(index_contents)  # type: ignore
        self._cache[key] = proj

    def _save(self, project: Project) -> None:
        name = ProjectName(project.name)
        if name in self._cache:
            return

        self._cache[name] = project
        index_file = self._index_file(name)
        index_file.write_text(project.to_json())  # type: ignore

    def get(
        self,
        key: ProjectName,
        factory: Callable[[ProjectName], Iterable[Project]],
    ) -> Project:
        try:
            return self[key]
        except KeyError:
            pass  # continued below
        projects = factory(key)
        for project in projects:
            self._save(project)

        return self[key]
