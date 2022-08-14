from dataclasses import dataclass
from typing import NewType, TYPE_CHECKING


if not TYPE_CHECKING:
    NewType = lambda _, ty: ty

Type = NewType("Type", str)
Documentation = NewType("Documentation", str)
FQName = NewType("FQName", str)
ProjectName = NewType("ProjectName", str)


@dataclass(frozen=True)
class Variable:
    name: str
    type: Type | None
    documentation: list[Documentation]


@dataclass(frozen=True)
class Parameter:
    name: str
    type: Type | None
    default: str | None


@dataclass(frozen=True)
class Function:
    name: str
    asynchronous: bool
    params: list[Parameter]
    returns: Type | None
    documentation: list[Documentation]


@dataclass(frozen=True)
class Class:
    name: str
    bases: list[str]
    methods: list[Function]
    class_variables: list[Variable]
    instance_variables: list[Variable]
    inner_classes: list["Class"]
    documentation: list[Documentation]


@dataclass(frozen=True)
class Module:
    name: str
    documentation: list[Documentation]
    functions: list[Function]
    variables: list[Variable]
    classes: list[Class]
    exports: list[tuple[ProjectName | None, FQName]]


@dataclass
class ProjectMetadata:
    version: str
    classifiers: list[str] | None
    home_page: str | None
    license: str | None
    documentation_url: str | None
    dependencies: list[str]
    summary: str | None


@dataclass(frozen=True)
class Project:
    name: ProjectName
    metadata: ProjectMetadata
    documentation: list[Documentation]
    modules: list[Module]


SymbolTable = dict[FQName, ProjectName]
