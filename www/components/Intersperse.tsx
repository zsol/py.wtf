import React from "react";

interface Props {
  separator: ((key: string) => React.ReactNode) | string;
  children: React.ReactNode[];
}

export default function Intersperse({ separator, children }: Props) {
  const childrenCount = children.length;
  const childrenWithSeparators: React.ReactNode[] = [];
  for (let i = 0; i < childrenCount; i++) {
    if (i > 0) {
      if (typeof separator === "function") {
        childrenWithSeparators.push(separator(i.toString()));
      } else {
        childrenWithSeparators.push(separator);
      }
    }
    childrenWithSeparators.push(children[i]);
  }
  return <>{childrenWithSeparators}</>;
}
