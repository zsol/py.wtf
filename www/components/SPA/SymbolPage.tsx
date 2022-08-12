import Head from "next/head";
import React from "react";
import { useParams } from "react-router-dom";

import Class from "@/components/Docs/Class";
import Function from "@/components/Docs/Function";
import Variable from "@/components/Docs/Variable";
import FetchPackage from "@/components/FetchPackage";
import Layout from "@/components/Layout";
import ClassContents from "@/components/Sidebar/ClassContents";
import ModuleContents from "@/components/Sidebar/ModuleContents";
import ModuleList from "@/components/Sidebar/ModuleList";

import * as docs from "@/lib/docs";
import { withoutPrefix } from "@/lib/url";

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
  const { pkg: pkgName, mod: modName, sym: symName } = useParams();
  if (symName === undefined) {
    return <div>`Missing "sym" parameter, how did you even get here?`</div>;
  }
  return (
    <>
      <Head>
        <title>
          py.wtf: {modName}.{symName}
        </title>
      </Head>
      <FetchPackage
        name={pkgName}
        content={(pkg) => {
          const [Sidebar, Content] = (() => {
            const mod = pkg.modules.find((mod) => mod.name === modName);
            if (!mod) {
              return [
                <ModuleList pkg={pkg} />,
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
                <ModuleList pkg={pkg} />,
                `Symbol ${symName} not found 🤪`,
              ];
            }

            const Sidebar = cls ? (
              <>
                <ClassContents pkg={pkg} mod={mod} cls={cls} currentSymbol="" />
                <ModuleContents pkg={pkg} mod={mod} currentSymbol="" />
              </>
            ) : (
              <ModuleContents pkg={pkg} mod={mod} currentSymbol={symbol.name} />
            );

            if (cls) {
              return [Sidebar, <Class cls={cls} />];
            } else if (func) {
              return [
                Sidebar,
                <>
                  {mod.functions
                    .filter((f) => f.name === symbol.name)
                    .map((f) => (
                      <Function func={f} />
                    ))}
                </>,
              ];
            } else {
              // variable
              return [
                Sidebar,
                <>
                  {mod.variables
                    .filter((v) => v.name === symbol.name)
                    .map((v) => (
                      <Variable variable={v} />
                    ))}
                </>,
              ];
            }
          })();

          return (
            <Layout pkg={pkg} sidebar={Sidebar}>
              {Content}
            </Layout>
          );
        }}
      />
    </>
  );
}
