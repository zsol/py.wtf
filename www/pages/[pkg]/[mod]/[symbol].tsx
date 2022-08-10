import { useRouter } from "next/router";

import Class from "@/components/Docs/Class";
import Function from "@/components/Docs/Function";
import Variable from "@/components/Docs/Variable";
import FetchPackage from "@/components/FetchPackage";
import Layout from "@/components/Layout";
import ClassContents from "@/components/Sidebar/ClassContents";
import ModuleContents from "@/components/Sidebar/ModuleContents";
import ModuleList from "@/components/Sidebar/ModuleList";

import { withoutPrefix } from "@/lib/url";

export default function ModulePage() {
  const router = useRouter();
  const pkgName = router.query.pkg as string;
  const modName = router.query.mod as string;
  const symName = router.query.symbol as string;
  return (
    <FetchPackage
      name={pkgName}
      content={(pkg) => {
        const [Sidebar, Content] = (() => {
          const mod = pkg.modules.find((mod) => mod.name === modName);
          if (!mod) {
            return [<ModuleList pkg={pkg} />, `Module ${modName} not found :O`];
          }

          const cls = mod.classes.find(
            (cls) => withoutPrefix(mod.name, cls.name) === symName
          );
          const func = mod.functions.find(
            (func) => withoutPrefix(mod.name, func.name) === symName
          );
          const variable = mod.variables.find(
            (variable) => withoutPrefix(mod.name, variable.name) === symName
          );
          const symbol = cls || func || variable;

          if (!symbol) {
            return [<ModuleList pkg={pkg} />, `Symbol ${symName} not found :O`];
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
  );
}
