import { ThemeProvider } from "@emotion/react";
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";

import Documentation from "@/components/Docs/Documentation";
import MyST from "@/components/MyST";
import { darkTheme } from "@/components/core/theme/theme";

import type { Project } from "@/lib/docs";
import { DocumentationNode, MySTRole, parseDocumentation } from "@/lib/myst";

import projectFixture from "./index/project-alpha.json";

function markup(
  source: string,
  roles?: (role: MySTRole) => React.ReactElement,
) {
  return (
    <ThemeProvider theme={darkTheme}>
      <MyST source={source} roles={roles} />
    </ThemeProvider>
  );
}

function leaves(nodes: DocumentationNode[]): DocumentationNode[] {
  return nodes.flatMap((node) =>
    "children" in node ? leaves(node.children ?? []) : [node],
  );
}

describe("documentation parser and renderer", () => {
  it("resolves qualified, cross-project and standard-library roles in the app", () => {
    const { getByRole, container } = render(
      <ThemeProvider theme={darkTheme}>
        <Documentation project={projectFixture as unknown as Project}>
          {[
            "{func}`alpha.foo.bar` {py:func}`project-beta/beta.run` {class}`--std--/functions.str` {func}`unresolved`",
          ]}
        </Documentation>
      </ThemeProvider>,
    );
    expect(getByRole("link", { name: "bar" })).toHaveAttribute(
      "href",
      "/project-alpha/alpha.foo/bar",
    );
    expect(getByRole("link", { name: "run" })).toHaveAttribute(
      "href",
      "/project-beta/beta/run",
    );
    expect(getByRole("link", { name: "str" })).toHaveAttribute(
      "href",
      "//docs.python.org/3/library/functions.html#func-str",
    );
    expect(container.querySelector("code")).toHaveTextContent("unresolved");
  });
  it("renders headings, nested emphasis, entities, escapes and both kinds of line break", () => {
    const { container, getByRole } = render(
      markup(
        "# Title\n\n## Subheading\n\n***nested*** &amp; \\*literal*  \nnext\nsoft\n\n~~removed~~\n\n---",
      ),
    );
    expect(
      getByRole("heading", { name: "Title", level: 1 }),
    ).toBeInTheDocument();
    expect(
      getByRole("heading", { name: "Subheading", level: 2 }),
    ).toBeInTheDocument();
    expect(container.querySelector("em strong")).toHaveTextContent("nested");
    expect(container).toHaveTextContent("& *literal*");
    expect(container.querySelectorAll("br")).toHaveLength(1);
    expect(container.querySelector("p")?.textContent).toContain("next\nsoft");
    expect(container.querySelector("s")).toHaveTextContent("removed");
    expect(container.querySelector("hr")).toBeInTheDocument();
  });

  it("keeps ordered starts, nested lists, loose paragraphs and blockquotes", () => {
    const source =
      "3. first\n   - nested *item*\n     > quoted\n4. second\n\n   another paragraph\n\n> outer\n>\n> > inner";
    const { container } = render(markup(source));
    expect(container.querySelector("ol")).toHaveAttribute("start", "3");
    expect(container.querySelector("ol ul em")).toHaveTextContent("item");
    expect(container.querySelector("ol ul blockquote")).toHaveTextContent(
      "quoted",
    );
    expect(container.querySelector("blockquote blockquote")).toHaveTextContent(
      "inner",
    );
    expect(container).toHaveTextContent("another paragraph");
  });

  it("preserves fenced, indented and inline code without interpreting roles or HTML", () => {
    const source =
      "``a ` b``\n\n~~~python\n{func}`bar`\n<script>safe text</script>\n~~~\n\n    indented\n\n````pycon\n>>> print('```')\n````";
    const roles = jest.fn((role: MySTRole) => <a>{role.value}</a>);
    const { container } = render(markup(source, roles));
    expect(container.querySelector("code")).toHaveTextContent("a ` b");
    expect(
      Array.from(
        container.querySelectorAll("pre code"),
        (node) => node.textContent,
      ),
    ).toEqual([
      "{func}`bar`\n<script>safe text</script>",
      "indented",
      ">>> print('```')",
    ]);
    expect(roles).not.toHaveBeenCalled();
    expect(container.querySelector("script")).toBeNull();
  });

  it("passes Python, qualified, project and unknown roles verbatim to the resolver", () => {
    const source =
      "{func}`bar` *{py:class}`project/pkg.Type`* {custom-role}``text ` here``";
    const roles = jest.fn((role: MySTRole) => <code>{role.value}</code>);
    render(markup(source, roles));
    expect(roles.mock.calls.map(([role]) => role)).toEqual([
      { type: "mystRole", name: "func", value: "bar" },
      { type: "mystRole", name: "py:class", value: "project/pkg.Type" },
      { type: "mystRole", name: "custom-role", value: "text ` here" },
    ]);
  });

  it("distinguishes escaped roles, code spans and escaped backslashes", () => {
    const source = "\\{func}`escaped` `{func}``code`` ` \\\\{func}`real`";
    const roles = leaves(parseDocumentation(source)).filter(
      (node) => node.type === "mystRole",
    );
    expect(roles).toEqual([{ type: "mystRole", name: "func", value: "real" }]);
  });

  it("keeps unresolved roles visible and uses the current resolver after rerender", () => {
    const source = "{func}`bar`";
    const { container, rerender, getByRole } = render(markup(source));
    expect(container.querySelector(".role code:last-child")).toHaveTextContent(
      "bar",
    );
    rerender(markup(source, (role) => <a href="/new-target">{role.value}</a>));
    expect(getByRole("link", { name: "bar" })).toHaveAttribute(
      "href",
      "/new-target",
    );
    rerender(markup("changed source"));
    expect(container).toHaveTextContent("changed source");
    expect(container).not.toHaveTextContent("bar");
  });

  it("renders links, reference links, autolinks and images with plain alt text", () => {
    const { getByRole, getByAltText } = render(
      markup(
        '[site](https://example.com "Title") [ref][id] <https://python.org>\n\n![*alt* &amp; `code`](image.png "Image")\n\n[id]: /local',
      ),
    );
    expect(getByRole("link", { name: "site" })).toHaveAttribute(
      "title",
      "Title",
    );
    expect(getByRole("link", { name: "ref" })).toHaveAttribute(
      "href",
      "/local",
    );
    expect(getByRole("link", { name: "https://python.org" })).toHaveAttribute(
      "href",
      "https://python.org",
    );
    expect(getByAltText("alt & code")).toHaveAttribute("src", "image.png");
    expect(getByAltText("alt & code")).toHaveAttribute("title", "Image");
  });

  it("drops raw HTML blocks and tags, retaining safe inline text", () => {
    const { container } = render(
      markup(
        'before <b onclick="x()">inline</b> after\n\n<script>alert(1)</script>\n\n<iframe src="https://example.com">hidden</iframe>\n\n<!-- comment -->\n\nlast',
      ),
    );
    expect(container).toHaveTextContent("before inline after");
    expect(container).toHaveTextContent("last");
    expect(container).not.toHaveTextContent("alert(1)");
    expect(container).not.toHaveTextContent("hidden");
    expect(container.querySelector("b,script,iframe,[onclick]")).toBeNull();
  });

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "javascript&#58;alert(1)",
    "vbscript:run",
    "data:text/html,evil",
  ])("rejects executable link and image targets: %s", (url) => {
    const { container } = render(markup(`[unsafe](${url}) ![unsafe](${url})`));
    expect(container.querySelector("a, img")).toBeNull();
    expect(container).toHaveTextContent("unsafe");
  });

  it("displays legacy YAML front matter and renders enabled MyST extensions", () => {
    const { container } = render(
      markup(
        "---\ntitle: example\n---\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\ntext[^n]\n\n[^n]: footnote\n\n```{note}\ndirective body\n```\n\n:::{warning}\ncolon body\n:::\n\n$x^2$",
      ),
    );
    expect(container.querySelector("pre code")).toHaveTextContent(
      "title: example",
    );
    expect(container.querySelectorAll("table th")).toHaveLength(2);
    expect(container.querySelectorAll("table td")).toHaveLength(2);
    expect(container.querySelector(".footnotes")).toHaveTextContent("footnote");
    expect(container.querySelectorAll("aside")).toHaveLength(2);
    expect(container.querySelector("math annotation")).toHaveTextContent("x^2");
    for (const text of ["directive body", "colon body"]) {
      expect(container).toHaveTextContent(text);
    }
  });

  it("does not leak reference definitions between parse calls", () => {
    parseDocumentation("[label]: /first");
    const { container } = render(markup("[label]"));
    expect(container.querySelector("a")).toBeNull();
    expect(container).toHaveTextContent("[label]");
  });

  it.each([
    "",
    "{func}`unclosed",
    "{func}``wrong`",
    "{func}`line\nbreak`",
    "```python\nunfinished",
    "---\nunclosed front matter",
    "[broken](",
    "> ".repeat(500) + "deep",
    "*".repeat(10000),
    "{func}``x` ".repeat(2000),
  ])("tolerates malformed or deeply nested input (%#)", (source) => {
    expect(() => parseDocumentation(source)).not.toThrow();
  });
});
