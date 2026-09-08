import { DocumentationNode, parseDocumentation } from "@/lib/myst";

import fixtures from "./fixtures/myst/legacy-0.0.13.json";

interface LegacyNode {
  type: string;
  value?: string;
  children?: LegacyNode[];
  depth?: number;
  ordered?: boolean;
  start?: number;
  url?: string;
  title?: string;
  alt?: string;
  name?: string;
  lang?: string;
  label?: string;
  header?: boolean;
  align?: string;
  args?: string;
  options?: Record<string, unknown>;
}
interface Fact {
  kind: string;
  value?: string;
  children?: Fact[];
  url?: string;
  title?: string;
  start?: number;
  align?: string;
  args?: string;
  options?: Record<string, unknown>;
}
const tags: Record<string, string> = {
  paragraph: "p",
  blockquote: "blockquote",
  listItem: "li",
  emphasis: "em",
  strong: "strong",
  definitionList: "dl",
  definitionTerm: "dt",
  definitionDescription: "dd",
  table: "table",
  tableRow: "tr",
};
function previous(node: LegacyNode): Fact {
  let kind = tags[node.type] ?? node.type;
  if (node.type === "heading") kind = `h${node.depth}`;
  if (node.type === "list") kind = node.ordered ? "ol" : "ul";
  if (node.type === "tableCell") kind = node.header ? "th" : "td";
  const result: Fact = { kind };
  if (node.children) result.children = node.children.map(previous);
  if (node.value !== undefined) result.value = node.value;
  if (kind === "ol" && node.start !== undefined && node.start !== 1)
    result.start = node.start;
  if (node.align) result.align = node.align;
  if (node.type === "mystRole") {
    result.kind = "role";
    result.value = `${node.name}\0${node.value}`;
    delete result.children;
  }
  if (node.type === "mystDirective") {
    result.kind = `directive:${node.name}`;
    result.args = node.args ?? "";
    result.options = node.options ?? {};
    result.value = node.value ?? "";
    delete result.children; // semantic children are checked against upstream fixtures
  }
  if (node.type === "mystTarget") {
    result.kind = "target";
    result.value = node.label;
  }
  if (node.type === "mystComment") result.kind = "comment";
  if (node.type === "code") {
    result.kind = "codeBlock";
    result.title = node.lang || undefined;
  }
  if (node.type === "inlineCode") result.kind = "code";
  if (node.type === "inlineMath" || node.type === "math") {
    result.kind = node.type;
    result.title = node.label;
  }
  if (node.type === "footnoteReference" || node.type === "footnoteDefinition")
    result.value = node.label;
  if (node.type === "image" || node.type === "link") {
    result.url = node.url;
    result.title = node.title;
  }
  if (node.type === "image") result.value = node.alt;
  if (
    node.type === "html" &&
    node.value?.startsWith('<input class="task-list-item-checkbox"')
  ) {
    result.kind = "checkbox";
    result.value = String(node.value.includes('checked=""'));
  }
  return result;
}
function current(nodes: DocumentationNode[]): Fact[] {
  return nodes.flatMap((node): Fact[] => {
    if (
      node.type === "footnotes" ||
      (node.type === "element" && ["thead", "tbody"].includes(node.tag))
    )
      return current(node.children);
    if (node.type === "footnoteBackref") return []; // synthesized navigation, absent from the old parse tree
    const result: Fact = { kind: node.type };
    if ("value" in node) result.value = node.value;
    if (node.type === "html") result.value = node.value.replace(/\n$/, "");
    if ("children" in node) result.children = current(node.children ?? []);
    if (node.type === "element") {
      result.kind = node.tag;
      if (node.start && node.start !== 1) result.start = node.start;
      if (node.align) result.align = node.align;
    }
    if (node.type === "mystRole") {
      result.kind = "role";
      result.value = `${node.name}\0${node.value}`;
    }
    if (node.type === "directive") {
      result.kind = `directive:${node.name}`;
      result.args = node.args;
      result.options = Object.fromEntries(
        Object.entries(node.options).map(([key, value]) => [
          key,
          key === "linenos" && value === null ? true : value,
        ]),
      );
      result.value = node.value;
      delete result.children;
    }
    if (node.type === "codeBlock") result.title = node.language;
    if (node.type === "math") {
      result.kind = node.display ? "math" : "inlineMath";
      result.title = node.label;
    }
    if (node.type === "checkbox") result.value = String(node.checked);
    if (node.type === "footnoteReference" || node.type === "footnote") {
      result.kind = node.type === "footnote" ? "footnoteDefinition" : node.type;
      result.value = node.label;
    }
    if (node.type === "image" || node.type === "link") {
      result.url = node.url;
      result.title = node.title;
    }
    if (node.type === "image") result.value = node.alt;
    return [result];
  });
}

function coalesce(nodes: Fact[]): Fact[] {
  const result: Fact[] = [];
  for (const node of nodes) {
    if (node.children) node.children = coalesce(node.children);
    if (node.kind === "text" && !node.value) continue;
    const last = result[result.length - 1];
    if (last?.kind === "text" && node.kind === "text")
      last.value = (last.value ?? "") + (node.value ?? "");
    else result.push(node);
  }
  return result;
}

describe("mystjs 0.0.13 captured semantic compatibility", () => {
  it.each(
    fixtures.filter(
      (f) => !["nested formatting", "unclosed front matter"].includes(f.title),
    ),
  )("$title", ({ source, ast }) => {
    const expected = (ast as LegacyNode).children?.map(previous);
    expect(coalesce(current(parseDocumentation(source)))).toEqual(
      coalesce(expected ?? []),
    );
  });
  it("retains nested formatting while enabling MyST's optional strikethrough syntax", () => {
    const fixture = fixtures.find((f) => f.title === "nested formatting")!;
    const expected = (fixture.ast as LegacyNode).children!.map(previous);
    const modern = coalesce(current(parseDocumentation(fixture.source)));
    expect(modern[0].children?.find((n) => n.kind === "s")).toEqual({
      kind: "s",
      children: [{ kind: "text", value: "literal" }],
    });
    modern[0].children = modern[0].children!.map((n) =>
      n.kind === "s" ? { kind: "text", value: "~~literal~~" } : n,
    );
    expect(coalesce(modern)).toEqual(coalesce(expected));
  });
  it("unclosed front matter follows CommonMark and retains the body the legacy parser lost", () => {
    const fixture = fixtures.find((f) => f.title === "unclosed front matter")!;
    expect(JSON.stringify(fixture.ast)).not.toContain('"value":"body"');
    expect(parseDocumentation(fixture.source)).toEqual(
      parseDocumentation(fixture.source, "commonmark"),
    );
    expect(JSON.stringify(parseDocumentation(fixture.source))).toContain(
      '"value":"body"',
    );
  });
});
