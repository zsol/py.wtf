import "@testing-library/jest-dom";
import { within } from "@testing-library/react";

import { renderSPA, setupSPAServer } from "@/lib/test/spa";

setupSPAServer();

describe("Module page", () => {
  it("Displays cross-references in RST docs", async () => {
    const { getAllByRole, getByText } = await renderSPA(
      "/project-alpha/alpha.foo/unzip",
    );

    getAllByRole("link", { name: "bar" }).forEach((el) =>
      expect(el).toHaveAttribute("href", "/project-alpha/alpha.foo/bar"),
    );

    const paragraph = getByText(/The inverse of/);
    // The index leaves this role unqualified; the resolver cannot infer its
    // module. Check its readable fallback separately from the sidebar link.
    expect(within(paragraph).queryByRole("link", { name: "bar" })).toBeNull();
    expect(within(paragraph).getByText("bar").tagName).toBe("CODE");
  });
});
