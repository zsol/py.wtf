import { GetStaticPaths, GetStaticProps } from "next";

import Class from "@/components/Docs/Class";
import Function from "@/components/Docs/Function";
import Variable from "@/components/Docs/Variable";
import Layout from "@/components/Layout";
import ClassContents from "@/components/Sidebar/ClassContents";
import ModuleContents from "@/components/Sidebar/ModuleContents";

import * as docs from "@/lib/docs";
import { withoutPrefix } from "@/lib/url";

type Sym =
  | { kind: "class"; symbol: docs.Class }
  | { kind: "function"; symbol: docs.Func }
  | { kind: "variable"; symbol: docs.Variable };

interface Props {
  pkg: docs.Pkg;
  mod: docs.Module;
  symbol: Sym;
}

type MaybeSym = {
  kind: Sym["kind"];
  symbol: Sym["symbol"] | undefined;
};

function coalesceSymbol(...xs: MaybeSym[]): Sym | undefined {
  for (const x of xs) {
    if (x.symbol) {
      // This is cheating, but I don't know how to do this without cheating in the TS type system
      return x as Sym;
    }
  }
}

export const getStaticProps: GetStaticProps<Props> = ({ params }) => {
  if (
    params === undefined ||
    params.pkg === undefined ||
    typeof params.pkg !== "string" ||
    params.mod == undefined ||
    typeof params.mod !== "string" ||
    params.symbol == undefined ||
    typeof params.symbol !== "string"
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

  const find = <T extends { name: string }>(xs: T[]): T | undefined => {
    return xs.find((x) => x.name === `${mod.name}.${params.symbol as string}`);
  };

  const sym = coalesceSymbol(
    {
      kind: "class",
      symbol: find(mod.classes),
    },
    {
      kind: "function",
      symbol: find(mod.functions),
    },
    {
      kind: "variable",
      symbol: find(mod.variables),
    }
  );
  if (sym === undefined) {
    return { notFound: true };
  }

  return {
    props: {
      pkg,
      mod,
      symbol: sym,
    },
  };
};

export const getStaticPaths: GetStaticPaths = () => {
  const idx = docs.getPackageIndex();

  const paths: { params: { pkg: string; mod: string; symbol: string } }[] = [];
  function pushParams(
    pkg: docs.Pkg,
    mod: docs.Module,
    thing: docs.Class | docs.Func | docs.Variable
  ) {
    paths.push({
      params: {
        pkg: pkg.name,
        mod: withoutPrefix(pkg.name, mod.name),
        symbol: withoutPrefix(mod.name, thing.name),
      },
    });
  }

  idx.forEach((pkg) => {
    pkg.modules.forEach((mod) => {
      mod.classes.forEach((cls) => pushParams(pkg, mod, cls));
      mod.functions.forEach((fn) => pushParams(pkg, mod, fn));
      mod.variables.forEach((v) => pushParams(pkg, mod, v));
    });
  });

  return {
    paths,
    fallback: false,
  };
};

export default function Page({ pkg, mod, symbol }: Props) {
  const Sidebar = (() => {
    switch (symbol.kind) {
      case "class":
        return (
          <>
            <ClassContents
              pkg={pkg}
              mod={mod}
              cls={symbol.symbol}
              currentSymbol=""
            />
            <ModuleContents pkg={pkg} mod={mod} currentSymbol="" />
          </>
        );
      case "function":
        return (
          <ModuleContents
            pkg={pkg}
            mod={mod}
            currentSymbol={symbol.symbol.name}
          />
        );
      case "variable":
        return (
          <ModuleContents
            pkg={pkg}
            mod={mod}
            currentSymbol={symbol.symbol.name}
          />
        );
    }
  })();

  const Content = (() => {
    switch (symbol.kind) {
      case "class":
        return <Class cls={symbol.symbol} />;
      case "function":
        return (
          <>
            {mod.functions
              .filter((f) => f.name === symbol.symbol.name)
              .map((f) => (
                <Function func={f} />
              ))}
          </>
        );
      case "variable":
        return (
          <>
            {mod.variables
              .filter((v) => v.name === symbol.symbol.name)
              .map((v) => (
                <Variable variable={v} />
              ))}
          </>
        );
    }
  })();

  return (
    <Layout pkg={pkg} sidebar={Sidebar}>
      {Content}
    </Layout>
  );
}
