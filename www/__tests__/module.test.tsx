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
      "core module docs Copyright header thing here"
    );

    // Symbol links
    for (const sym of ["Helper", "core_main"]) {
      expect(getByRole("link", { name: sym })).toHaveAttribute(
        "href",
        `/project-alpha/alpha.core/${sym}`
      );
    }
  });

  it("Displays exports with links", async () => {
    const { getByRole } = await renderSPA("/project-alpha/alpha");

    // Export links
    for (const { name, href } of [
      { name: "alpha.Helper", href: "/project-alpha/alpha.core/Helper" },
      // NOTE: no exports from import stars
      { name: "alpha.bar", href: "/project-alpha/foo/bar" },
    ]) {
      expect(getByRole("link", { name })).toHaveAttribute("href", href);
    }
  });

  it("Displays exports with links to other projects", async () => {
    const { getByRole } = await renderSPA("/project-beta/beta");

    // Export links
    for (const { name, href } of [
      { name: "beta.bar", href: "/project-alpha/alpha/bar" },
    ]) {
      expect(getByRole("link", { name })).toHaveAttribute("href", href);
    }
  });
});
