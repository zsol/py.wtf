import useFetchProject from "hooks/fetchProject";
import { useParams } from "react-router-dom";

import Project from "@/components/Docs/Project";

import Header from "../Header";
import PageLayout from "../PageLayout";
import ModuleList from "../Sidebar/ModuleList";
import Sidebar from "../Sidebar/Sidebar";
import ContentWithSidebar from "../core/layout/ContentWithSidebar";
import Loading from "./Loading";

export default function ProjectPage() {
  const { prj } = useParams();

  if (prj === undefined) {
    return (
      <div>
        You did not make a choice, or follow any direction, but now, somehow,
        you are descending from space ...
      </div>
    );
  }

  const { project, error, isLoading, projectJsonUrl } = useFetchProject(prj);

  if (project) {
    return (
      <PageLayout
        title={`py.wtf: ${project.name}`}
        header={<Header project={project} />}
      >
        <ContentWithSidebar
          sidebar={
            <Sidebar project={project}>
              <ModuleList prj={project} />
            </Sidebar>
          }
        >
          <Project prj={project} />
        </ContentWithSidebar>
      </PageLayout>
    );
  }

  return Loading(projectJsonUrl, isLoading, error);
}
