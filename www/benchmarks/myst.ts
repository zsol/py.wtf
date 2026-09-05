import { deepStrictEqual } from "node:assert";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire, registerHooks } from "node:module";
import { cpus } from "node:os";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

// Node 24 can execute this erasable TypeScript without a benchmark dependency.
// Node's loader keeps the app's TypeScript module-resolution settings unchanged.
const require = createRequire(import.meta.url);
// Node's public loader hook resolves the app's extensionless local TypeScript
// imports. It changes neither production imports nor dependency resolution.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      context.parentURL?.startsWith(new URL("../lib/", import.meta.url).href) &&
      specifier.startsWith("./")
    )
      return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier, context);
  },
});
const modern = require("../lib/myst.ts") as typeof import("../lib/myst");
const legacyDirectory = process.argv[2];
if (!legacyDirectory)
  throw new Error(
    "Pass the directory containing an isolated mystjs@0.0.13 installation.",
  );
const legacyRequire = createRequire(resolve(legacyDirectory, "package.json"));
interface LegacyParser {
  parse(source: string): { children: unknown[] };
  tokenizer: { parse(source: string, env: object): unknown[] };
}
const { MyST, tokensToMyst } = legacyRequire("mystjs") as {
  MyST: new () => LegacyParser;
  tokensToMyst: (tokens: unknown[]) => { children: unknown[] };
};
const legacy = new MyST();
const version = (req: NodeJS.Require, name: string) =>
  (req(name) as { version: string }).version;

function docstrings(value: unknown): string[] {
  if (value === null || typeof value !== "object") return [];
  const result: string[] = [];
  for (const [key, child] of Object.entries(value)) {
    if (key === "documentation" && Array.isArray(child)) {
      for (const doc of child) if (typeof doc === "string") result.push(doc);
    } else result.push(...docstrings(child));
  }
  return result;
}

const index = fileURLToPath(new URL("../__tests__/index/", import.meta.url));
const fixtures = readdirSync(index)
  .filter((name) => name.endsWith(".json"))
  .flatMap((name) =>
    docstrings(
      JSON.parse(readFileSync(resolve(index, name), "utf8")) as unknown,
    ),
  );
