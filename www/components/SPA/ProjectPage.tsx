import { useParams } from "react-router-dom";

import Project from "@/components/Docs/Project";
import FetchProject from "@/components/FetchProject";

import PageLayout from "../PageLayout";
import Sidebar from "../Sidebar/Sidebar";
import ContentWithSidebar from "../core/layout/ContentWithSidebar";

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
  return (
    <PageLayout title={`py.wtf: ${prj}`}>
      <FetchProject
        name={prj}
        content={(prj) => (
          <ContentWithSidebar sidebar={<Sidebar project={prj} />}>
            <Project prj={prj} />
          </ContentWithSidebar>
        )}
      />
    </PageLayout>
  );
}
