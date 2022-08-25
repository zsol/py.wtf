import { Class, Func, Module, Project, Variable } from "./docs";
import {
  mod as generateModuleUrl,
  project as generateProjectUrl,
  symbol as generateSymbolUrl,
} from "./url";

export type SearchDescriptor = {
  name: string;
  type: "project" | "module" | "function" | "variable" | "class" | "export";
  url: string;
};

const generateSymbolDescriptors = (
  descriptors: Array<SearchDescriptor>,
  project: Project,
  module: Module,
  symbols: Array<Class | Func | Variable>,
  symbolType: string
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
  descriptors: Array<SearchDescriptor>,
  project: Project
) => {
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
};

// TODO: memoize this
export const generateSearchDescriptors = (project: Project) => {
  if (!project) {
    return [];
  }

  const descriptors = [
    {
      name: project.name,
      type: "project",
      url: generateProjectUrl(project),
    },
  ];

  if (project.modules?.length > 0) {
    generateModuleDescriptors(descriptors, project);
  }

  return descriptors;
};
