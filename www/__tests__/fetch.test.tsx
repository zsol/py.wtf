import { renderHook, waitFor } from "@testing-library/react";
import useFetchModule from "hooks/fetchModule";
import useFetchProject from "hooks/fetchProject";
import useFetchSymbol from "hooks/fetchSymbol";
import { ReactNode, StrictMode } from "react";
import { SWRConfig } from "swr";

import { getProject } from "@/lib/docs";

function wrapper({ children }: { children: ReactNode }) {
  return (
    <StrictMode>
      <SWRConfig
        value={{ provider: () => new Map(), shouldRetryOnError: false }}
      >
        {children}
      </SWRConfig>
    </StrictMode>
  );
}

beforeEach(async () => {
  const alpha = await getProject("project-alpha");
  const beta = await getProject("project-beta");
  jest.spyOn(globalThis, "fetch").mockImplementation((input) => {
    const project = input === "/_index/project-alpha.json" ? alpha : beta;
    return Promise.resolve(new Response(JSON.stringify(project)));
  });
});

afterEach(() => jest.restoreAllMocks());

test("project fetching pauses without route parameters and updates when the project changes", async () => {
  const initialProps: { name: string | undefined } = { name: undefined };
  const { result, rerender } = renderHook(
    ({ name }: { name: string | undefined }) => useFetchProject(name),
    { wrapper, initialProps },
  );
  expect(fetch).not.toHaveBeenCalled();
  expect(result.current.isLoading).toBe(false);

  rerender({ name: "project-alpha" });
  await waitFor(() =>
    expect(result.current.project?.name).toBe("project-alpha"),
  );
  expect(result.current.projectJsonUrl).toBe("/_index/project-alpha.json");
  expect(result.current.isLoading).toBe(false);

  rerender({ name: "project-beta" });
  await waitFor(() =>
    expect(result.current.project?.name).toBe("project-beta"),
  );
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch).toHaveBeenNthCalledWith(
    1,
    "/_index/project-alpha.json",
    undefined,
  );
  expect(fetch).toHaveBeenNthCalledWith(
    2,
    "/_index/project-beta.json",
    undefined,
  );

  rerender({ name: undefined });
  expect(result.current.project).toBeUndefined();
  expect(result.current.isLoading).toBe(false);
  expect(fetch).toHaveBeenCalledTimes(2);
});

test("module fetching handles missing parameters and cached module navigation", async () => {
  const { result, rerender } = renderHook(
    ({ project, module }: { project?: string; module?: string }) =>
      useFetchModule(project, module),
    { wrapper, initialProps: {} },
  );
  expect(fetch).not.toHaveBeenCalled();
  expect(result.current.module).toBeUndefined();

  rerender({ project: "project-alpha", module: "alpha.core" });
  await waitFor(() => expect(result.current.module?.name).toBe("alpha.core"));
  rerender({ project: "project-alpha", module: "alpha.foo" });
  expect(result.current.module?.name).toBe("alpha.foo");
  expect(fetch).toHaveBeenCalledTimes(1);
});

test("symbol navigation resolves nested classes and exports from the cached project", async () => {
  const { result, rerender } = renderHook(
    ({
      project,
      module,
      symbol,
    }: {
      project?: string;
      module?: string;
      symbol?: string;
    }) => useFetchSymbol(project, module, symbol),
    { wrapper, initialProps: {} },
  );
  expect(fetch).not.toHaveBeenCalled();

  rerender({
    project: "project-alpha",
    module: "alpha.core",
    symbol: "Helper.Utils.Common",
  });
  await waitFor(() =>
    expect(result.current.symbol?.name).toBe("alpha.core.Helper.Utils.Common"),
  );
  expect(result.current.symbolType).toBe("class");

  rerender({ project: "project-alpha", module: "alpha", symbol: "Helper" });
  expect(result.current.symbol?.name).toBe("alpha.Helper");
  expect(result.current.symbolType).toBe("export");

  rerender({ project: "project-alpha", module: "alpha", symbol: undefined });
  expect(result.current.symbol).toBeUndefined();
  expect(result.current.symbolType).toBeUndefined();
  expect(fetch).toHaveBeenCalledTimes(1);
});