const unzip = fixtures.find((doc) => doc.startsWith("The inverse of"));
if (!unzip) throw new Error("Missing Python-emitted unzip fixture.");
const requests = readFileSync(
  new URL("fixtures/requests-session-request.md", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n");
const mixed = [
  unzip,
  requests,
  "# Examples\n\n- *Nested* **formatting** and {py:class}`alpha.core.Helper`\n  > See [Python](https://python.org).\n\n```python\nprint('example')\n```",
].join("\n\n");
const repeatTo = (source: string, bytes: number) =>
  (source + "\n\n").repeat(
    Math.ceil(bytes / Buffer.byteLength(source + "\n\n")),
  );
const workloads = [
  { name: "fixture corpus", docs: fixtures },
  { name: "more-itertools unzip", docs: [unzip] },
  { name: "requests Session.request", docs: [requests] },
  { name: "repeated mixed 256 KiB", docs: [repeatTo(mixed, 256 * 1024)] },
  {
    name: "role-heavy 64 KiB",
    docs: [
      repeatTo(
        "See {func}`alpha.foo.bar` and *{py:class}`alpha.core.Helper`* with `code`.",
        64 * 1024,
      ),
    ],
  },
];

// Check observable payloads before timing so dropping code or role content
// cannot masquerade as a performance win on the benchmark corpus. Formatting,
// safety and intentionally unsupported extensions have separate renderer tests.
function contentFacts(tree: unknown) {
  const facts = {
    text: "",
    roles: [] as string[],
    code: [] as string[],
    links: [] as string[],
  };
  function visit(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object") return;
    const node = value as Record<string, unknown>;
    if (typeof node.value === "string") {
      facts.text += node.value;
      if (node.type === "mystRole") {
        facts.roles.push(JSON.stringify([node.name, node.value]));
        return;
      }
      if (
        node.type === "code" ||
        node.type === "inlineCode" ||
        node.type === "codeBlock"
      )
        facts.code.push(node.value);
    }
    if (node.type === "link" && typeof node.url === "string")
      facts.links.push(node.url);
    visit(node.children);
  }
  visit(tree);
  return facts;
}

for (const { name, docs } of workloads) {
  for (const doc of docs) {
    deepStrictEqual(
      contentFacts(modern.parseDocumentation(doc)),
      contentFacts(legacy.parse(doc)),
      name,
    );
  }
}

// Every result is consumed. Median and full samples make noisy runs visible.
let sink = 0;
const sampleMs = Number(process.env.MYST_BENCH_MS ?? 100);
const rounds = 7;
if (!(sampleMs >= 10 && sampleMs <= 10000))
  throw new Error("MYST_BENCH_MS must be 10..10000.");
function measure(run: () => number) {
  for (let warm = 0; warm < 10; warm++) sink += run();
  const calibrationStart = performance.now();
  for (let count = 0; count < 3; count++) sink += run();
  const iterations = Math.max(
    1,
    Math.min(
      10000,
      Math.ceil(sampleMs / ((performance.now() - calibrationStart) / 3)),
    ),
  );
  const samples = [];
  for (let round = 0; round < rounds; round++) {
    const start = performance.now();
    for (let count = 0; count < iterations; count++) sink += run();
    samples.push((performance.now() - start) / iterations);
  }
  return {
    median_ms: [...samples].sort((a, b) => a - b)[Math.floor(rounds / 2)],
    iterations,
    samples_ms: samples,
  };
}

const results = workloads.map(({ name, docs }) => {
  const oldTokens = docs.map((doc) => legacy.tokenizer.parse(doc, {}));
  const newTokens = docs.map((doc) => modern.tokenizeDocumentation(doc));
  return {
    name,
    documents: docs.length,
    bytes: docs.reduce((sum, doc) => sum + Buffer.byteLength(doc), 0),
    // Stages are measured independently, not subtracted noisy timings. Parse
    // measurements always tokenize fresh input and never use a rendered cache.
    legacy_construct_and_parse: measure(() =>
      docs.reduce((sum, doc) => sum + new MyST().parse(doc).children.length, 0),
    ),
    legacy_reused_parse: measure(() =>
      docs.reduce((sum, doc) => sum + legacy.parse(doc).children.length, 0),
    ),
    new_parse: measure(() =>
      docs.reduce((sum, doc) => sum + modern.parseDocumentation(doc).length, 0),
    ),
    legacy_tokenize: measure(() =>
      docs.reduce(
        (sum, doc) => sum + legacy.tokenizer.parse(doc, {}).length,
        0,
      ),
    ),
    new_tokenize: measure(() =>
      docs.reduce(
        (sum, doc) => sum + modern.tokenizeDocumentation(doc).length,
        0,
      ),
    ),
    legacy_tree: measure(() =>
      oldTokens.reduce(
        (sum, tokens) => sum + tokensToMyst(tokens).children.length,
        0,
      ),
    ),
    new_tree: measure(() =>
      newTokens.reduce(
        (sum, tokens) => sum + modern.documentationTree(tokens).length,
        0,
      ),
    ),
  };
});
const report = {
  fidelity:
    "Text, role payloads, code values and link targets match the legacy parser on every workload.",
  node: process.version,
  platform: process.platform,
  arch: process.arch,
  cpu: cpus()[0]?.model,
  legacy: (
    JSON.parse(
      readFileSync(
        resolve(legacyDirectory, "node_modules/mystjs/package.json"),
        "utf8",
      ),
    ) as { version: string }
  ).version,
  modern: version(require, "markdown-it/package.json"),
  sample_ms: sampleMs,
  rounds,
  sink,
  results,
};
const json = JSON.stringify(report, null, 2) + "\n";
if (process.argv[3]) writeFileSync(process.argv[3], json);
else process.stdout.write(json);
