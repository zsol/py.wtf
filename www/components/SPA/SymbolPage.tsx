import Head from "next/head";
import React from "react";
import { useParams } from "react-router-dom";

import Class from "@/components/Docs/Class";
import Function from "@/components/Docs/Function";
import Variable from "@/components/Docs/Variable";
import FetchProject from "@/components/FetchProject";
import ClassContents from "@/components/Sidebar/ClassContents";
import ModuleContents from "@/components/Sidebar/ModuleContents";
import ModuleList from "@/components/Sidebar/ModuleList";

import * as docs from "@/lib/docs";
import { withoutPrefix } from "@/lib/url";

import Sidebar from "../Sidebar/Sidebar";
import ContentWithSidebar from "../core/layout/ContentWithSidebar";

function resolveClass(mod: docs.Module, name: string): docs.Class | undefined {
  const parts = withoutPrefix(mod.name, name).split(".");
  let cls = mod.classes.find(
    (c) => withoutPrefix(mod.name, c.name) === parts.shift()
  );
  while (cls && parts.length) {
    const parentName = cls.name;
    cls = cls.inner_classes.find(
      (c) => withoutPrefix(parentName, c.name) === parts.shift()
    );
  }
  return cls;
}

export default function ModulePage() {
  const { prj: projectName, mod: modName, sym: symName } = useParams();
  if (symName === undefined) {
    return <div>Missing "sym" parameter, how did you even get here?</div>;
  }
  return (
    <>
      <Head>
        <title>
          py.wtf: {modName}.{symName}
        </title>
      </Head>
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
            const symbol = cls || func || variable;

            if (!symbol) {
              return [
                <ModuleList prj={prj} />,
                `Symbol ${symName} not found 🤪`,
              ];
            }

            const sidebarContent = cls ? (
              <>
                <ClassContents prj={prj} mod={mod} cls={cls} currentSymbol="" />
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
    </>
  );
}
