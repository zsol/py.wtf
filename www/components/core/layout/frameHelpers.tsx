import { css } from "@emotion/react";
import styled from "@emotion/styled";

import { Text } from "../typography/Text";
import { flexColumnCenter, flexRow } from "./helpers";

export const frameStyles = css`
  ${flexColumnCenter}
  flex-shrink: 0;

  width: 100%;
  min-height: 30px;
`;

export const FrameContent = styled.div`
  ${flexRow}
  justify-content: center;

  width: 100%;
  padding: ${(props) => props.theme.spacing.m};

  text-align: center;
`;

export const FrameText = styled(Text)`
  margin: 0;
  margin-block-start: 0;
  margin-block-end: 0;
`;
