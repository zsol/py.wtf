import styled from "@emotion/styled";

export const Text = styled.p`
  color: ${(props) => props.theme.colors.mainText};
`;

export const MarginlessText = styled(Text)`
  margin-block-start: 0;
  margin-block-end: 0;
`;
