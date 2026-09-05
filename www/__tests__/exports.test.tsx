import "@testing-library/jest-dom";
import { waitFor } from "@testing-library/react";

import { renderSPA, setupSPAServer } from "@/lib/test/spa";

setupSPAServer();

describe("Export page", () => {
  it("redirects to symbol if resolved", async () => {
    const { getByText } = await renderSPA("/project-alpha/alpha/Helper");

    await waitFor(() =>
      getByText(
        (_, element) =>
          element?.nodeName === "CODE" &&
          element?.textContent === "class alpha.core.Helper()",
      ),
    );
  });
});
