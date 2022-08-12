import { promises as fs } from "fs";
import path from "path";

const indexDirectory = path.join(process.cwd(), "public", "_index");

export async function listPackages(): Promise<string[]> {
  const entries = await fs.readdir(indexDirectory);
  const fileNames = entries.filter((fname) => fname.endsWith(".json"));
  return fileNames.map((f) => f.replace(/\.json$/, ""));
}

export async function getPackage(name: string): Promise<Pkg> {
  const indexFile = path.join(indexDirectory, `${name}.json`);
  const json = await fs.readFile(indexFile, "utf8");
  return JSON.parse(json) as Pkg;
}

export type Pkg = {
  name: string;
  metadata: ProjectMetadata;
  documentation: Array<Documentation>;
  modules: Array<Module>;
};

export type Documentation = string;
export type Module = {
  name: string;
  documentation: Array<Documentation>;
  functions: Array<Func>;
  variables: Array<Variable>;
  classes: Array<Class>;
  exports: Array<string>;
};

export type Func = {
  name: string;
  asynchronous: boolean;
  params: Array<Param>;
  returns: Typ | null;
  documentation: Array<Documentation>;
};

export type Param = {
  name: string;
  type: Typ | null;
  default: string | null;
};

export type Typ = string;

export type Variable = {
  name: string;
  type: Typ | null;
  documentation: Array<Documentation>;
};

export type Class = {
  name: string;
  bases: Array<string>;
  methods: Array<Func>;
  class_variables: Array<Variable>;
  instance_variables: Array<Variable>;
  inner_classes: Array<Class>;
  documentation: Array<Documentation>;
};

export type ProjectMetadata = {
  version: string;
  classifiers?: Array<string>;
  home_page?: string;
  license?: string;
  documentation_url?: string;
  dependencies: Array<string>;
  summary?: string;
};
