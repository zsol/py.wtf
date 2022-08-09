import { getPackage, getPackageIndex } from "../lib/docs";
import Package from "../components/Package";

export async function getStaticProps({ params }) {
  const pkg = getPackage(params.pkg[0]);
  const symbol = params.pkg.length > 1 ? { symbol: params.pkg[1] } : {};
  return {
    props: {
      pkg: pkg,
      ...symbol,
    },
  };
}

export async function getStaticPaths() {
  const idx = getPackageIndex();
  // OMG CLEAN THIS UP
  const paths = [
    ...idx.map((val) => ({ params: { pkg: [val.name] } })),
    ...idx.flatMap((val) =>
      val.modules.map((mod) => ({ params: { pkg: [val.name, mod.name] } }))
    ),
  ];
  return {
    paths,
    fallback: false,
  };
}

export default Package;
