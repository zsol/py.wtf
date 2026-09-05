import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const fallback = read("../out/404.html");
assert.equal(
  fallback,
  read("../public/404.html"),
  "The export must retain the SPA fallback instead of Next's generated 404",
);

const spa = read("../out/_spa.html");
const firstScript = spa.match(/<script\b([^>]*)>([\s\S]*?)<\/script>/i);
assert(
  firstScript,
  "The exported SPA shell must contain its restoration script",
);
assert(firstScript.index < spa.indexOf("</head>"));
assert(!/\b(src|async|defer)\b/.test(firstScript[1]));

const redirectScript = fallback.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
assert(redirectScript, "The exported 404 must redirect to the SPA shell");

for (const route of [
  "/project-alpha",
  "/project-alpha/alpha.core/Helper?a=1&b=2#definition",
  "/project-alpha/alpha.foo/unzip?x=1&x=2&encoded=a%26b&plus=a+b#escaped%23hash",
  "/project%252Fname/module%20name?empty=&literal=~and~#hash",
]) {
  const original = new URL(route, "http://localhost:4173");
  let redirected;
  runInNewContext(redirectScript[1], {
    window: {
      location: {
        pathname: original.pathname,
        search: original.search,
        hash: original.hash,
        replace: (url) => (redirected = new URL(url, original)),
      },
    },
  });
  assert(redirected, "The exported 404 must perform a redirect");
  assert.equal(redirected.origin, original.origin);
  assert.equal(redirected.pathname, "/_spa.html");
  let restored;
  runInNewContext(firstScript[2], {
    URL,
    window: {
      location: redirected,
      history: { replaceState: (_state, _title, url) => (restored = url) },
    },
  });
  assert.equal(
    restored,
    route,
    "Restore path, query and hash before hydration",
  );
}

console.log("Exported 404 and SPA scripts preserve all deep-link round trips.");
