import { Navigate, useParams } from "react-router-dom";

import Class from "@/components/Docs/Class";
import Function from "@/components/Docs/Function";
import Variable from "@/components/Docs/Variable";
import FetchProject from "@/components/FetchProject";
import ClassContents from "@/components/Sidebar/ClassContents";
import ModuleContents from "@/components/Sidebar/ModuleContents";
import ModuleList from "@/components/Sidebar/ModuleList";

import * as docs from "@/lib/docs";
import { withoutPrefix, xref } from "@/lib/url";

import PageLayout from "../PageLayout";
import Sidebar from "../Sidebar/Sidebar";
import ContentWithSidebar from "../core/layout/ContentWithSidebar";

function resolveClass(mod: docs.Module, name: string): docs.Class | undefined {
  // `name` can refer to an inner class like Foo.Bar
  const parts = withoutPrefix(mod.name, name).split(".");
  // First find a module-level class that matches Foo
  let cls = mod.classes.find(
    (c) => withoutPrefix(mod.name, c.name) === parts[0]
  );
  parts.shift();
  // Keep looking in inner classes until we find a match
  while (cls && parts.length) {
    const parentName = cls.name;
    cls = cls.inner_classes.find(
      (c) => withoutPrefix(parentName, c.name) === parts[0]
    );
    parts.shift();
  }
  return cls;
}

export default function SymbolPage() {
  const { prj: projectName, mod: modName, sym: symName } = useParams();
  if (symName === undefined || modName === undefined) {
    return (
      <div>
        You did not make a choice, or follow any direction, but now, somehow,
        you are descending from space ...
      </div>
    );
  }
  return (
    <PageLayout title={`py.wtf: ${modName}.${symName}`}>
      <FetchProject
        name={projectName}
        content={(prj) => {
          const [sidebarContent, content] = (() => {
            const mod = prj.modules.find((mod) => mod.name === modName);
            if (!mod) {
              return [
                <ModuleList prj={prj} />,
                `Module ${modName || ""} not found 🤪`,
              ];
            }

            const cls = resolveClass(mod, symName);
            const func = mod.functions.find(
              (func) => withoutPrefix(mod.name, func.name) === symName
            );
            const variable = mod.variables.find(
              (variable) => withoutPrefix(mod.name, variable.name) === symName
            );
            const exp = mod.exports.find(
              (exp) => withoutPrefix(mod.name, exp.name) === symName
            );
            const symbol = cls || func || variable || exp;

            if (!symbol) {
              return [
                <ModuleList prj={prj} />,
                `Symbol ${symName} not found 🤪`,
              ];
            }

            if (exp) {
              const to = xref(prj, exp.xref);
              return [
                <></>,
                <Navigate
                  to={to ?? `/${prj.name}/${mod.name}`}
                  replace={true}
                />,
              ];
            }

            const sidebarContent = cls ? (
              <>
                <ClassContents
                  prj={prj}
                  mod={mod}
                  cls={cls}
                  currentSymbol={window.location.hash.slice(1)}
                />
                <ModuleContents prj={prj} mod={mod} currentSymbol="" />
              </>
            ) : (
              <ModuleContents prj={prj} mod={mod} currentSymbol={symbol.name} />
            );

            if (cls) {
              return [sidebarContent, <Class cls={cls} project={prj} />];
            } else if (func) {
              return [
                sidebarContent,
                <>
                  {mod.functions
                    .filter((f) => f.name === symbol.name)
                    .map((f) => (
                      <Function func={f} key={f.name} project={prj} />
                    ))}
                </>,
              ];
            } else {
              // variable
              return [
                sidebarContent,
                <>
                  {mod.variables
                    .filter((v) => v.name === symbol.name)
                    .map((v) => (
                      <Variable variable={v} project={prj} />
                    ))}
                </>,
              ];
            }
          })();

          return (
            <ContentWithSidebar
              sidebar={<Sidebar project={prj}>{sidebarContent}</Sidebar>}
            >
              {content}
            </ContentWithSidebar>
          );
        }}
      />
    </PageLayout>
  );
}
