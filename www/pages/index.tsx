import { WuiProvider, createTheme } from "@welcome-ui/core";
import { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import React from "react";

import { Pkg, getPackage, listPackages, ProjectMetadata } from "@/lib/docs";
import * as url from "@/lib/url";

export const getStaticProps: GetStaticProps<Props> = async () => {
  const packageNames = await listPackages();
  const packages = await Promise.all(
    packageNames.map(async (name) => ({
      name,
      metadata: (await getPackage(name)).metadata,
    }))
  );
  return {
    props: {
      packages,
    },
  };
};

const theme = createTheme();

interface Props {
  packages: { name: string; metadata: ProjectMetadata }[];
}

export default function Home({ packages }: Props) {
  return (
    <WuiProvider theme={theme}>
      <div className="container">
        <Head>
          <title>py.wtf</title>
          {/*<link rel="icon" href="/favicon.ico" /> */}
        </Head>

        <main>
          <ul>
            {packages.map((pkg) => (
              <li key={`${pkg.name}-${pkg.metadata.version}`}>
                <Link href={url.pkg(pkg as Pkg)}>
                  <a>{pkg.name}</a>
                </Link>{" "}
                ({pkg.metadata.version})
              </li>
            ))}
          </ul>
        </main>

        <footer>Footer.</footer>

        <style jsx>{`
          .container {
            min-height: 100vh;
            padding: 0 0.5rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }

          main {
            padding: 5rem 0;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }

          footer {
            width: 100%;
            height: 100px;
            border-top: 1px solid #eaeaea;
            display: flex;
            justify-content: center;
            align-items: center;
          }
        `}</style>
      </div>
    </WuiProvider>
  );
}
