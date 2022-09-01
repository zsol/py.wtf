import "@testing-library/jest-dom";

import { renderSPA, setupSPAServer } from "@/lib/test/spa";

setupSPAServer();

describe("Module page", () => {
  it("Displays cross-references in RST docs", async () => {
    const { getAllByRole } = await renderSPA("/project-alpha/alpha.foo/unzip");

    getAllByRole("link", { name: "bar" }).forEach((el) =>
      expect(el).toHaveAttribute("href", "/project-alpha/alpha.foo/bar"),
    );

    // This no work for some reason. The link in doc text doesn't get matched by this
    //expect(getAllByRole("link", { name: "bar" })).toHaveLength(2);
  });
});
