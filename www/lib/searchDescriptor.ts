import { Class, Func, Module, Project, Variable } from "./docs";
import { mod as generateModuleUrl, symbol as generateSymbolUrl } from "./url";

type SymbolType = "module" | "function" | "variable" | "class" | "export";

export type SearchDescriptor = {
  name: string;
  type: SymbolType;
  url: string;
};

const generateSymbolDescriptors = (
  descriptors: Array<SearchDescriptor>,
  project: Project,
  module: Module,
  symbols: Array<Class | Func | Variable>,
  symbolType: SymbolType
) => {
  symbols.forEach((symbol) => {
    descriptors.push({
      name: symbol.name,
      type: symbolType,
      url: generateSymbolUrl(project, module, symbol),
    });
  });
};

const generateModuleDescriptors = (
  project: Project
): Array<SearchDescriptor> => {
  const descriptors: Array<SearchDescriptor> = [];

  project.modules.forEach((module) => {
    descriptors.push({
      name: module.name,
      type: "module",
      url: generateModuleUrl(project, module),
    });

    if (module.functions.length > 0) {
      generateSymbolDescriptors(
        descriptors,
        project,
        module,
        module.functions,
        "function"
      );
    }
    if (module.variables.length > 0) {
      generateSymbolDescriptors(
        descriptors,
        project,
        module,
        module.variables,
        "variable"
      );
    }
    if (module.classes.length > 0) {
      generateSymbolDescriptors(
        descriptors,
        project,
        module,
        module.classes,
        "class"
      );
    }
  });

  return descriptors;
};

// TODO: memoize this
export const generateSearchDescriptors = (project: Project) => {
  if (!project) {
    return [];
  }

  // TODO: Think about whether it's a good pattern for this to have a different signature than the rest of the
  // generators.
  return generateModuleDescriptors(project);
};
