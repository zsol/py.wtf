# Fixture provenance

- `commonmark-0.31.2.json`: all 652 examples, unmodified, from
  <https://spec.commonmark.org/0.31.2/spec.json>. CommonMark Spec by John
  MacFarlane, version 0.31.2, January 28, 2024. Licensed under
  [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/).
  The fixture remains under that license; the application is not derived from
  the specification's prose. JSON formatting may be normalized by Prettier.
- `myst-spec.json`: 51 source-bearing examples from the 16 YAML files named in
  each entry, converted to JSON with `myst` renamed to `source`, `mdast` to `ast`,
  and only `title`, source, AST and HTML retained. No source/expected content was
  rewritten to fit this implementation. Source repository
  [jupyter-book/myst-spec](https://github.com/jupyter-book/myst-spec/tree/2b0f0e77f837af2818aa4c0f6d8817c8e5f6d1a8/docs/examples),
  commit `2b0f0e77f837af2818aa4c0f6d8817c8e5f6d1a8`. Copyright (c) 2022
  ExecutableBookProject. MIT license reproduced in `myst-spec-LICENSE.txt`.
- `legacy-0.0.13.json`: local inputs and captured `new MyST().parse(source)`
  results from published `mystjs@0.0.13`, using its default configuration.
  Reproduce with `node benchmarks/legacy-fixtures.mjs <isolated-install>` from
  `www`. See `benchmarks/README.md` for the isolated installation command.

The MyST selection covers blocks/comments, generic and HTML/math roles,
generic/admonition/code/image/figure/math/table directives, footnotes and explicit
targets. It is deliberately bounded; it is not the entire MyST specification
suite. Tests identify which observations are checked: full DOM structure for
generic roles/directives, typography, comments and admonitions; semantic
content/attributes/navigation for math, code, images, figures, tables and
footnotes. Automatic book-wide numbering is outside this renderer's scope.
