import "@testing-library/jest-dom";

import { renderSPA, setupSPAServer } from "@/lib/test/spa";

setupSPAServer();

describe("Module page", () => {
  it("loads and shows correct information", async () => {
    const { getByRole } = await renderSPA("/project-alpha/alpha.core");

    // Project heading
    const heading = getByRole("heading", { name: "Project project-alpha" });
    expect(heading.children[0]).toHaveAttribute("href", "/project-alpha");

    // Module links, hopefully in the sidebar
    for (const mod of ["alpha", "alpha.core", "alpha.foo"]) {
      expect(getByRole("link", { name: mod })).toHaveAttribute(
        "href",
        `/project-alpha/${mod}`
      );
    }

    // Module heading and documentation
    const moduleHeading = getByRole("heading", { name: "Module alpha.core" });
    expect(moduleHeading.nextSibling).toHaveTextContent(
      "This is a project for testing purposes it isn't intended for use by anyone. 🤪"
    );

    // Symbol links
    for (const sym of ["Helper", "core_main"]) {
      expect(getByRole("link", { name: sym })).toHaveAttribute(
        "href",
        `/project-alpha/alpha.core/${sym}`
      );
    }
  });
});
