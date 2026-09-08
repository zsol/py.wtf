# MyST compatibility audit

The baseline is the published **mystjs 0.0.13** with the defaults used by this
application, plus the old React renderer. Parser recognition and rendered
behavior are evaluated separately: the old parser recognized several extensions
whose React handlers discarded their contents. Restoring those extensions must
produce their documented meaning, not simply expose their Markdown source.

The replacement uses markdown-it 14.3.1's public API, markdown-it-deflist 4,
markdown-it-footnote 4, and local MyST delimiter/directive rules. It does not
emulate mystjs's unused MDAST/HAST/export/plugin API. YAML options use yaml 2;
math is rendered with KaTeX 0.18.5 as native MathML.

## Profiles and evidence

The application uses the `myst` profile: CommonMark plus tables, footnotes,
definition lists, task lists, colon fences, comments, targets, block breaks,
roles/directives, front matter, dollar math and amsmath. These were enabled in
the legacy configuration. Strikethrough is an explicitly enabled addition.
Dollar math retains the legacy settings allowing spaces, adjacent digits,
labels and double dollars in inline contexts. Linkification and typographic
substitutions remain disabled. Nesting is bounded at 20, as before.
These optional modes are documented by
[MyST-Parser's extension reference](https://myst-parser.readthedocs.io/en/stable/syntax/optional.html).

The `commonmark` profile disables every MyST extension for conformance tests.
It recognizes all URL destinations as CommonMark syntax; the actual UI still
validates URLs before assigning them to DOM attributes. All **652 official
CommonMark 0.31.2 examples** pass parsed-tree semantic comparisons. All **580
examples unaffected by the explicit HTML/URL policy** also pass through the real
React component. The selection is based on parsed HTML/URL syntax, never on
failed assertions. Tests preserve code whitespace, attributes, titles, list
nesting, start numbers, paragraph wrappers and inline structure. They normalize
HTML serialization whitespace between blocks, Emotion CSS, and the app's
`picture` wrapper. The raw-HTML projection is test-only. See
[CommonMark's conformance-test guidance](https://spec.commonmark.org/0.31.2/#about-this-document).

`myst-legacy.test.ts` checks 43 captured baseline inputs, including two explicitly
classified changes. It compares complete semantic trees for the covered syntax,
coalescing adjacent text and normalizing only incidental node shape (table
sections, generated footnote backrefs, code language absence, raw HTML's final
newline). It does not flatten list/formatting structure into text.

`myst-spec.test.tsx` checks **51 pinned upstream MyST fixtures**, plus container,
escaping, malformed-input, navigation and renderer-policy regressions. The
fixtures and licenses are in `__tests__/fixtures/myst`. Generic roles/directives,
comments, typography and admonitions are compared against upstream HTML;
code/math/images/figures/tables/footnotes are checked for their content,
attributes, structure and working navigation. This is a bounded fixture
selection, not a claim that every MyST/Sphinx feature is implemented.

## Compatibility matrix

| Syntax / observable behavior                                          | Legacy and current result                                                                                                                                                                                                                   | Evidence / intentional change                                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Paragraphs, headings, emphasis, strong, breaks and quotes             | Same content and nesting. Plain text has no extra span; `strong` replaces `b`.                                                                                                                                                              | All CommonMark examples; [emphasis semantics](https://spec.commonmark.org/0.31.2/#emphasis-and-strong-emphasis).                                                                                                                                                                              |
| Tight / loose lists, ordered starts, nesting                          | Tight items have no paragraph wrapper; loose items retain it. The initial rewrite's extra tight-list paragraphs were a regression and are fixed.                                                                                            | Legacy tree fixtures and [CommonMark lists](https://spec.commonmark.org/0.31.2/#lists).                                                                                                                                                                                                       |
| Inline, indented and fenced code                                      | Whitespace and source preserved. Application profile retains legacy's removal of one final block LF; CommonMark profile preserves it. Fence language now reaches the code class.                                                            | Legacy fixtures and [code blocks](https://spec.commonmark.org/0.31.2/#fenced-code-blocks).                                                                                                                                                                                                    |
| Links, reference links, images, autolinks                             | Same URL/alt/structure; previously ignored titles now reach the DOM. Bare URLs stay text.                                                                                                                                                   | Legacy fixtures and CommonMark [links](https://spec.commonmark.org/0.31.2/#links), [images](https://spec.commonmark.org/0.31.2/#images).                                                                                                                                                      |
| Role delimiters and payloads                                          | Legacy ASCII name alphabet and 36-character bound retained. Exact backtick runs, single-line payload whitespace, code precedence and malformed fallback retained. Even backslashes now correctly permit a role after the escaped backslash. | Legacy fixtures; [CommonMark escapes](https://spec.commonmark.org/0.31.2/#backslash-escapes) and [MyST role syntax](https://myst-parser.readthedocs.io/en/stable/syntax/roles-and-directives.html#roles-an-in-line-extension-point).                                                          |
| Python/application roles                                              | `{func}`, `{py:class}` etc. still pass the original name/value to the existing resolver. Qualified, cross-project and standard-library targets are tested using actual app links.                                                           | App integration tests. Unqualified names and Sphinx tilde/title resolution retain existing resolver limitations.                                                                                                                                                                              |
| Standard / unknown roles                                              | HTML typography, math and local reference roles now render their meaning. An unregistered role without an app resolver gets an explicit kind/content wrapper. Raw/code/literal roles render escaped code.                                   | Pinned `roles.*` fixtures; [role-specific content parsing](https://myst-parser.readthedocs.io/en/stable/syntax/roles-and-directives.html#how-roles-parse-content). The generic wrapper matches upstream `roles.generic.yml`, rather than claiming arbitrary source fallback is conformance.   |
| Colon fences                                                          | Same code/directive recognition, indentation, closing run and auto-close-at-container/EOF behavior. A closing run with a suffix remains body text. Nested directives use longer outer fences.                                               | Legacy fixtures; [colon fences](https://myst-parser.readthedocs.io/en/stable/syntax/optional.html#code-fences-using-colons) and [nesting directives](https://myst-parser.readthedocs.io/en/stable/syntax/roles-and-directives.html#nesting-directives).                                       |
| Directives and options                                                | Generic kind/args/raw source retained. Registered directives parse colon options (including no separating space) or YAML mappings and structured body content. Invalid options show a diagnostic with original source.                      | Pinned `directives.*` fixtures; [option syntax](https://myst-parser.readthedocs.io/en/stable/syntax/roles-and-directives.html#parameterizing-directives-options). Unknown directives match the upstream generic fixture's explicit wrapper.                                                   |
| Admonitions, code, image/figure, table/list-table and math directives | Previously dropped by the UI; now render semantic content. Admonition titles/classes, code language/line numbers/emphasis/caption, image alt/size/alignment, figure caption/legend, table cells/headers and math labels are tested.         | Pinned upstream fixtures. A no-argument admonition's first-line content follows [MyST-Parser's directive argument rules](https://myst-parser.readthedocs.io/en/stable/syntax/roles-and-directives.html#directives-a-block-level-extension-point).                                             |
| Tables, definition lists and task lists                               | Recognition preserved. Real table/dl/disabled-checkbox elements replace discarded/stubbed output. Alignment and checked states are retained.                                                                                                | Legacy fixtures, upstream table fixtures, [definition lists](https://myst-parser.readthedocs.io/en/stable/syntax/optional.html#definition-lists) and [task lists](https://myst-parser.readthedocs.io/en/stable/syntax/optional.html#task-lists).                                              |
| Footnotes                                                             | Recognition, labels and multiblock content preserved. Numbered references, definitions and backlinks now render. IDs are scoped per mounted document and independently parsed directive body.                                               | Legacy and upstream fixtures; [MyST footnotes](https://mystmd.org/spec/footnotes). Generated ID spelling is intentionally app-specific; every tested link resolves to its intended node.                                                                                                      |
| Comments / targets / block breaks                                     | Comments remain invisible. Targets now provide local navigation. Block-break metadata remains represented; subsequent flow content is rendered instead of being lost inside an unsupported legacy block wrapper.                            | [MyST blocks/comments](https://mystmd.org/spec/blocks), pinned `blocks.yml`, `comments.yml`, `references.target.yml`. A block break is not a thematic rule.                                                                                                                                   |
| Dollar / amsmath                                                      | Legacy recognition and payloads retained, including math within lists/quotes and escaped dollars. Formerly dropped math now renders native MathML; unsupported TeX remains visible with a diagnostic.                                       | Legacy fixtures, upstream math fixtures, [math modes](https://myst-parser.readthedocs.io/en/stable/syntax/optional.html#math-shortcuts).                                                                                                                                                      |
| Front matter                                                          | Closed initial `---` / `...` front matter stays visible as YAML code, preserving app behavior. Unclosed front matter follows CommonMark rather than losing the final text as the legacy plugin did.                                         | Explicit differential regression; [front matter delimiters](https://myst-parser.readthedocs.io/en/stable/configuration.html#frontmatter-local-configuration), CommonMark thematic-break/paragraph examples. Openers contain at least three hyphens; a hyphen closer must be at least as long. |
| Strikethrough                                                         | Explicit addition: `~~text~~` renders a strike with nested formatting. The legacy default left it literal despite a renderer handler.                                                                                                       | Differential test plus [MyST strikethrough mode](https://myst-parser.readthedocs.io/en/stable/syntax/optional.html#strikethrough).                                                                                                                                                            |
| Raw HTML / executable URLs                                            | Raw HTML remains recognized but omitted by the UI, as before. Text between inline tags and escaped/fenced HTML is retained. Unsafe link/image destinations remain rejected.                                                                 | Existing renderer-policy tests, plus CommonMark parser tests. This is legacy-compatible rendering policy, not a claim of raw-HTML output conformance.                                                                                                                                         |

## Registry and remaining boundaries

The built-in directive registry is `admonition`, `attention`, `caution`, `danger`,
`error`, `hint`, `important`, `note`, `tip`, `warning`, `seealso`, `code`,
`code-block`, `code-cell`, `image`, `figure`, `table`, `list-table`, and `math`.
The built-in role registry is `code`, `literal`, `raw`, `emphasis`, `strong`,
`sub`/`subscript`, `sup`/`superscript`, `abbr`/`abbreviation`, `math`, and locally
resolvable `ref`/`eq`. All remaining roles use the app callback when supplied.
Unknown/custom directives are opaque; their options/body are not evaluated.

This component is a docstring renderer, not a book builder. It does not execute
code cells, include files, fetch directive content, resolve external inventories,
run custom Sphinx extensions, generate a table of contents, or perform book-wide
figure/equation numbering. Local references preserve their provided label/title.
Directive option support is limited to the presentation fields listed above;
unimplemented options remain in the parsed `options`/`raw` fields. Full option
schemas, advanced table sizing/stub columns, image scaling/targets and output
format directives are not covered by the conformance claims. The old app did
not render these directives at all. Preserving unknown source is a diagnostic
behavior; it is not evidence that a known unsupported extension is implemented.

KaTeX receives source through its public converter with `trust: false`, fresh
macro state, expansion/size limits and strict errors. Only its generated MathML
is inserted into the DOM; arbitrary source HTML is never inserted. Invalid TeX
is escaped by React in the diagnostic. Trust-dependent commands cannot create
links or embedded resources. See [KaTeX options](https://katex.org/docs/options)
and [security guidance](https://katex.org/docs/security).

The benchmarks measure tokenization and tree conversion, not MathML generation,
React rendering, bundle download, or layout. The restored rendering features add
code and dependencies; parser speedups are not an end-to-end page-speed claim.
