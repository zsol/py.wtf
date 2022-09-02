import "@testing-library/jest-dom";

import { renderSPA, setupSPAServer } from "@/lib/test/spa";

setupSPAServer();

describe("Function page", () => {
  it("loads and shows correct information", async () => {
    const { getByRole } = await renderSPA("/project-alpha/alpha.foo/bar");

    // Project heading
    const heading = getByRole("heading", { name: "Project project-alpha" });
    expect(heading.children[0]).toHaveAttribute("href", "/project-alpha");

    // Function links, hopefully in the sidebar
    for (const sym of ["bar", "unzip"]) {
      expect(getByRole("link", { name: sym })).toHaveAttribute(
        "href",
        `/project-alpha/alpha.foo/${sym}`,
      );
    }
  });

  it("shows xrefs to stdlib", async () => {
    const { getByRole } = await renderSPA("/project-alpha/alpha.foo/bar");
    expect(getByRole("link", { name: "Generator" })).toHaveAttribute(
      "href",
      "//docs.python.org/3/library/typing.html#typing.Generator",
    );
  });
});
