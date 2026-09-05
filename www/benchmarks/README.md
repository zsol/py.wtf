# Focused MyST documentation renderer

`lib/myst.ts` uses markdown-it 14's public plugin/token APIs, a local MyST role
rule, and one pass into a small typed render tree. `components/MyST.tsx` renders
that tree as React elements. No HTML is injected. The tokenizer is configured
once; each parse has independent document state. `useMemo` retains only the
currently mounted source's tree and does not capture its role resolver.

This replaces mystjs 0.0.13, its general token-to-MDAST conversion and tree walks,
and the bundled but unused unified/HTML conversion pipeline. There are no
markdown-it private-path imports, aliases, subclasses, or compatibility overrides.

## Supported behavior and deliberate limits

| Input                                                                         | Current behavior                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CommonMark paragraphs, ATX/setext headings, emphasis, strong, thematic breaks | Rendered as semantic elements. Text spans no longer add a wrapper to every text fragment. Strong uses `strong` instead of `b`.                                                                                                                                                                                                                        |
| Nested ordered/unordered lists, starting numbers, blockquotes                 | Preserved, with the previous nesting limit of 20. List paragraphs remain explicit, including tight lists, matching the old renderer.                                                                                                                                                                                                                  |
| Backtick/tilde fences, indented code, inline code                             | Preserved as literal text; one final block newline is removed as before. Fence language/options do not add highlighting.                                                                                                                                                                                                                              |
| `{func}` / `{py:class}` and other roles followed by backtick content          | Name and content reach the existing resolver unchanged. Matching runs of backticks allow embedded backticks. Escaped braces and roles in code are not interpreted. Multiline/unterminated roles fall back to ordinary Markdown.                                                                                                                       |
| Qualified Python names, `project/fqname`, `--std--/fqname`                    | Existing app links are preserved. Unqualified names and Sphinx explicit-title/tilde syntax still depend on the existing resolver; this parser does not infer a module or implement new resolution semantics.                                                                                                                                          |
| Role with no resolver                                                         | Code text remains visible; the old generic component omitted it.                                                                                                                                                                                                                                                                                      |
| Links, reference links/images, angle-bracket autolinks                        | Preserved. Link/image titles are now retained. Bare URLs remain text. markdown-it validates URLs, including rejecting javascript/vbscript and non-image data URLs.                                                                                                                                                                                    |
| Images                                                                        | Normal image elements with plain text alt content, including entities and code. No arbitrary token attributes are copied to the DOM.                                                                                                                                                                                                                  |
| HTML                                                                          | Raw blocks and inline tags are discarded, as before. Text between inline tags remains text; fenced/escaped HTML stays literal.                                                                                                                                                                                                                        |
| Initial YAML front matter                                                     | Displayed as code, as observed in the old parser. No YAML evaluation. Unclosed front matter falls back to Markdown.                                                                                                                                                                                                                                   |
| Strikethrough                                                                 | Now parsed and rendered; the old renderer had a handler but its tokenizer did not enable this syntax.                                                                                                                                                                                                                                                 |
| Tables and footnotes                                                          | Readable Markdown text, with no table/footnote UI. Previously their renderer stubs discarded them. Footnote definitions are prevented from becoming ordinary reference links.                                                                                                                                                                         |
| Directives, colon fences, math, definition/task lists, MyST targets           | No extension semantics, admonitions, checkboxes, numbering, or math rendering. Backtick directives display their body as code; other forms fall back to ordinary Markdown. These were mostly unsupported/discarded nodes in the previous renderer. In particular plain colon fences previously became code blocks; they now remain ordinary Markdown. |

This is the subset needed to display the indexer's emitted documentation, not a
complete MyST/Sphinx implementation. Tests cover nested formatting, Python roles
and real resolver links, escaping, executable URLs, unsupported HTML/extensions,
malformed delimiters, large/deep input, source changes, and resolver changes.
The existing app suite is retained. Its old MyST test's sidebar-link false positive
is now documented and the docstring's unresolved-role fallback checked explicitly.

## Reproducing the benchmark

From `www`, install the current app with `npm ci`, then use Node 24:

```powershell
$legacy = Join-Path $env:TEMP 'py-wtf-myst-legacy'
npm install --prefix $legacy --ignore-scripts --no-audit --no-fund --save-exact mystjs@0.0.13
npm run bench:myst -- $legacy benchmarks/results.json
```

