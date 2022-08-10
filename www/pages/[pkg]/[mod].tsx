import { GetStaticPaths, GetStaticProps } from "next";

import Module from "@/components/Docs/Module";
import Layout from "@/components/Layout";
import ModuleList from "@/components/Sidebar/ModuleList";

import * as docs from "@/lib/docs";
import { withoutPrefix } from "@/lib/url";

interface Props {
  pkg: docs.Pkg;
  mod: docs.Module;
}

export const getStaticProps: GetStaticProps<Props> = ({ params }) => {
  if (
    params === undefined ||
    params.pkg === undefined ||
    typeof params.pkg !== "string" ||
    params.mod === undefined ||
    typeof params.mod !== "string"
  ) {
    return { notFound: true };
  }
  const pkg = docs.getPackage(params.pkg);
  const mod = pkg.modules.find(
    (m) => m.name === `${pkg.name}.${params.mod as string}`
  );
  if (mod === undefined) {
    return { notFound: true };
  }
  return {
    props: {
      pkg,
      mod,
    },
  };
};

export const getStaticPaths: GetStaticPaths = () => {
  const idx = docs.getPackageIndex();
  return {
    paths: idx.flatMap((pkg) =>
      pkg.modules.map((mod) => ({
        params: { pkg: pkg.name, mod: withoutPrefix(pkg.name, mod.name) },
      }))
    ),
    fallback: false,
  };
};

export default function ModulePage({ pkg, mod }: Props) {
  return (
    <Layout pkg={pkg} sidebar={<ModuleList pkg={pkg} currentModule={mod} />}>
      <Module pkg={pkg} mod={mod} />
    </Layout>
  );
}
