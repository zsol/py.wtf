import React, { ReactNode } from "react";
import { getPackage, getPackageIndex, Pkg } from "../lib/docs";
import { createTheme, WuiProvider } from "@welcome-ui/core";
import { Flex } from '@welcome-ui/flex';
import { Stack } from '@welcome-ui/stack';
import { Box } from '@welcome-ui/box';
import { darkTheme } from '@welcome-ui/themes.dark'
import { welcomeTheme } from '@welcome-ui/themes.welcome'
import { Text } from '@welcome-ui/text'
import Layout from "../components/layout";

export async function getStaticProps({ params }) {
    const pkg = getPackage(params.pkg[0]);
    console.log(params)
    const symbol = params.pkg.length > 1 ? { symbol: params.pkg[1] } : {};
    return {
        props: {
            pkg: pkg,
            ...symbol
        }
    };
}

export async function getStaticPaths() {
    const idx = getPackageIndex();
    // OMG CLEAN THIS UP
    const paths = [
        ...idx.map(
            (val) => ({ params: { pkg: [val.name] } }))
        ,
        ...idx.flatMap((val) => val.modules.map((mod) => ({ params: { pkg: [val.name, mod.name] } })))
    ];
    return {
        paths,
        fallback: false,
    }
}

function byName(a: { name }, b: { name }): number {
    if (a.name < b.name) {
        return -1;
    } else if (a.name > b.name) {
        return 1;
    }
    return 0;
}

function ModuleBrowser({ pkg, children }: { pkg: Pkg, children: ReactNode }) {
    return (
        <Flex>
            <div className="modulebrowser">
                <Stack backgroundColor="light.500">
                    <Box backgroundColor="light.200">
                        <Box>
                            <Text variant="h3" textAlign="center">Modules</Text>
                            <ul>
                                {pkg.modules.map((mod) => (
                                    <li key={mod.name}>{mod.name}</li>
                                ))}
                            </ul>
                        </Box>
                    </Box>
                </Stack>
                <style jsx>{`
                .modulebrowser {
                    max-width: 20em;
                    overflow: auto;
                }
                `}</style>
            </div>
            <Box>{children}</Box>
        </Flex>
    )
}


export default function Package({ pkg, symbol }: { pkg: Pkg, symbol?: string }) {
    const docs = pkg.documentation.map((doc) => (<p>{doc}</p>));
    const classes = pkg.modules.flatMap((mod) => mod.classes);
    const functions = pkg.modules.flatMap((mod) => mod.functions);
    const variables = pkg.modules.flatMap((mod) => mod.variables);
    const modules = pkg.modules;
    modules.sort(byName);
    classes.sort(byName);
    functions.sort(byName);
    variables.sort(byName);
    const content = (symbol === undefined) ? docs : Content(pkg, symbol);
    return (
        <Layout title={`${pkg.name}==${pkg.version}`}>
            <ModuleBrowser pkg={pkg}>{content}</ModuleBrowser>
        </Layout>

    )
}

function Content(pkg: Pkg, symbol: string) {
    const mod = pkg.modules.find((mod) => mod.name == symbol);
    mod.classes.sort(byName);
    mod.functions.sort(byName);
    mod.variables.sort(byName);
    return (<Box>
        <Text>{mod.documentation}</Text>
        <Box><h3>Classes</h3>
            <ul>
                {mod.classes.map((cls) => (
                    <li key={cls.name}>{cls.name}</li>
                ))}
            </ul>
        </Box>
        <Box><h3>Functions</h3>
            <ul>
                {mod.functions.map((fn) => (
                    <li key={fn.name}>{fn.name}</li>
                ))}
            </ul>
        </Box><Box>
            <h3>Variables</h3>
            <ul>
                {mod.variables.map((v) => (
                    <li key={v.name}>{v.name}</li>
                ))}
            </ul>
        </Box>
    </Box >);
}