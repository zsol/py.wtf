import "@testing-library/jest-dom";

import { renderSPA, setupSPAServer } from "@/lib/test/spa";

setupSPAServer();

describe("Class page", () => {
  it("loads and shows correct information", async () => {
    const { getByRole, getByText } = await renderSPA(
      "/project-alpha/alpha.core/Helper",
    );

    // Project heading
    const heading = getByRole("heading", { name: "Project project-alpha" });
    expect(heading.children[0]).toHaveAttribute("href", "/project-alpha");

    // Variable / method links aren't happy yet, see https://github.com/zsol/py.wtf/issues/3
    expect(getByRole("link", { name: "some_variable" })).toHaveAttribute(
      "href",
      "/project-alpha/alpha.core/Helper#alpha.core.Helper.some_variable",
    );

    // Inner class link
    expect(getByRole("link", { name: "Utils" })).toHaveAttribute(
      "href",
      "/project-alpha/alpha.core/Helper.Utils",
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
        element?.textContent === "class alpha.core.Helper()",
    );

    // Instance variable
    getByText(
      (_, element) =>
        element?.nodeName === "CODE" &&
        element?.textContent === "alpha.core.Helper.some_variable: int",
    );

    // Inner class declaration
    getByText(
      (_, element) =>
        element?.nodeName === "CODE" &&
        element?.textContent === "class alpha.core.Helper.Utils()",
    );

    // Inner class method
    getByText(
      (_, element) =>
        element?.nodeName === "CODE" &&
        element?.textContent ===
          "def static_method(\
\
foo: int,\
) -> None",
    );

    // Double inner class I guess
    getByText(
      (_, element) =>
        element?.nodeName === "CODE" &&
        element?.textContent === "class alpha.core.Helper.Utils.Common()",
    );
  });
});
