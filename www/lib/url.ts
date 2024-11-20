import * as docs from "./docs";

export function normalizeProjectName(name: string): string {
  // perform PEP-426 project name normalization, just like pypi does in
  // https://github.com/pypi/warehouse/blob/39daea188d2e1e6494c50753cd48cb5a8da3e8c4/warehouse/migrations/versions/23a3c4ffe5d_relax_normalization_rules.py
  return name.toLowerCase().replaceAll(/\.|_/gi, "-");
}

export function withoutPrefix(prefix: string, s: string) {
  if (s.startsWith(`${prefix}.`)) {
    return s.slice(prefix.length + 1); // +1 for the dot
  }
  return s;
}

export function indexMetadata(): string {
  return "/_index/.metadata";
}

export function projectJson(name: string): string {
  return `/_index/${normalizeProjectName(name)}.json`;
}

export function project(p: docs.Project): string {
  return `/${p.name}`;
}

export function mod(p: docs.Project, m: docs.Module): string {
  return `${project(p)}/${m.name}`;
}

export function symbol(
  p: docs.Project,
  m: docs.Module,
  s: docs.Class | docs.Func | docs.Variable,
): string {
  return `${mod(p, m)}/${withoutPrefix(m.name, s.name)}`;
}

export function classItem(
  p: docs.Project,
  m: docs.Module,
  c: docs.Class,
  x: docs.Func | docs.Variable,
): string {
  return `${symbol(p, m, c)}#${x.name}`;
}

export function xref(
  p: docs.Project | undefined,
  xref: docs.XRef,
): string | null {
  const project = xref.project ?? p?.name;
  if (project == null) {
    return null;
  }
  if (project == "--std--") {
    return stdlibRef(xref.fqname);
  }
  const lastDot = xref.fqname.lastIndexOf(".");
  if (lastDot === -1) {
    return null;
  }
  const m = xref.fqname.slice(0, lastDot);
  const s = xref.fqname.slice(lastDot + 1);
  return `/${project}/${m}/${s}`;
}

// These symbols have a different anchor name on docs.python.org/library/functions.html
interface SpecialFunctions {
  [name: string]: string;
}
const special_functions: SpecialFunctions = {
  bytearray: "func-bytearray",
  bytes: "func-bytes",
  dict: "func-dict",
  frozenset: "func-frozenset",
  list: "func-list",
  memoryview: "func-memoryview",
  range: "func-range",
  set: "func-set",
  str: "func-str",
  tuple: "func-tuple",
  __import__: "import__",
};

export function stdlibRef(fqname: string): string {
  const lastDot = fqname.lastIndexOf(".");
  const prefix = "//docs.python.org/3/library";
  if (lastDot == -1) {
    return `${prefix}/${fqname}.html`;
  }
  // TODO: this doesn't work for things like `concurrent.futures.Executor.submit` where
  // `m` needs to be `concurrent.futures`
  const m = fqname.slice(0, lastDot);
  if (m === "functions" || m === "constants") {
    fqname = fqname.slice(lastDot + 1);
    if (fqname in special_functions) {
      fqname = special_functions[fqname];
    }
  }
  return `${prefix}/${m}.html#${fqname}`;
}
