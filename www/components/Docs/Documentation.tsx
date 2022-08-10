import { Text } from "@welcome-ui/text";

interface Props {
  children: string[];
}

export default function Documentation({ children }: Props) {
  if (children.length === 0) {
    return <></>;
  }
  return <Text variant="body2">{children}</Text>;
}

function ShortDocumentation({ children }: Props) {
  if (children.length === 0) {
    return <></>;
  }
  return <span>{children[0].split("\n")[0]}</span>;
}
Documentation.Short = ShortDocumentation;
