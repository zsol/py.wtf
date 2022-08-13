from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, NewType, Sequence

from dataclasses_json import dataclass_json  # type: ignore
import sphinx.parsers
import sphinx.config
import docutils.utils
import docutils.frontend


Type = NewType("Type", str)
FQName = NewType("FQName", str)

rst_parser = sphinx.parsers.RSTParser()
rst_settings = docutils.frontend.OptionParser(components=(sphinx.parsers.RSTParser,)).get_default_values()
rst_parser.config = sphinx.config.Config()
class Documentation(str):
    def __new__(cls, value, *args, **kwargs):
        document = docutils.utils.new_document("<py-wtf/indexer/string>", rst_settings)
        rst_parser.parse(value, document)
        return super().__new__(cls, document.astext(), *args, **kwargs)


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
