import { parseDocument } from "yaml";

export interface DirectiveHeader {
  name: string;
  args: string;
  value: string;
  options: Record<string, unknown>;
  raw: string;
  error?: string;
}

export function directiveHeader(
  info: string,
  content: string,
): DirectiveHeader | undefined {
  const match = /^\{([\w:+-]+)\}(?:[ \t]+(.*))?$/.exec(info.trim());
  if (!match) return undefined;
  const raw = content.replace(/\n$/, "");
  const result: DirectiveHeader = {
    name: match[1],
    args: match[2] ?? "",
    value: raw,
    raw,
    options: {},
  };
  const registered = [
    "code",
    "code-block",
    "code-cell",
    "math",
    "image",
    "figure",
    "table",
    "list-table",
    "admonition",
    "attention",
    "caution",
    "danger",
    "error",
    "hint",
    "important",
    "note",
    "tip",
    "warning",
    "seealso",
  ];
  if (!registered.includes(result.name)) return result;
  const lines = raw.split("\n");
  const yaml: string[] = [];
  let end = 0;
  if (lines[0]?.trim() === "---") {
    end = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
    if (end < 0) return { ...result, error: "Unclosed directive option block" };
    yaml.push(...lines.slice(1, end));
    end++;
  } else {
    while (lines[end]?.startsWith(":")) {
      // Docutils option syntax permits :alt:caption without a separating space.
      yaml.push(lines[end++].slice(1).replace(/^([^:]+):(?=\S)/, "$1: "));
    }
  }
  if (yaml.length) {
    try {
      const parsed = parseDocument(yaml.join("\n"), { uniqueKeys: true });
      if (parsed.errors.length || parsed.warnings.length)
        throw new Error("Invalid directive options");
      const options: unknown = parsed.toJS({ maxAliasCount: 20 });
      if (!options || typeof options !== "object" || Array.isArray(options))
        throw new Error("Directive options must be a mapping");
      result.options = options as Record<string, unknown>;
    } catch {
      return { ...result, error: "Invalid directive options" };
    }
  }
  if (end) result.value = lines.slice(end).join("\n").replace(/^\n/, "");
  return result;
}
