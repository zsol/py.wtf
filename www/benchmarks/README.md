# Focused MyST documentation renderer

`lib/myst.ts` uses markdown-it 14's public plugin/token APIs, local MyST extension
rules, and one pass into a small typed render tree. `components/MyST.tsx` renders
that tree as React elements. Raw HTML is never injected; math uses KaTeX-generated MathML. The tokenizer is configured
once; each parse has independent document state. `useMemo` retains only the
currently mounted source's tree and does not capture its role resolver.

This replaces mystjs 0.0.13, its general token-to-MDAST conversion and tree walks,
and the bundled but unused unified/HTML conversion pipeline. There are no
markdown-it private-path imports, aliases, subclasses, or compatibility overrides.

## Compatibility and conformance

See [the compatibility audit](compatibility.md) for the legacy comparison,
explicit extension profile, normative sources, 652 CommonMark examples,
51 pinned MyST fixtures, renderer-policy exceptions, and registry limits.

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
Semantic structure and extension behavior have separate legacy and upstream
fixture tests. These corpus assertions are not a claim of full MyST conformance.

| Workload                 | UTF-8 bytes | Legacy construct + parse | Legacy reused parse | New parse | Speedup vs old component |
| ------------------------ | ----------: | -----------------------: | ------------------: | --------: | -----------------------: |
| fixture corpus           |       1,100 |                    4.158 |               0.865 |     0.048 |                    85.9x |
| more-itertools unzip     |         651 |                    0.513 |               0.219 |     0.026 |                    19.9x |
| requests Session.request |       1,979 |                    0.385 |               0.118 |     0.024 |                    16.0x |
| repeated mixed 256 KiB   |     263,815 |                   33.071 |              33.207 |     7.790 |                     4.2x |
| role-heavy 64 KiB        |      65,588 |                   53.874 |              53.545 |     4.219 |                    12.8x |

| Workload                 | Legacy tokenize | New tokenize | Legacy tree | New tree |
| ------------------------ | --------------: | -----------: | ----------: | -------: |
| fixture corpus           |           0.055 |        0.055 |       0.955 |   0.0051 |
| more-itertools unzip     |           0.022 |        0.027 |       0.178 |   0.0023 |
| requests Session.request |           0.023 |        0.024 |       0.077 |   0.0005 |
| repeated mixed 256 KiB   |           7.257 |        7.642 |      31.355 |   0.5007 |
| role-heavy 64 KiB        |           3.887 |        3.743 |      40.489 |   0.4552 |

Tokenization is roughly comparable. Stage medians do not necessarily add to the
separately measured parse median because JIT/GC and system noise vary. A reused
legacy parser is still slower on repeated large docs, so the result is not
only constructor reuse. The recorded run includes the restored extensions.
