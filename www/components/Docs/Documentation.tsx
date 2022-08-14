import { MarginlessText, Text } from "../core/typography/Text";

interface Props {
  children: string[];
}

export default function Documentation({ children }: Props) {
  if (children.length > 0) {
    return <Text>{children}</Text>;
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
