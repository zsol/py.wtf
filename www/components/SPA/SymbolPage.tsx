import useFetchSymbol from "hooks/fetchSymbol";
import { Navigate, useParams } from "react-router-dom";

import Class from "@/components/Docs/Class";
import Function from "@/components/Docs/Function";
import Variable from "@/components/Docs/Variable";
import ClassContents from "@/components/Sidebar/ClassContents";
import ModuleContents from "@/components/Sidebar/ModuleContents";
import ModuleList from "@/components/Sidebar/ModuleList";

import * as docs from "@/lib/docs";
import { xref } from "@/lib/url";

import Header from "../Header";
import PageLayout from "../PageLayout";
import Sidebar from "../Sidebar/Sidebar";
import ContentWithSidebar from "../core/layout/ContentWithSidebar";

export default function SymbolPage() {
  const { prj: projectName, mod: moduleName, sym: symbolName } = useParams();

  if (projectName == null || symbolName == null || moduleName == null) {
    return (
      <div>
        You did not make a choice, or follow any direction, but now, somehow,
        you are descending from space ...
      </div>
    );
  }

  const { project, module, symbol, symbolType, isLoading, error } =
    useFetchSymbol(projectName, moduleName, symbolName);

  const getSidebarContent = () => {
    // TODO: think about this scenario
    if (!project) {
      return null;
    }

    if (!module || !symbol) {
      return <ModuleList prj={project} />;
    } else if (symbolType === "class") {
      return (
        <>
          <ClassContents
            prj={project}
            mod={module}
            cls={symbol as docs.Class}
            currentSymbol={window.location.hash.slice(1)}
          />
          <ModuleContents prj={project} mod={module} currentSymbol={symbol.name} />
        </>
      );
    } else {
      return (
        <ModuleContents
          prj={project}
          mod={module}
          currentSymbol={symbol.name}
        />
      );
    }
  };

  const getContent = () => {
    // TODO: think about this scenario
    if (!project) {
      return null;
    } else if (!module) {
      return `Module ${moduleName || ""} not found 🤪`;
    } else if (!symbol) {
      return `Symbol ${symbolName} not found 🤪`;
    } else if (symbolType === "class") {
      return <Class cls={symbol as docs.Class} project={project} />;
    } else if (symbolType === "function") {
      return (
        <Function
          func={symbol as docs.Func}
          key={symbol.name}
          project={project}
        />
      );
    } else if (symbolType === "variable") {
      return <Variable variable={symbol as docs.Variable} project={project} />;
    }
  };

  if (project) {
    if (symbolType === "export") {
      const to = xref(project, (symbol as docs.Export).xref);
      return (
        <Navigate to={to ?? `/${projectName}/${moduleName}`} replace={true} />
      );
    }

    return (
      <PageLayout
        title={`py.wtf: ${moduleName}.${symbolName}`}
        header={<Header project={project} />}
      >
        <ContentWithSidebar
          sidebar={<Sidebar project={project}>{getSidebarContent()}</Sidebar>}
        >
          {getContent()}
        </ContentWithSidebar>
      </PageLayout>
    );
  }

  // TODO: Make this a common component
  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Failed to load: {error.message}</div>}
    </div>
  );
}
