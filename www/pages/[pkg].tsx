import { GetStaticPaths, GetStaticProps } from "next";

import Package from "@/components/Docs/Package";
import Layout from "@/components/Layout";

import { Pkg, getPackage, getPackageIndex } from "@/lib/docs";

export const getStaticProps: GetStaticProps<Props> = ({ params }) => {
  if (
    params === undefined ||
    params.pkg === undefined ||
    typeof params.pkg !== "string"
  ) {
    return { notFound: true };
  }
  const pkg = getPackage(params.pkg);
  return {
    props: {
      pkg: pkg,
    },
  };
};

export const getStaticPaths: GetStaticPaths = () => {
  const idx = getPackageIndex();
  return {
    paths: idx.map((pkg) => ({ params: { pkg: pkg.name } })),
    fallback: false,
  };
};

interface Props {
  pkg: Pkg;
}

export default function PackagePage({ pkg }: Props) {
  return (
    <Layout pkg={pkg}>
      <Package pkg={pkg} />
    </Layout>
  );
}
