import { ThemeProvider } from "@emotion/react";
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";

import MyST from "@/components/MyST";
import { darkTheme } from "@/components/core/theme/theme";

import { DocumentationNode, parseDocumentation } from "@/lib/myst";

import { semanticDOM } from "../test-utils/myst-dom";
import fixtures from "./fixtures/myst/myst-spec.json";

interface SpecNode {
  type: string;
  name?: string;
  value?: string;
  label?: string;
  meta?: string;
  options?: Record<string, unknown>;
  children?: SpecNode[];
  url?: string;
  alt?: string;
  class?: string;
  width?: string;
  align?: string;
  header?: boolean;
  lang?: string;
  startingLineNumber?: number;
  showLineNumbers?: boolean;
  emphasizeLines?: number[];
}
function all<T extends { type: string; children?: T[] }>(nodes: T[]): T[] {
  return nodes.flatMap((node) => [node, ...all(node.children ?? [])]);
}
function text(node: SpecNode): string {
  return node.value ?? (node.children ?? []).map(text).join("");
}
function markup(source: string) {
  return (
    <ThemeProvider theme={darkTheme}>
      <MyST source={source} />
    </ThemeProvider>
  );
}

describe("pinned upstream MyST fixtures: parsed meaning and rendered semantics", () => {
  it.each(fixtures)("$file — $title", ({ file, source, ast, html }) => {
    const expected = all((ast as SpecNode).children ?? []);
    const parsed = parseDocumentation(source);
    const actual = all<DocumentationNode>(parsed);
    const { container } = render(markup(source));
    const expectedRoles = expected.filter((n) => n.type === "mystRole");
    expect(
      actual
        .filter((n) => n.type === "mystRole")
        .map((n) => ({ name: n.name, value: n.value })),
    ).toEqual(expectedRoles.map((n) => ({ name: n.name, value: n.value })));
    expect(
      actual.filter((n) => n.type === "directive").map((n) => n.name),
    ).toEqual(
      expected.filter((n) => n.type === "mystDirective").map((n) => n.name),
    );

    if (file === "blocks.yml") {
      expect(
        actual.filter((n) => n.type === "blockBreak").map((n) => n.value),
      ).toEqual(
        expected
          .filter((n) => n.type === "blockBreak")
          .map((n) => n.meta ?? ""),
      );
      expect(container.textContent).toBe(
        expected
          .filter((n) => n.type === "heading")
          .map(text)
          .join(""),
      );
    } else if (file === "references.target.yml") {
      const labels = expected
        .filter((n) => n.type === "mystTarget")
        .map((n) => n.label);
      expect(
        actual.filter((n) => n.type === "target").map((n) => n.value),
      ).toEqual(labels);
      expect(container.querySelectorAll("[id]")).toHaveLength(labels.length);
      expect(container.querySelector("h1")?.textContent).toBe(
        text(expected.find((n) => n.type === "heading")!),
      );
    } else if (file === "footnotes.yml") {
      const definitions = expected.filter(
        (n) => n.type === "footnoteDefinition",
      );
      expect(
        actual.filter((n) => n.type === "footnote").map((n) => n.label),
      ).toEqual(definitions.map((n) => n.label));
      expect(
        Array.from(container.querySelectorAll(".footnotes li")).map((li) =>
          li.textContent?.replace(/↩/g, ""),
        ),
      ).toEqual(definitions.map(text));
      expect(
        Array.from(container.querySelectorAll("sup")).map((n) => n.textContent),
      ).toEqual(["1", "2"]);
      for (const a of container.querySelectorAll("a"))
        expect(
          document.getElementById(decodeURIComponent(a.hash.slice(1))),
        ).not.toBeNull();
    } else if (file === "roles.math.yml" || file === "directives.math.yml") {
      const values = expected
        .filter((n) => ["math", "inlineMath"].includes(n.type))
        .map((n) => n.value?.trim());
      expect(
        Array.from(
          container.querySelectorAll(
            'annotation[encoding="application/x-tex"]',
          ),
        ).map((n) => n.textContent?.trim()),
      ).toEqual(values);
      expect(container.querySelector(".unhandled")).toBeNull();
    } else if (file === "directives.code.yml") {
      const codes = expected.filter((n) => n.type === "code");
      const rendered = Array.from(container.querySelectorAll("pre > code"));
      expect(rendered.map((n) => n.textContent)).toEqual(
        codes.map((n) => n.value),
      );
      codes.forEach((code, index) => {
        const element = rendered[index];
        expect(element).toHaveClass(`language-${code.lang}`);
        if (code.class) expect(element).toHaveClass(code.class);
        if (code.showLineNumbers)
          expect(element.firstElementChild).toHaveAttribute(
            "data-line-number",
            String(code.startingLineNumber ?? 1),
          );
        expect(element.querySelectorAll("mark")).toHaveLength(
          code.emphasizeLines?.length ?? 0,
        );
      });
    } else if (
      file === "directives.image.yml" ||
      file === "directives.figure.yml"
    ) {
      const images = expected.filter((n) => n.type === "image");
      const rendered = Array.from(container.querySelectorAll("img"));
      expect(rendered).toHaveLength(images.length);
      images.forEach((image, index) => {
        expect(rendered[index]).toHaveAttribute("src", image.url);
        expect(rendered[index]).toHaveAttribute("alt", image.alt ?? "");
        if (image.align)
          expect(rendered[index]).toHaveClass(`align-${image.align}`);
        if (image.width)
          expect(rendered[index]).toHaveStyle({ width: image.width });
        if (image.class)
          for (const name of image.class.split(" "))
            expect(rendered[index]).toHaveClass(name);
      });
      expect(
        Array.from(container.querySelectorAll("figcaption")).map(
          (n) => n.textContent,
        ),
      ).toEqual(expected.filter((n) => n.type === "caption").map(text));
      expect(
        Array.from(container.querySelectorAll(".legend")).map(
          (n) => n.textContent,
        ),
      ).toEqual(expected.filter((n) => n.type === "legend").map(text));
    } else if (file === "directives.table.yml") {
      expect(
        Array.from(container.querySelectorAll("th, td")).map((n) => ({
          header: n.tagName === "TH",
          text: n.textContent,
        })),
      ).toEqual(
        expected
          .filter((n) => n.type === "tableCell")
          .map((n) => ({ header: n.header ?? false, text: text(n) })),
      );
      const caption = expected.find((n) => n.type === "caption");
      expect(container.querySelector("figcaption")?.textContent).toBe(
        caption ? text(caption) : undefined,
      );
    } else {
      // Generic roles/directives, typography, comments and admonitions have
      // precise upstream HTML expectations. Class order and content matter.
      expect(html).not.toBeNull();
      expect(semanticDOM(container.innerHTML)).toEqual(semanticDOM(html ?? ""));
    }
  });
});

