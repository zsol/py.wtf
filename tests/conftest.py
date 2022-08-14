import pytest
from py_wtf.types import Module, Project, ProjectMetadata, ProjectName


@pytest.fixture
def project() -> Project:
    return Project(
        name=ProjectName("testproject"),
        metadata=ProjectMetadata(
            version="1.1.1.1.1",
            classifiers=None,
            home_page=None,
            license=None,
            documentation_url=None,
            dependencies=[],
            summary=None,
        ),
        modules=[Module("foo", [], [], [], [], [])],
        documentation=[],
    )
