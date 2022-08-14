import "@testing-library/jest-dom";
import { render } from "@testing-library/react";

import Index, { Props, getStaticProps } from "@/pages/index";

describe("Index", () => {
  it("contains link to project-alpha", async () => {
    const propsResult = await getStaticProps({});
    expect(propsResult).toHaveProperty("props");
    const props = (propsResult as { props: Props }).props;

    const { getByRole } = render(<Index {...props} />);
    const link = getByRole("link", { name: "project-alpha" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/project-alpha");
    expect(link.parentElement).toHaveTextContent("project-alpha (0)");
  });
});
