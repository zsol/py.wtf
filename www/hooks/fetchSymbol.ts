import * as docs from "@/lib/docs";
import { withoutPrefix, xref } from "@/lib/url";

import useFetchModule from "./fetchModule";

function resolveClass(mod: docs.Module, name: string): docs.Class | undefined {
  // `name` can refer to an inner class like Foo.Bar
  const parts = withoutPrefix(mod.name, name).split(".");
  // First find a module-level class that matches Foo
  let cls = mod.classes.find(
    (c) => withoutPrefix(mod.name, c.name) === parts[0],
  );
  parts.shift();
  // Keep looking in inner classes until we find a match
  while (cls && parts.length) {
    const parentName = cls.name;
    cls = cls.inner_classes.find(
      (c) => withoutPrefix(parentName, c.name) === parts[0],
    );
    parts.shift();
  }
  return cls;
}

type SymbolType = "class" | "function" | "variable" | "export" | undefined;
type FindSymbolResult = {
  symbol: docs.Class | docs.Func | docs.Variable | docs.Export | undefined;
  symbolType: SymbolType;
};

const findSymbol = (
  module: docs.Module,
  symbolName: string | undefined,
): FindSymbolResult => {
  let symbol;
  let symbolType: SymbolType;

  if (symbolName) {
    const classMatch = resolveClass(module, symbolName);
    if (classMatch) {
      symbol = classMatch;
      symbolType = "class";
    }

    if (!symbol) {
      const functionMatch = module.functions.find(
        (func) => withoutPrefix(module.name, func.name) === symbolName,
      );
      if (functionMatch) {
        symbol = functionMatch;
        symbolType = "function";
      }
    }

    if (!symbol) {
      const variableMatch = module.variables.find(
        (variable) => withoutPrefix(module.name, variable.name) === symbolName,
      );
      if (variableMatch) {
        symbol = variableMatch;
        symbolType = "variable";
      }
    }

    if (!symbol) {
      const exportMatch = module.exports.find(
        (exp) => withoutPrefix(module.name, exp.name) === symbolName,
      );
      if (exportMatch) {
        symbol = exportMatch;
        symbolType = "export";
      }
    }
  }

  return {
    symbol,
    symbolType,
  };
};

const useFetchSymbol = (
  projectName: string,
  moduleName: string,
  symbolName: string,
) => {
  const { project, module, projectJsonUrl, error, isLoading } = useFetchModule(
    projectName,
    moduleName,
  );

  let symbol;
  let symbolType;
  if (module) {
    ({ symbol, symbolType } = findSymbol(module, symbolName));
  }

  return {
    isLoading,
    error,
    project,
    projectJsonUrl,
    module: project
      ? project.modules.find((mod) => mod.name === moduleName)
      : undefined,
    symbolType,
    symbol,
  };
};

export default useFetchSymbol;
