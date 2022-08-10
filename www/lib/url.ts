import { UrlObject } from "url";

import * as docs from "./docs";

export function withoutPrefix(prefix: string, s: string) {
  if (s.startsWith(`${prefix}.`)) {
    return s.slice(prefix.length + 1); // +1 for the dot
  }
  return s;
}

export function pkg(p: docs.Pkg): UrlObject {
  return {
    pathname: "/[pkg]",
    query: {
      pkg: p.name,
    },
  };
}

export function mod(p: docs.Pkg, m: docs.Module): UrlObject {
  return {
    pathname: "/[pkg]/[mod]",
    query: {
      pkg: p.name,
      mod: m.name,
    },
  };
}

export function symbol(
  p: docs.Pkg,
  m: docs.Module,
  s: docs.Class | docs.Func | docs.Variable
): UrlObject {
  return {
    pathname: "/[pkg]/[mod]/[symbol]",
    query: {
      pkg: p.name,
      mod: m.name,
      symbol: withoutPrefix(m.name, s.name),
    },
  };
}

export function classItem(
  p: docs.Pkg,
  m: docs.Module,
  c: docs.Class,
  x: docs.Func | docs.Variable
): UrlObject {
  return {
    pathname: "/[pkg]/[mod]/[symbol]",
    query: {
      pkg: p.name,
      mod: m.name,
      symbol: withoutPrefix(m.name, c.name),
    },
  };
}
