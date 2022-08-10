import { useRouter } from "next/router";

import Module from "@/components/Docs/Module";
import FetchPackage from "@/components/FetchPackage";
import Layout from "@/components/Layout";
import ModuleList from "@/components/Sidebar/ModuleList";

export default function ModulePage() {
  const router = useRouter();
  const pkgName = router.query.pkg as string;
  const modName = router.query.mod as string;
  return (
    <FetchPackage
      name={pkgName}
      content={(pkg) => {
        const mod = pkg.modules.find((mod) => mod.name === modName);
        return (
          <Layout
            pkg={pkg}
            sidebar={<ModuleList pkg={pkg} currentModule={mod} />}
          >
            {mod ? (
              <Module pkg={pkg} mod={mod} />
            ) : (
              `Module ${modName} not found :O`
            )}
          </Layout>
        );
      }}
    />
  );
}