The legacy install is isolated and optional; mystjs is not a dependency of the
site, tests, or build. The benchmark loads the published 0.0.13 CommonJS bundle,
so it needs no legacy export/ESM patches. It executes the production parser source
using Node's TypeScript loader. A Node module-format warning can appear before
timing starts; it does not affect measurements. Set `MYST_BENCH_MS` (default 100)
for longer samples. Run on an otherwise idle machine when comparing changes.

Each stage has warmup, calibrated iteration counts, and seven timed samples.
`results.json` records all samples, median milliseconds, versions, hardware, and
workload sizes. Each iteration processes the entire workload (all 12 documents
for the fixture corpus). Results are consumed. Full parses use fresh tokens every
time, without React `useMemo` or a global source cache. We measure:

- Legacy construction plus parse, matching the old component's per-render use.
- Reused legacy parse, so constructor reuse cannot explain the entire gain.
- New complete parse (tokenization plus render-tree construction).
- Tokenization alone, and tree conversion from pre-tokenized inputs, separately.

Tree conversion is measured directly, not estimated by subtracting timings. These
are parser/tree timings; they do not measure React reconciliation, DOM layout,
network access, cold module loading, or end-user page latency. The old `parse`
method did not run the HTML rendering pipeline. Most of the measured gain comes
from removing its token-to-MDAST conversion and tree traversal overhead.

Workloads are the 12 existing Python-emitted project fixture docstrings (including
`more-itertools`' unzip example), a converted Requests `Session.request` docstring,
a roughly 256 KiB repeated mix of those docs with nested formatting/links/roles,
and a 64 KiB role-heavy docstring. The larger workloads deliberately repeat
realistic source rather than claiming to be naturally occurring single docstrings.
They exercise full parse cost on every repetition.

The Requests fixture was generated from Requests 2.34.2 with
`py_wtf.indexer.documentation.convert_to_myst(requests.Session.request.__doc__)`,
with trailing whitespace normalized to one final newline.
It includes the indexer's existing field-list-to-code fallback, including text
lost by that Python conversion. Requests' Apache 2.0 license and notice are included
alongside the fixture; the conversion is a modification of that docstring.
Source: [Requests 2.34.2 Session](https://github.com/psf/requests/blob/v2.34.2/src/requests/sessions.py).

## Recorded run

Node 24.20.0, Windows x64, AMD Ryzen 9 5900X; mystjs 0.0.13 versus markdown-it 14.3.1.
This run uses a 150 ms calibration target and seven samples per stage. Values
below are medians in milliseconds for a whole workload. They are local
microbenchmark results and will vary across runs and hardware.

Before timing, the benchmark asserts that text, role payloads, code values and
link targets match the legacy parser on every workload. These checks pass.
Formatting and the intentional unsupported-extension differences are covered
separately by the renderer tests; this is not full MyST specification conformance.

| Workload                 | UTF-8 bytes | Legacy construct + parse | Legacy reused parse | New parse | Speedup vs old component |
| ------------------------ | ----------: | -----------------------: | ------------------: | --------: | -----------------------: |
| fixture corpus           |       1,100 |                    4.101 |               0.845 |     0.039 |                   105.4x |
| more-itertools unzip     |         651 |                    0.493 |               0.218 |     0.018 |                    26.8x |
| requests Session.request |       1,979 |                    0.370 |               0.108 |     0.021 |                    18.0x |
| repeated mixed 256 KiB   |     263,815 |                   33.139 |              31.857 |     5.326 |                     6.2x |
| role-heavy 64 KiB        |      65,588 |                   45.679 |              43.616 |     3.672 |                    12.4x |

| Workload                 | Legacy tokenize | New tokenize | Legacy tree | New tree |
| ------------------------ | --------------: | -----------: | ----------: | -------: |
| fixture corpus           |           0.043 |        0.045 |       0.886 |   0.0044 |
| more-itertools unzip     |           0.021 |        0.016 |       0.162 |   0.0012 |
| requests Session.request |           0.023 |        0.022 |       0.080 |   0.0004 |
| repeated mixed 256 KiB   |           5.535 |        4.735 |      26.746 |   0.3387 |
| role-heavy 64 KiB        |           4.185 |        3.448 |      38.155 |   0.3513 |

Tokenization is roughly comparable; tree conversion is 79–222x faster on these
workloads. Stage medians do not necessarily add to the separately measured parse
median because JIT/GC and system noise vary. A reused legacy parser is still much
slower on repeated large docs, so the result is not only constructor reuse.
