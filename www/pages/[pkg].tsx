import React from "react";
import { getPackage, getPackageIndex, Pkg } from "../lib/docs";

export async function getStaticProps({ params }) {
    const pkg = getPackage(params.pkg);
    return {
        props: {
            pkg,
        }
    };
}

export async function getStaticPaths() {
    const paths = getPackageIndex().map(
        (val) => ({ params: { pkg: val.name, ...val } })
    );
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

export default function Package({ pkg }: { pkg: Pkg }) {
    const docs = pkg.documentation.map((doc) => (<p>{doc}</p>));
    const classes = pkg.modules.flatMap((mod) => mod.classes);
    const functions = pkg.modules.flatMap((mod) => mod.functions);
    const variables = pkg.modules.flatMap((mod) => mod.variables);
    const modules = pkg.modules;
    modules.sort(byName);
    classes.sort(byName);
    functions.sort(byName);
    variables.sort(byName);
    return (
        <>
            <h1>{pkg.name}=={pkg.version}</h1>
            {docs}
            <h3>Modules</h3>
            <ul>
                {pkg.modules.map((mod) => (
                    <li key={mod.name}>{mod.name}</li>
                ))}
            </ul>
            <h3>Classes</h3>
            <ul>
                {classes.map((cls) => (
                    <li key={cls.name}>{cls.name}</li>
                ))}
            </ul>
            <h3>Functions</h3>
            <ul>
                {functions.map((fn) => (
                    <li key={fn.name}>{fn.name}</li>
                ))}
            </ul>
            <h3>Variables</h3>
            <ul>
                {variables.map((v) => (
                    <li key={v.name}>{v.name}</li>
                ))}
            </ul>
        </>
    )
}