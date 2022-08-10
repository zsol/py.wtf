import { promises as fs } from "fs";
import path from "path";

const indexDirectory = path.join(process.cwd(), "..", "index");

export async function listPackages(): Promise<string[]> {
  const entries = await fs.readdir(indexDirectory);
  const fileNames = entries.filter((fname) => fname.endsWith(".json"));
  return fileNames.map((f) => f.replace(/\.json$/, ""));
}

export async function readPackageJson(name: string): Promise<string> {
  const indexFile = path.join(indexDirectory, `${name}.json`);
  return await fs.readFile(indexFile, "utf8");
}

export type Pkg = {
  name: string;
  version: string;
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
