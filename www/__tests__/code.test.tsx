import { ThemeProvider } from "@emotion/react";
import "@testing-library/jest-dom";
import { act, fireEvent, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { Link } from "@/components/core/navigation/Link";
import { darkTheme } from "@/components/core/theme/theme";
import { Code } from "@/components/core/typography/Code";

const scrollIntoView = jest.fn();
const originalScrollIntoView = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollIntoView",
);

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    writable: true,
    value: scrollIntoView,
  });
  scrollIntoView.mockClear();
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  if (originalScrollIntoView) {
    Object.defineProperty(
      HTMLElement.prototype,
      "scrollIntoView",
      originalScrollIntoView,
    );
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
  }
  window.history.replaceState(null, "", "/");
});

test("code blocks follow router fragment changes without a native hashchange event", () => {
  const { getByRole, getByText } = render(
    <ThemeProvider theme={darkTheme}>
      <MemoryRouter initialEntries={["/module#first"]}>
        <Link to="#second">Second declaration</Link>
        <Code anchor="first">first declaration</Code>
        <Code anchor="second">second declaration</Code>
      </MemoryRouter>
    </ThemeProvider>,
  );
  const first = getByText("first declaration").closest("pre");
  const second = getByText("second declaration").closest("pre");
  expect(first).toHaveStyle({
    backgroundColor: darkTheme.colors.code.backgroundHighlighted,
  });
  expect(scrollIntoView.mock.instances.at(-1)).toBe(first);

  fireEvent.click(getByRole("link", { name: "Second declaration" }));
  expect(first).toHaveStyle({
    backgroundColor: darkTheme.colors.code.background,
  });
  expect(second).toHaveStyle({
    backgroundColor: darkTheme.colors.code.backgroundHighlighted,
  });
  expect(scrollIntoView.mock.instances.at(-1)).toBe(second);
  expect(scrollIntoView).toHaveBeenLastCalledWith({ behavior: "smooth" });
  expect(window.location.hash).toBe("");
});

test("standalone code blocks follow native hash changes and clear removed anchors", () => {
  const view = (anchor?: string) => (
    <ThemeProvider theme={darkTheme}>
      <Code anchor={anchor}>declaration</Code>
    </ThemeProvider>
  );
  const { getByText, rerender } = render(view("method"));
  const block = getByText("declaration").closest("pre");
  expect(block).toHaveStyle({
    backgroundColor: darkTheme.colors.code.background,
  });

  act(() => {
    window.history.replaceState(null, "", "#method");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
  expect(block).toHaveStyle({
    backgroundColor: darkTheme.colors.code.backgroundHighlighted,
  });
  expect(scrollIntoView.mock.instances.at(-1)).toBe(block);

  rerender(view());
  expect(block).toHaveStyle({
    backgroundColor: darkTheme.colors.code.background,
  });
});
