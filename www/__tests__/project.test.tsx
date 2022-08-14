import "@testing-library/jest-dom";
import { within } from "@testing-library/react";

import { renderSPA, setupSPAServer } from "@/lib/test/spa";

setupSPAServer();

describe("Project page", () => {
  it("loads and shows correct information", async () => {
    const { getByRole } = await renderSPA("/project-alpha");

    // Project heading
    const heading = getByRole("heading", { name: "Project project-alpha" });
    expect(heading.children[0]).toHaveAttribute("href", "/project-alpha");

    // Modules table
    const modulesHeading = getByRole("heading", { name: "Modules" });
    const modulesTable = modulesHeading.nextElementSibling as HTMLTableElement;
    expect(modulesTable).not.toBeNull();
    expect(modulesTable.nodeName).toBe("TABLE");
    for (const mod of ["alpha", "alpha.core", "alpha.foo"]) {
      expect(
        within(modulesTable).getByRole("link", { name: mod })
      ).toHaveAttribute("href", `/project-alpha/${mod}`);
    }
  });
});
