import styled from "styled-components";
import React from "react";

import { Text } from "@welcome-ui/text";

export const Container = (props) => (
  <Text as="code" backgroundColor="light.800" padding="md" {...props} />
);

export const Keyword = styled.span`
  font-weight: bold;
  color: rgb(249, 38, 114);
`;

export const Fn = styled.span`
  color: rgb(166, 226, 46);
`;

export const Ty = Fn;

export function VarWithType({ name, type, comma = false }) {
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
