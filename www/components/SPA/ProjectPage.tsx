import { useParams } from "react-router-dom";

import Project from "@/components/Docs/Project";
import FetchProject from "@/components/FetchProject";

import PageLayout from "../PageLayout";
import Sidebar from "../Sidebar/Sidebar";
import ContentWithSidebar from "../core/layout/ContentWithSidebar";

export default function ProjectPage() {
  const { prj } = useParams();

  return (
    <PageLayout title={`py.wtf: ${prj}`}>
      <FetchProject
        name={prj as string}
        content={(prj) => (
          <ContentWithSidebar sidebar={<Sidebar project={prj} />}>
            <Project prj={prj} />
          </ContentWithSidebar>
        )}
      />
    </PageLayout>
  );
}
