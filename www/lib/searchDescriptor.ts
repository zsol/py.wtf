import FuzzySort from "fuzzysort";
import memoize from "nano-memoize";

import { Class, Func, Module, Project, Variable } from "./docs";
import { mod as generateModuleUrl, symbol as generateSymbolUrl } from "./url";

export type SymbolType =
  | "module"
  | "function"
  | "variable"
  | "class"
  | "export"
  | "project";

export type SearchDescriptor = {
  name: string;
  fqname: string;
  type: SymbolType;
  url: string;
};

const generateSymbolDescriptors = (
  descriptors: Array<SearchDescriptor>,
  project: Project,
  module: Module,
  symbols: Array<Class | Func | Variable>,
  symbolType: SymbolType,
) => {
  symbols.forEach((symbol) => {
    const parts = symbol.name.split(".");
    descriptors.push({
      name: parts[parts.length - 1],
      fqname: symbol.name,
      type: symbolType,
      url: generateSymbolUrl(project, module, symbol),
    });
  });
};

const generateModuleDescriptors = (
  project: Project,
): Array<SearchDescriptor> => {
  const descriptors: Array<SearchDescriptor> = [];

  project.modules.forEach((module) => {
    const parts = module.name.split(".");
    descriptors.push({
      name: parts[parts.length - 1],
      fqname: module.name,
      type: "module",
      url: generateModuleUrl(project, module),
    });

    if (module.functions.length > 0) {
      generateSymbolDescriptors(
        descriptors,
        project,
        module,
        module.functions,
        "function",
      );
    }
    if (module.variables.length > 0) {
      generateSymbolDescriptors(
        descriptors,
        project,
        module,
        module.variables,
        "variable",
      );
    }
    if (module.classes.length > 0) {
      generateSymbolDescriptors(
        descriptors,
        project,
        module,
        module.classes,
        "class",
      );
    }
  });

  return descriptors;
};

export const generateProjectIndex = memoize((project: Project) => {
  if (!project) {
    return makeIndex([]);
  }

  // TODO: Think about whether it's a good pattern for this to have a different signature than the rest of the
  // generators.
  return makeIndex(generateModuleDescriptors(project));
});

export const makeIndex = (descriptors: SearchDescriptor[]): Index =>
  descriptors; // TODO: call Fuzzysort.prepare on items

export type Index = Array<SearchDescriptor>;
export type Results = Fuzzysort.KeyResults<SearchDescriptor>;
export type Result = Fuzzysort.KeyResult<SearchDescriptor>;

export const search = (index: Index, term: string): Results =>
  FuzzySort.go(term, index, { key: "name" });
