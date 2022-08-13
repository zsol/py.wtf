import React from "react";
import styled from "styled-components";

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
  const typeann =
    type === null ? (
      <></>
    ) : (
      <>
        : <Ty>{type}</Ty>
      </>
    );
  return (
    <>
      {name}
      {typeann}
      {comma && ","}
    </>
  );
}
