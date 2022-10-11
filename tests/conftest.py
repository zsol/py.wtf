import pytest
from py_wtf.types import FQName, Module, Project, ProjectMetadata, ProjectName


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
        modules=[Module(FQName("foo"), [], [], [], [], [])],
        documentation=[],
    )
