import styled from "@emotion/styled";
import React from "react";

export const Keyword = styled.span`
  font-weight: bold;
  color: rgb(249, 38, 114);
`;

export const Fn = styled.span`
  color: rgb(166, 226, 46);
`;

export const Ty = Fn;

export interface VarWithTypeProps {
  name: string;
  type: string | null;
  comma?: boolean;
}

export function VarWithType({ name, type, comma = false }: VarWithTypeProps) {
  return (
    <>
      {name}
      {type != null && (
        <>
          : <Ty>{type}</Ty>
        </>
      )}
      {comma && ","}
    </>
  );
}
