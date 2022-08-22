import { promises as fs } from "fs";
import path from "path";
import process from "process";

const indexDirectory = path.join(
  process.cwd(),
  process.env.INDEX_PATH || path.join("public", "_index"),
);

export async function listProjects(): Promise<string[]> {
  const entries = await fs.readdir(indexDirectory);
  const fileNames = entries.filter((fname) => fname.endsWith(".json"));
  return fileNames.map((f) => f.replace(/\.json$/, ""));
}

export async function getProject(name: string): Promise<Project> {
  const indexFile = path.join(indexDirectory, `${name}.json`);
  const json = await fs.readFile(indexFile, "utf8");
  return JSON.parse(json) as Project;
}

export type Documentation = string;

export type XRef = {
  fqname: string;
  project?: string;
};

export type Typ = {
  name: string;
  xref?: XRef;
  params?: Array<Typ>;
};

export type Export = {
  name: string;
  xref: XRef;
};

export type Variable = {
  name: string;
  type?: Typ;
  documentation: Array<Documentation>;
};

export type Param = {
  name: string;
  type: Typ | null;
  default: string | null;
};

export type Func = {
  name: string;
  asynchronous: boolean;
  params: Array<Param>;
  returns: Typ | null;
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

export type Module = {
  name: string;
  documentation: Array<Documentation>;
  functions: Array<Func>;
  variables: Array<Variable>;
  classes: Array<Class>;
  exports: Array<Export>;
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

export type Project = {
  name: string;
  metadata: ProjectMetadata;
  documentation: Array<Documentation>;
  modules: Array<Module>;
};
