import { promises as fs } from "fs";
import path from "path";
import process from "process";

import { Project } from "./docs";

const indexDirectory = path.join(
  process.cwd(),
  process.env.INDEX_PATH || path.join("public", "_index")
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
