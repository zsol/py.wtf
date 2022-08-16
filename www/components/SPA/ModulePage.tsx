import { useParams } from "react-router-dom";

import Module from "@/components/Docs/Module";
import FetchProject from "@/components/FetchProject";
import ModuleList from "@/components/Sidebar/ModuleList";

import PageLayout from "../PageLayout";
import Sidebar from "../Sidebar/Sidebar";
import ContentWithSidebar from "../core/layout/ContentWithSidebar";

export default function ModulePage() {
  const { prj: projectName, mod: modName } = useParams();
  if (modName === undefined) {
    return (
      <div>
        You did not make a choice, or follow any direction, but now, somehow,
        you are descending from space ...
      </div>
    );
  }
  return (
    <PageLayout title={`py.wtf: ${modName}`}>
      <FetchProject
        name={projectName}
        content={(prj) => {
          const mod = prj.modules.find((mod) => mod.name === modName);
          return (
            <ContentWithSidebar
              sidebar={
                <Sidebar project={prj}>
                  <ModuleList prj={prj} currentModule={mod} />
                </Sidebar>
              }
            >
              {mod ? (
                <Module prj={prj} mod={mod} />
              ) : (
                `Module "${modName}" not found 🤪`
              )}
            </ContentWithSidebar>
          );
        }}
      />
    </PageLayout>
  );
}
