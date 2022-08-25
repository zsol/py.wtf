import useFetchModule from "hooks/fetchModule";
import { useParams } from "react-router-dom";

import Module from "@/components/Docs/Module";
import ModuleList from "@/components/Sidebar/ModuleList";

import Header from "../Header";
import PageLayout from "../PageLayout";
import Sidebar from "../Sidebar/Sidebar";
import ContentWithSidebar from "../core/layout/ContentWithSidebar";

export default function ModulePage() {
  const { prj: projectName, mod: moduleName } = useParams();

  if (projectName == null || moduleName == null) {
    return (
      <div>
        You did not make a choice, or follow any direction, but now, somehow,
        you are descending from space ...
      </div>
    );
  }

  const { project, module, projectJsonUrl, isLoading, error } = useFetchModule(
    projectName,
    moduleName,
  );

  if (project && module) {
    return (
      <PageLayout
        title={`py.wtf: ${module.name}`}
        header={<Header project={project} />}
      >
        <ContentWithSidebar
          sidebar={
            <Sidebar project={project}>
              <ModuleList prj={project} currentModule={module} />
            </Sidebar>
          }
        >
          {module ? (
            <Module prj={project} mod={module} />
          ) : (
            `Module "${moduleName}" not found 🤪`
          )}
        </ContentWithSidebar>
      </PageLayout>
    );
  }

  // TODO: Make this a common component
  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && (
        <div>
          Failed to load <code>{projectJsonUrl}</code>: {error.message}
        </div>
      )}
    </div>
  );
}
