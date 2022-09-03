from __future__ import annotations

import sys
from collections import UserDict

from dataclasses import dataclass
from typing import NewType, TYPE_CHECKING

if not TYPE_CHECKING:
    NewType = lambda _, ty: ty

Documentation = NewType("Documentation", str)
FQName = NewType("FQName", str)
ProjectName = NewType("ProjectName", str)


@dataclass(slots=True, frozen=True)
class XRef:
    fqname: FQName
    project: ProjectName | None = None


@dataclass(slots=True, frozen=True)
class Type:
    name: str
    xref: XRef | None
    params: None | list[Type] = None

    @property
    def is_dumb(self) -> bool:
        return self.xref is None


@dataclass(slots=True, frozen=True)
class Export:
    name: FQName
    xref: XRef


@dataclass(slots=True, frozen=True)
class Variable:
    name: str
    type: Type | None
    documentation: list[Documentation]


@dataclass(slots=True, frozen=True)
class Parameter:
    name: str
    type: Type | None
    default: str | None


@dataclass(slots=True, frozen=True)
class Function:
    name: str
    asynchronous: bool
    params: list[Parameter]
    returns: Type | None
    documentation: list[Documentation]


@dataclass(slots=True, frozen=True)
class Class:
    name: str
    bases: list[str]
    methods: list[Function]
    class_variables: list[Variable]
    instance_variables: list[Variable]
    inner_classes: list[Class]
    documentation: list[Documentation]


@dataclass(slots=True, frozen=True)
class Module:
    name: str
    documentation: list[Documentation]
    functions: list[Function]
    variables: list[Variable]
    classes: list[Class]
    exports: list[Export]


@dataclass(slots=True)
class ProjectMetadata:
    name: str
    version: str
    classifiers: list[str] | None
    home_page: str | None
    license: str | None
    documentation_url: str | None
    dependencies: list[str]
    summary: str | None
    upload_time: Timestamp = 0


@dataclass(slots=True, frozen=True)
class Project:
    name: ProjectName
    metadata: ProjectMetadata
    documentation: list[Documentation]
    modules: list[Module]


Timestamp = int


@dataclass(slots=True, frozen=True)
class Index:
    generated_at: Timestamp
    latest_projects: list[ProjectMetadata]
    top_projects: list[ProjectMetadata]
    all_project_names: list[ProjectName]


stdlib_project = ProjectName("__std__")


class SymbolTable(UserDict[FQName, ProjectName]):
    def __missing__(self, key: FQName) -> ProjectName:
        mod, *_ = key.split(".", 2)
        if mod in sys.stdlib_module_names:
            return stdlib_project
        raise KeyError(key)
