import { readFileSync } from "node:fs";
import path from "node:path";
import { runInNewContext } from "node:vm";

import { restoreSPARouteScript } from "@/lib/spaFallback";

const fallbackHTML = readFileSync(
  path.join(process.cwd(), "public", "404.html"),
  "utf8",
);
const fallbackScript = fallbackHTML.match(
  /<script[^>]*>([\s\S]*?)<\/script>/,
)![1];

describe("Static-host SPA fallback", () => {
  it.each([
    "https://py.wtf/project-alpha",
    "https://py.wtf/project-alpha/alpha.core/Helper?a=1&b=2#definition",
    "http://localhost:4173/project-alpha/alpha%26core/Helper?q=a%26b&next=c?d#definition",
    "https://py.wtf/project%252Fname/module%20name?x=1&x=2&empty=&plus=a+b&literal=~and~#escaped%23hash",
  ])("restores %s before hydration", (originalURL) => {
    const original = new URL(originalURL);
    const replace = jest.fn<void, [string]>();
    runInNewContext(fallbackScript, {
      window: {
        location: {
          protocol: original.protocol,
          hostname: original.hostname,
          port: original.port,
          pathname: original.pathname,
          search: original.search,
          hash: original.hash,
          replace,
        },
      },
    });

    expect(replace).toHaveBeenCalledTimes(1);
    const target = replace.mock.calls[0][0];
    expect(target.startsWith("/_spa.html?__py_wtf_spa=")).toBe(true);
    const redirected = new URL(target, original.origin);
    expect(redirected.origin).toBe(original.origin);
    expect(redirected.pathname).toBe("/_spa.html");

    const replaceState = jest.fn();
    runInNewContext(restoreSPARouteScript, {
      URL,
      window: { location: redirected, history: { replaceState } },
    });
    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      original.pathname + original.search + original.hash,
    );
  });

  it.each([
    "https://py.wtf/?/project-alpha",
    "https://py.wtf/project-alpha?/alpha.core",
    "https://py.wtf/_spa.html",
    "https://py.wtf/_spa.html?search=example",
    "https://py.wtf/_spa/?__py_wtf_spa=%2Fproject-alpha",
    "https://py.wtf/_spa.html?__py_wtf_spa=%2Fproject-alpha&other=value",
    "https://py.wtf/_spa.html?__py_wtf_spa=%2Fproject-alpha#ordinary-hash",
  ])("leaves ordinary URL %s unchanged", (url) => {
    const replaceState = jest.fn();
    runInNewContext(restoreSPARouteScript, {
      URL,
      window: { location: new URL(url), history: { replaceState } },
    });
    expect(replaceState).not.toHaveBeenCalled();
  });

  it.each([
    "https://elsewhere.example/path",
    "//elsewhere.example/path",
    "/\\elsewhere.example/path",
    "/\u0000/path",
    "javascript:alert(1)",
    "",
  ])("rejects destination %j", (destination) => {
    const replaceState = jest.fn();
    runInNewContext(restoreSPARouteScript, {
      URL,
      window: {
        location: new URL(
          "https://py.wtf/_spa.html?__py_wtf_spa=" +
            encodeURIComponent(destination),
        ),
        history: { replaceState },
      },
    });
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("ignores a malformed encoded envelope", () => {
    const replaceState = jest.fn();
    expect(() => {
      runInNewContext(restoreSPARouteScript, {
        URL,
        window: {
          location: new URL("https://py.wtf/_spa.html?__py_wtf_spa=%E0%A4"),
          history: { replaceState },
        },
      });
    }).not.toThrow();
    expect(replaceState).not.toHaveBeenCalled();
  });
});
