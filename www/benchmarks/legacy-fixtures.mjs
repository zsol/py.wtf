// Optional baseline capture, never imported by the application or test suite.
// node benchmarks/legacy-fixtures.mjs <isolated mystjs@0.0.13 install>
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const legacy = createRequire(resolve(process.argv[2], "package.json"));
if (
  JSON.parse(
    readFileSync(
      resolve(process.argv[2], "node_modules/mystjs/package.json"),
      "utf8",
    ),
  ).version !== "0.0.13"
)
  throw new Error("Expected mystjs 0.0.13");
const parser = new (legacy("mystjs").MyST)();
const cases = [
  ["long front matter delimiter", "----\ntitle: Hello\n----\n\nbody"],
  [
    "registered roles",
    "{raw}`<b>raw</b>` {sub}`2` {superscript}`n` {abbr}`CSS (Cascading Style Sheets)` {math}`x^2` {ref}`title <label>`",
  ],
  [
    "unknown directive",
    "```{custom} args\n:option: untouched\n\n**body**\n```",
  ],
  [
    "admonition directive",
    "```{admonition} Title\n:class: tip\n\n**body**\n```",
  ],
  ["note directive", ":::{note}\nbody\n:::"],
  [
    "code directive",
    "```{code-block} python\n:linenos:\n:lineno-start: 2\n\na = 1\n```",
  ],
  [
    "image directive",
    "```{image} /image.png\n:alt: example\n:width: 200px\n:align: center\n```",
  ],
  [
    "figure directive",
    "```{figure} /image.png\n:name: figure\n\nCaption\n\nLegend\n```",
  ],
  [
    "list-table directive",
    "```{list-table} Title\n:header-rows: 1\n\n* - A\n  - B\n* - x\n  - y\n```",
  ],
  ["math directive", "```{math}\n:label: equation\n\nx^2\n```"],
  ["paragraphs and breaks", "First  \nsecond\nsoft\\\nbreak\n\nNext"],
  ["headings", "# Title\n\nSubtitle\n========\n\n---"],
  [
    "nested formatting",
    "**strong and *emphasis*** with ~~literal~~ &amp; &#65;",
  ],
  ["tight list", "- a\n- b\n  - nested **strong**\n  - other\n- c"],
  ["loose list", "- a\n\n- b\n\n  paragraph\n\n  > quote"],
  ["ordered lists", "3. three\n4. four\n\n* one\n* two"],
  ["nested quotes", "> first\n>\n> > nested\n>\n> - item\n> - second"],
  [
    "code whitespace",
    "`  inline   space  `\n\n    a  b\n    c\n\n```py\n\na  b\n\n```",
  ],
  ["roles", "{func}`alpha.foo` *{py:class}`proj/Class`* {+:_-}`opaque`"],
  ["role payload whitespace", "{func}`  alpha.foo  ` {func}`` a`b ``"],
  ["role escapes and code", "\\{func}`x` `{func}` and `{func}x`"],
  [
    "role malformed",
    "{func}`open\n\n{func}`multi\nline` {func}``bad` {f1}`digit`",
  ],
  [
    "role name bounds",
    "{" + "x".repeat(36) + "}`yes` {" + "x".repeat(37) + "}`no`",
  ],
  [
    "inline and reference links",
    "[**link**](https://example.org/a?x=1&y=2 \"Title\") [ref][id]\n\n[id]: /path 'More'",
  ],
  [
    "images",
    '![*alt* `code` &amp;](a.png "title") ![ref][pic]\n\n[pic]: /pic.png',
  ],
  [
    "autolinks",
    "<https://example.org> <hello@example.org> https://example.org",
  ],
  [
    "unsafe links",
    "[bad](javascript:alert(1)) ![bad](data:text/html;base64,AA) [ok](#target)",
  ],
  [
    "HTML recognition",
    "<b>text</b>\n\n<script>bad()</script>\n\n```html\n<b>literal</b>\n```",
  ],
  ["front matter", "---\ntitle: Hello\n---\n\nbody"],
  ["unclosed front matter", "---\ntitle: Hello\n\nbody"],
  ["colon fence", ":::python\na\n:::suffix\nb\n::::\n\nafter"],
  ["unclosed colon fence", ":::python\na\nb"],
  ["colon fence in quote", "> :::text\n> a\n> :::\n\nafter"],
  ["colon fence indentation", "  :::text\n  a\n   b\n  :::"],
  ["definition list", "Term\n: Def\n\nTerm 2\n: First\n: Second"],
  ["tasks", "- [x] done\n- [ ] todo\n- [X] done\n- [x]no marker"],
  ["tables", "| A | B |\n| :- | -: |\n| *x* | `y` |"],
  [
    "footnotes",
    "a[^x] again[^x] and[^y]\n\n[^x]: first\n\n    second paragraph\n\n[^y]: other",
  ],
  ["unresolved footnote", "text[^missing]"],
  ["comments and target", "% first\n% next\n(label)=\n## Header\nbody"],
  ["inline math", "$ x $ and 2$x$3 and $a\\$b$"],
  ["display math", "$$\nx^2\n$$ (eq)\n\nafter"],
  ["amsmath", "\\begin{align}\na &= b\n\\end{align}\n\nafter"],
];
writeFileSync(
  new URL("../__tests__/fixtures/myst/legacy-0.0.13.json", import.meta.url),
  JSON.stringify(
    cases.map(([title, source]) => ({
      title,
      source,
      ast: parser.parse(source),
    })),
    null,
    2,
  ) + "\n",
);
