import * as docs from "./docs";

export function withoutPrefix(prefix: string, s: string) {
  if (s.startsWith(`${prefix}.`)) {
    return s.slice(prefix.length + 1); // +1 for the dot
  }
  return s;
}

export function projectJson(name: string): string {
  return `/_index/${name}.json`;
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
  if (project == "__std__") {
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

export function stdlibRef(fqname: string): string {
  const lastDot = fqname.lastIndexOf(".");
  const prefix = "//docs.python.org/3/library";
  if (lastDot == -1) {
    return `${prefix}/${fqname}.html`;
  }
  // TODO: this doesn't work for things like `concurrent.futures.Executor.submit` where
  // `m` needs to be `concurrent.futures`
  const m = fqname.slice(0, lastDot);
  return `${prefix}/${m}.html#${fqname}`;
}
