import React from "react";

interface Props {
  separator: React.ReactNode | string;
  children: React.ReactNode[];
}

export default function Intersperse({ separator, children }: Props) {
  const childrenCount = children.length;
  const childrenWithSeparators: React.ReactNode[] = [];
  for (let i = 0; i < childrenCount; i++) {
    if (i > 0) {
      childrenWithSeparators.push(separator);
    }
    childrenWithSeparators.push(children[i]);
  }
  return <>{childrenWithSeparators}</>;
}
