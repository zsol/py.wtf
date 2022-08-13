import { css } from "@emotion/react";

export const flexRow = css`
  display: flex;
  flex-direction: row;
`;

export const flexColumn = css`
  display: flex;
  flex-direction: column;
`;

export const flexColumnCenter = css`
  ${flexColumn}
  justify-content: center;
  align-items: center;
`;
