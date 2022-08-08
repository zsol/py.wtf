import { Text } from "@welcome-ui/text";

export default function Documentation({ children }) {
  if (children.length === 0) {
    return <></>;
  }
  return <Text variant="body2">{children}</Text>;
}
