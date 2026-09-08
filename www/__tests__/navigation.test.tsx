import { ThemeProvider } from "@emotion/react";
import "@testing-library/jest-dom";
import { fireEvent, render } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";

import { Link } from "@/components/core/navigation/Link";
import { darkTheme } from "@/components/core/theme/theme";

const target = {
  pathname: "/project/module",
  search: "q=helper",
  hash: "method",
};

test("standalone links serialize object targets with a query and fragment", () => {
  const { getByRole } = render(
    <ThemeProvider theme={darkTheme}>
      <Link to={target}>Method</Link>
      <Link to="https://example.com/docs#method">External docs</Link>
    </ThemeProvider>,
  );
  expect(getByRole("link", { name: "Method" })).toHaveAttribute(
    "href",
    "/project/module?q=helper#method",
  );
  expect(getByRole("link", { name: "External docs" })).toHaveAttribute(
    "href",
    "https://example.com/docs#method",
  );
});

function RouterControls() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <Link to={target}>Method</Link>
      <button
        onClick={() => {
          void navigate(-1);
        }}
      >
        Back
      </button>
      <button
        onClick={() => {
          void navigate(1);
        }}
      >
        Forward
      </button>
      <output aria-label="Current URL">
        {location.pathname + location.search + location.hash}
      </output>
    </>
  );
}

test("router links preserve query and fragment through back and forward navigation", () => {
  const { getByRole } = render(
    <ThemeProvider theme={darkTheme}>
      <MemoryRouter initialEntries={["/project"]}>
        <RouterControls />
      </MemoryRouter>
    </ThemeProvider>,
  );
  fireEvent.click(getByRole("link", { name: "Method" }));
  expect(getByRole("status")).toHaveTextContent(
    "/project/module?q=helper#method",
  );
  fireEvent.click(getByRole("button", { name: "Back" }));
  expect(getByRole("status").textContent).toBe("/project");
  fireEvent.click(getByRole("button", { name: "Forward" }));
  expect(getByRole("status")).toHaveTextContent(
    "/project/module?q=helper#method",
  );
});
