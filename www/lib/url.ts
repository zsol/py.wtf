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
  s: docs.Class | docs.Func | docs.Variable
): string {
  return `${mod(p, m)}/${withoutPrefix(m.name, s.name)}`;
}

export function classItem(
  p: docs.Project,
  m: docs.Module,
  c: docs.Class,
  x: docs.Func | docs.Variable
): string {
  return `${symbol(p, m, c)}#${withoutPrefix(c.name, x.name)}`;
}

export function xref(p: docs.Project, xref: docs.XRef): string | null {
  const project = xref.project ?? p.name;
  const lastDot = xref.fqname.lastIndexOf(".");
  if (lastDot === -1) {
    return null;
  }
  const m = xref.fqname.slice(0, lastDot);
  const s = xref.fqname.slice(lastDot + 1);
  return `/${project}/${m}/${s}`;
}
