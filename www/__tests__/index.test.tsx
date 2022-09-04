import "@testing-library/jest-dom";
import { render } from "@testing-library/react";

import Index, { Props, getStaticProps } from "@/pages/index";

describe("Index", () => {
  it("contains link to project-alpha", async () => {
    const propsResult = await getStaticProps({});
    expect(propsResult).toHaveProperty("props");
    const props = (propsResult as { props: Props }).props;

    const { getAllByRole } = render(<Index {...props} />);
    const links = getAllByRole("link", { name: "project-alpha" });
    links.forEach((link) => {
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/project-alpha");
      expect(link.parentElement).toHaveTextContent("project-alpha");
    });
  });
});
