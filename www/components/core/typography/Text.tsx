import styled from "@emotion/styled";

const StyledText = styled.p`
  color: ${(props) => props.theme.colors.mainText};
`;

const StyledMarginlessText = styled(StyledText)`
  margin-block-start: 0;
  margin-block-end: 0;
`;

type TextProps = {
  marginLess?: boolean;
  children: string;
};

export const Text = ({ marginLess, children }: TextProps) => {
  return marginLess ? (
    <StyledMarginlessText>{children}</StyledMarginlessText>
  ) : (
    <StyledText>{children}</StyledText>
  );
};
