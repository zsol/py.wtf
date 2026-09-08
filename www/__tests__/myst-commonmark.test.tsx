import { ThemeProvider } from "@emotion/react";
import { render } from "@testing-library/react";

import MyST from "@/components/MyST";
import { darkTheme } from "@/components/core/theme/theme";

import { DocumentationNode, parseDocumentation } from "@/lib/myst";

import { semanticDOM } from "../test-utils/myst-dom";
import examples from "./fixtures/myst/commonmark-0.31.2.json";

const escape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const attribute = (name: string, value: string | undefined) =>
  value === undefined ? "" : ` ${name}="${escape(value)}"`;

// A test-only projection of our parsed tree, including raw HTML. Production
// intentionally omits raw HTML and rejects executable destinations. Keeping
// those policies out of this projection tests recognition against the spec.
function html(nodes: DocumentationNode[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case "text":
          return escape(node.value);
        case "html":
          return node.value;
        case "code":
          return `<code>${escape(node.value)}</code>`;
        case "codeBlock":
          return `<pre><code${attribute("class", node.language ? `language-${node.language}` : undefined)}>${escape(node.value)}${node.trailingNewline ? "\n" : ""}</code></pre>\n`;
        case "element":
          return `<${node.tag}${attribute("start", node.start?.toString())}>${html(node.children)}</${node.tag}>${/^(?:em|strong|s)$/.test(node.tag) ? "" : "\n"}`;
        case "link":
          return `<a${attribute("href", node.url)}${attribute("title", node.title)}>${html(node.children)}</a>`;
        case "image":
          return `<img${attribute("src", node.url)}${attribute("alt", node.alt)}${attribute("title", node.title)}>`;
        case "break":
          return "<br>\n";
        case "thematicBreak":
          return "<hr>";
        default:
          throw new Error(
            `MyST extension ${node.type} leaked into CommonMark profile`,
          );
      }
    })
    .join("");
}

describe("CommonMark 0.31.2 official examples (MyST extensions disabled)", () => {
  it("keeps the UI HTML/URL policy active in the conformance profile", () => {
    const { container } = render(
      <ThemeProvider theme={darkTheme}>
        <MyST
          source={
            "[unsafe](javascript:alert(1)) ![unsafe](data:text/html,unsafe)\n\n<script>alert(2)</script>"
          }
          profile="commonmark"
        />
      </ThemeProvider>,
    );
    expect(container.querySelector("script, [href], [src]")).toBeNull();
    expect(container.textContent).toContain("unsafe");
    expect(container.textContent).not.toContain("alert(2)");
  });
  it.each(examples)(
    "#$example $section: parsed semantics",
    ({ markdown, html: expected }) => {
      expect(
        semanticDOM(html(parseDocumentation(markdown, "commonmark"))),
      ).toEqual(semanticDOM(expected));
    },
  );

  // Exercise the real React renderer too, for every example whose output is
  // unaffected by the documented raw-HTML / URL policy. Selection is explicit
  // by syntax, never by a failed assertion or snapshot update.
  const safeExamples = examples.filter(({ markdown }) => {
    const nodes = parseDocumentation(markdown, "commonmark");
    function safe(tree: DocumentationNode[]): boolean {
      return tree.every(
        (node) =>
          node.type !== "html" &&
          (!(node.type === "link" || node.type === "image") ||
            !/^(?:javascript|vbscript|file|data):/i.test(node.url)) &&
          (!("children" in node) || safe(node.children ?? [])),
      );
    }
    return safe(nodes);
  });
  it.each(safeExamples)(
    "#$example $section: React output",
    ({ markdown, html: expected }) => {
      const { container } = render(
        <ThemeProvider theme={darkTheme}>
          <MyST source={markdown} profile="commonmark" />
        </ThemeProvider>,
      );
      expect(semanticDOM(container.innerHTML)).toEqual(semanticDOM(expected));
    },
  );
});