describe("extension edge cases and renderer policy", () => {
  it("preserves unknown directive arguments/options/body in MyST's explicit generic wrapper", () => {
    const { container } = render(
      markup(
        ":::{custom} argument\n:option: value\n\n*raw* <script>bad</script>\n:::",
      ),
    );
    expect(container.querySelector(".kind")?.textContent).toBe("{custom}");
    expect(container.querySelector(".args")?.textContent).toBe("argument");
    expect(container.querySelector("pre")?.textContent).toBe(
      ":option: value\n\n*raw* <script>bad</script>",
    );
    expect(container.querySelector("script")).toBeNull();
  });
  it("nests directives in longer fences and containers with YAML options", () => {
    const source =
      "> :::::{admonition} *Outer*\n> ---\n> name: nested\n> ---\n>\n> :::{note}\n> Inner **body**\n> :::\n> :::::\n\n[go](#nested)";
    const { container } = render(markup(source));
    expect(container.querySelectorAll("blockquote aside")).toHaveLength(2);
    expect(container.querySelector("aside aside strong")?.textContent).toBe(
      "body",
    );
    const link = container.querySelector("a")!;
    expect(
      document.getElementById(decodeURIComponent(link.hash.slice(1))),
    ).toBe(container.querySelector("aside"));
  });
  it("keeps malformed directive options reviewable with a diagnostic", () => {
    for (const options of [
      ":name: [broken",
      "---\nname: A\nname: B\n---",
      "---\n- array\n---",
      "---\nname: A",
    ]) {
      const { container, unmount } = render(
        markup("```{note}\n" + options + "\n\nbody\n```"),
      );
      expect(container.querySelector(".unhandled pre")?.textContent).toBe(
        options + "\n\nbody",
      );
      expect(container.querySelector(".unhandled")?.textContent).toMatch(
        /Invalid|Unclosed/,
      );
      unmount();
    }
  });
  it("handles closing fences, indentation and unfinished syntax without losing source", () => {
    const { container } = render(
      markup(
        ":::python\na\n:::suffix\nb\n::::\n\nafter\n\n    :::literal\n\n{func}`unterminated",
      ),
    );
    expect(container.querySelector("pre")?.textContent).toBe("a\n:::suffix\nb");
    expect(container.textContent).toContain("after");
    expect(container.textContent).toContain(":::literal");
    expect(container.textContent).toContain("{func}`unterminated");
  });
  it("escapes roles with odd backslashes and honors even backslashes", () => {
    const nodes = all<DocumentationNode>(
      parseDocumentation(
        "\\{func}`plain` \\\\{func}`role` {func}`  exact  ` {func}``tick`payload``",
      ),
    );
    expect(
      nodes.filter((n) => n.type === "mystRole").map((n) => n.value),
    ).toEqual(["role", "  exact  ", "tick`payload"]);
  });
  it("scopes repeated footnote and target IDs across documentation instances", () => {
    const source =
      "(label)=\n# Heading\n[local](#label) {ref}`title <label>` a[^one] b[^one]\n\n[^one]: note";
    const { container } = render(
      <>
        {markup(source)}
        {markup(source)}
      </>,
    );
    const ids = Array.from(container.querySelectorAll("[id]")).map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(container.querySelectorAll("sup a")).toHaveLength(4);
    for (const link of container.querySelectorAll("a"))
      expect(
        document.getElementById(decodeURIComponent(link.hash.slice(1))),
      ).not.toBeNull();
  });
  it("scopes footnotes in independently parsed directive bodies", () => {
    const source =
      "root[^n]\n\n[^n]: root note\n\n:::{note}\nfirst[^n]\n\n[^n]: first note\n:::\n\n:::{note}\nsecond[^n]\n\n[^n]: second note\n:::";
    const { container } = render(markup(source));
    const refs = Array.from(
      container.querySelectorAll<HTMLAnchorElement>("sup a"),
    );
    expect(refs).toHaveLength(3);
    expect(
      new Set(Array.from(container.querySelectorAll("[id]")).map((n) => n.id))
        .size,
    ).toBe(6);
    expect(
      refs.map(
        (a) =>
          document.getElementById(decodeURIComponent(a.hash.slice(1)))
            ?.textContent,
      ),
    ).toEqual(["root note↩", "first note↩", "second note↩"]);
  });
  it("renders tasks and table alignment, and retains content after block breaks", () => {
    const { container } = render(
      markup(
        "- [x] done\n- [ ] todo\n\n| A | B |\n| :- | -: |\n| x | y |\n\n+++ {broken}\n\nbody\n% hidden",
      ),
    );
    const boxes = container.querySelectorAll("input");
    expect(boxes[0]).toBeChecked();
    expect(boxes[1]).not.toBeChecked();
    for (const box of boxes) expect(box).toBeDisabled();
    expect(container.querySelector("th")).toHaveStyle({ textAlign: "left" });
    expect(container.querySelectorAll("td")[1]).toHaveStyle({
      textAlign: "right",
    });
    expect(container.textContent).toContain("body");
    expect(container.textContent).not.toContain("hidden");
  });
  it("parses math in containers and preserves escaped dollar signs", () => {
    const source =
      "\\$literal\\$ and $a=\\$3$\n\n> $$\n> x^2\n> $$ (eq)\n\n- $$ a=1 $$\n\n\\begin{align*}\na&=b\n\\end{align*}";
    const nodes = all<DocumentationNode>(parseDocumentation(source)).filter(
      (n) => n.type === "math",
    );
    expect(nodes.map((n) => n.value)).toEqual([
      "a=\\$3",
      "x^2",
      "a=1",
      "\\begin{align*}\na&=b\n\\end{align*}",
    ]);
    const { container } = render(markup(source));
    expect(container.querySelectorAll("math")).toHaveLength(4);
    expect(container.textContent).toContain("$literal$");
  });
  it("isolates math macros and rejects trusted commands without injecting source HTML", () => {
    const { container } = render(
      markup(
        "$\\def\\myvar{x}\\myvar$ $\\myvar$\n\n$\\href{javascript:alert(1)}{x}$\n\n```{image} javascript:alert(1)\n:alt: bad\n```\n\n```{code-cell} python\nprint('<script>not executed</script>')\n```",
      ),
    );
    expect(container.querySelectorAll("math")).toHaveLength(2);
    expect(container.querySelectorAll(".math.unhandled")).toHaveLength(1);
    expect(container.querySelector("mtext")?.textContent).toBe("\\href");
    expect(container.querySelector("script, a, img")).toBeNull();
    expect(
      container.querySelector("pre.language-python, pre code.language-python")
        ?.textContent,
    ).toContain("not executed");
  });
});
