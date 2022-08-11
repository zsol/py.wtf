import * as docs from "./docs";

export function withoutPrefix(prefix: string, s: string) {
  if (s.startsWith(`${prefix}.`)) {
    return s.slice(prefix.length + 1); // +1 for the dot
  }
  return s;
}

export function pkgJson(name: string): string {
  return `/_index/${name}.json`;
}

export function pkg(p: docs.Pkg): string {
  return `/${p.name}`;
}

export function mod(p: docs.Pkg, m: docs.Module): string {
  return `${pkg(p)}/${m.name}`;
}

export function symbol(
  p: docs.Pkg,
  m: docs.Module,
  s: docs.Class | docs.Func | docs.Variable
): string {
  return `${mod(p, m)}/${withoutPrefix(m.name, s.name)}`;
}

export function classItem(
  p: docs.Pkg,
  m: docs.Module,
  c: docs.Class,
  x: docs.Func | docs.Variable
): string {
  return `${symbol(p, m, c)}#${withoutPrefix(c.name, x.name)}`;
}
