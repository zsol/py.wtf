import { RenderResult, render, waitFor } from "@testing-library/react";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { MemoryRouter } from "react-router-dom";
import "whatwg-fetch";

import { getProject } from "@/lib/docs_server";

import SPAIndex from "@/pages/_spa";

export function setupSPAServer() {
  const server = setupServer(
    rest.get("/_index/:file", async (req, res, ctx) => {
      return res(
        ctx.json(
          await getProject((req.params.file as string).replace(/\.json$/, ""))
        )
      );
    })
  );
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}

export async function renderSPA(path: string): Promise<RenderResult> {
  const result = render(
    <SPAIndex
      router={({ children }) => (
        <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
      )}
    />
  );
  await waitFor(() => {
    expect(result.container).not.toHaveTextContent("Loading...");
  });
  return result;
}
