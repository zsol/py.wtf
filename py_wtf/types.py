from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, NewType, Sequence

from dataclasses_json import dataclass_json


Type = NewType("Type", str)
Documentation = NewType("Documentation", str)
FQName = NewType("FQName", str)


@dataclass_json
@dataclass(frozen=True)
class Variable:
    name: str
    type: Type | None
    documentation: Iterable[Documentation]


@dataclass_json
@dataclass(frozen=True)
class Parameter:
    name: str
    type: Type | None
    default: str | None


@dataclass_json
@dataclass(frozen=True)
class Function:
    name: str
    asynchronous: bool
    params: Iterable[Parameter]
    returns: Type | None
    documentation: Iterable[Documentation]


@dataclass_json
@dataclass(frozen=True)
class Class:
    name: str
    bases: Iterable[str]
    methods: Iterable[Function]
    class_variables: Iterable[Variable]
    instance_variables: Iterable[Variable]
    inner_classes: Iterable[Class]
    documentation: Iterable[Documentation]


@dataclass_json
@dataclass(frozen=True)
class Module:
    name: str
    documentation: Iterable[Documentation]
    functions: Iterable[Function]
    variables: Iterable[Variable]
    classes: Iterable[Class]
    exports: Iterable[FQName]


@dataclass_json
@dataclass(frozen=True)
class Project:
    name: str
    metadata: ProjectMetadata
    documentation: Iterable[Documentation]
    modules: Iterable[Module]


@dataclass
class ProjectMetadata:
    version: str
    classifiers: Sequence[str] | None
    home_page: str | None
    license: str | None
    documentation_url: str | None
    dependencies: Sequence[str]
    summary: str | None
