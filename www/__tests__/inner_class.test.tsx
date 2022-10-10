import "@testing-library/jest-dom";

import { renderSPA, setupSPAServer } from "@/lib/test/spa";

setupSPAServer();

describe("Inner class page", () => {
  it("loads and shows correct information", async () => {
    const { getByRole, getByText } = await renderSPA(
      "/project-alpha/alpha.core/Helper.Utils",
    );

    // Project heading
    const heading = getByRole("heading", { name: "Project project-alpha" });
    expect(heading.children[0]).toHaveAttribute("href", "/project-alpha");

    // Variable / method links aren't happy yet, see https://github.com/zsol/py.wtf/issues/3
    expect(getByRole("link", { name: "static_method" })).toHaveAttribute(
      "href",
      "/project-alpha/alpha.core/Helper.Utils#alpha.core.Helper.Utils.static_method",
    );

    // Inner class link
    expect(getByRole("link", { name: "Common" })).toHaveAttribute(
      "href",
      "/project-alpha/alpha.core/Helper.Utils.Common",
    );

    // Other module member links, hopefully in the sidebar
    for (const sym of ["Helper", "core_main"]) {
      expect(getByRole("link", { name: sym })).toHaveAttribute(
        "href",
        `/project-alpha/alpha.core/${sym}`,
      );
    }

    // Class declaration
    getByText(
      (_, element) =>
        element?.nodeName === "CODE" &&
        element?.textContent === "class alpha.core.Helper.Utils()",
    );

    // Method
    getByText(
      (_, element) =>
        element?.nodeName === "CODE" &&
        element?.textContent ===
          "def static_method(\
\
foo: int,\
) -> None",
    );

    // Inner class declaration
    getByText(
      (_, element) =>
        element?.nodeName === "CODE" &&
        element?.textContent === "class alpha.core.Helper.Utils.Common()",
    );
  });
});
