import styled from "@emotion/styled";
import { ReactNode } from "react";

const StyledText = styled.p`
  color: ${(props) => props.theme.colors.mainText};
`;

const StyledMarginlessText = styled(StyledText)`
  margin-block-start: 0;
  margin-block-end: 0;
`;

type TextProps = {
  marginLess?: boolean;
  children: ReactNode;
};

export const Text = ({ marginLess, children }: TextProps) => {
  return marginLess ? (
    <StyledMarginlessText>{children}</StyledMarginlessText>
  ) : (
    <StyledText>{children}</StyledText>
  );
};
