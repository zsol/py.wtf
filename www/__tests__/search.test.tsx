import { ThemeProvider } from "@emotion/react";
import "@testing-library/jest-dom";
import { fireEvent, render, within } from "@testing-library/react";
import { StrictMode } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";

import { Search } from "@/components/core/Search";
import { darkTheme } from "@/components/core/theme/theme";

import { getProject } from "@/lib/docs";
import {
  SearchDescriptor,
  generateProjectIndex,
  search,
} from "@/lib/searchDescriptor";

function descriptor(name: string): SearchDescriptor {
  return { name, fqname: name, type: "project", url: `/${name}` };
}

function searchView(descriptors: SearchDescriptor[]) {
  return (
    <StrictMode>
      <ThemeProvider theme={darkTheme}>
        <Search descriptors={descriptors} placeholder="Search packages" />
      </ThemeProvider>
    </StrictMode>
  );
}

test("search retains more than ten matches with the new fuzzysort defaults", () => {
  const results = search(
    Array.from({ length: 30 }, (_, i) => descriptor(`package${i}`)),
    "package",
  );
  expect(results).toHaveLength(30);
  expect(results.total).toBe(30);
});

test("search keeps non-contiguous matches below the default score threshold", () => {
  const target = descriptor("network");
  const results = search([target], "nt");
  expect(results).toHaveLength(1);
  expect(results[0].obj).toBe(target);
});

test("project indexes preserve symbol URLs and stay separate between projects", async () => {
  const alpha = await getProject("project-alpha");
  const beta = await getProject("project-beta");
  const alphaIndex = generateProjectIndex(alpha);
  const betaIndex = generateProjectIndex(beta);
  expect(search(alphaIndex, "Helper")[0].obj).toEqual({
    name: "Helper",
    fqname: "alpha.core.Helper",
    type: "class",
    url: "/project-alpha/alpha.core/Helper",
  });
  expect(search(betaIndex, "Helper")).toHaveLength(0);
  expect(betaIndex.every((item) => item.url.startsWith("/project-beta/"))).toBe(
    true,
  );
});

test("search highlights matching characters and shows the symbol's parent", () => {
  const target = {
    ...descriptor("helper"),
    fqname: "package.module.helper",
    type: "function" as const,
  };
  const { getByRole } = render(searchView([target]));
  fireEvent.change(getByRole("textbox"), { target: { value: "hlp" } });

  const link = getByRole("link");
  expect(link).toHaveTextContent("helper (in package.module)");
  expect(
    Array.from(link.querySelectorAll("b"), (node) => node.textContent),
  ).toEqual(["h", "lp"]);
  expect(within(link).getByText("package.module").tagName).toBe("EM");
});

test("search refreshes matches when its index changes", () => {
  const { getByRole, queryByRole, rerender } = render(
    searchView([descriptor("package_old")]),
  );
  fireEvent.change(getByRole("textbox"), { target: { value: "package" } });
  expect(getByRole("link")).toHaveAttribute("href", "/package_old");

  rerender(searchView([descriptor("package_new")]));
  expect(queryByRole("link", { name: /_old/ })).not.toBeInTheDocument();
  expect(getByRole("link")).toHaveAttribute("href", "/package_new");
  expect(getByRole("textbox")).toHaveValue("package");
});

test("search distinguishes no matches from an empty query", () => {
  const { getByRole, getByText, queryByText, queryByRole } = render(
    searchView([descriptor("package")]),
  );
  fireEvent.change(getByRole("textbox"), { target: { value: "zzz" } });
  expect(getByText("No results found")).toBeInTheDocument();

  fireEvent.change(getByRole("textbox"), { target: { value: "" } });
  expect(queryByText("No results found")).not.toBeInTheDocument();
  expect(queryByRole("link")).not.toBeInTheDocument();
});

test("the slash shortcut and arrow keys focus only displayed results", () => {
  const { getByRole, getAllByRole } = render(
    searchView(Array.from({ length: 60 }, (_, i) => descriptor(`package${i}`))),
  );
  const input = getByRole("textbox");
  fireEvent.keyDown(document, { key: "/", code: "Slash" });
  fireEvent.keyUp(document, { key: "/", code: "Slash" });
  expect(input).toHaveFocus();
  fireEvent.change(input, { target: { value: "package" } });

  const links = getAllByRole("link");
  expect(links).toHaveLength(50);
  fireEvent.keyDown(input, { key: "ArrowDown" });
  expect(links[0]).toHaveFocus();
  fireEvent.keyDown(links[0], { key: "ArrowDown" });
  expect(links[1]).toHaveFocus();
  fireEvent.keyDown(links[1], { key: "ArrowUp" });
  fireEvent.keyDown(links[0], { key: "ArrowUp" });
  expect(input).toHaveFocus();

  links[49].focus();
  expect(fireEvent.keyDown(links[49], { key: "ArrowDown" })).toBe(true);
  expect(links[49]).toHaveFocus();
});

function CurrentPath() {
  const location = useLocation();
  return <output aria-label="Current path">{location.pathname}</output>;
}

test("choosing a result navigates through React Router and clears the query", () => {
  const { getByRole, queryByRole } = render(
    <MemoryRouter>
      {searchView([descriptor("package")])}
      <CurrentPath />
    </MemoryRouter>,
  );
  fireEvent.change(getByRole("textbox"), { target: { value: "package" } });
  fireEvent.click(getByRole("link"));

  expect(getByRole("status", { name: "Current path" })).toHaveTextContent(
    "/package",
  );
  expect(getByRole("textbox")).toHaveValue("");
  expect(queryByRole("link")).not.toBeInTheDocument();
});
