import { ThemeProvider } from "@emotion/react";
import { RenderResult, render, waitFor } from "@testing-library/react";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { MemoryRouter } from "react-router-dom";
import "whatwg-fetch";

import { darkTheme } from "@/components/core/theme/theme";

import { getProject } from "@/lib/docs";

import { SPARoutes } from "@/pages/_spa";

export function setupSPAServer() {
  const server = setupServer(
    rest.get("/_index/:file", async (req, res, ctx) => {
      return res(
        ctx.json(
          await getProject((req.params.file as string).replace(/\.json$/, "")),
        ),
      );
    }),
  );
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}

export async function renderSPA(path: string): Promise<RenderResult> {
  const result = render(
    <ThemeProvider theme={darkTheme}>
      <MemoryRouter initialEntries={[path]}>{SPARoutes}</MemoryRouter>
    </ThemeProvider>,
  );
  await waitFor(() => {
    expect(result.container).not.toHaveTextContent("Loading...");
  });
  return result;
}
