import MyST, { MySTRole } from "@/components/MyST";

import { Project } from "@/lib/docs";
import { xref } from "@/lib/url";

import { RouterLink } from "../core/navigation/Link";
import { MarginlessText } from "../core/typography/Text";

interface Props {
  project?: Project;
  children: string[];
}

function renderRole(prj: Project | undefined, role: MySTRole) {
  // maybe look at the name?
  let val = role.value as string;
  const parts = val.split("/", 2);
  const [project, fqname] = parts.length === 2 ? parts : [undefined, parts[0]];
  const ref = xref(prj, { project, fqname });
  if (ref == null) {
    return <code>{fqname}</code>;
  }
  return <RouterLink to={ref}>{fqname.split(".").pop()}</RouterLink>;
}

export default function Documentation({ children, project }: Props) {
  if (children.length > 0) {
    return (
      <div>
        {children.map((child, index) => (
          <MyST
            key={index}
            source={child}
            roles={renderRole.bind(null, project)}
          />
        ))}
      </div>
    );
  }
  return null;
}

function ShortDocumentation({ children }: Props) {
  if (children.length > 0) {
    return <MarginlessText>{children[0].split("\n")[0]}</MarginlessText>;
  }
  return null;
}
Documentation.Short = ShortDocumentation;
