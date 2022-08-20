import styled from "@emotion/styled";

import { Search } from "./core/Search";
import { flexColumn, flexColumnCenter, flexRow } from "./core/layout/helpers";
import { Text } from "./core/typography/Text";

const HeaderContainer = styled.header`
  ${flexColumnCenter}
  flex-shrink: 0;

  width: 100%;
  min-height: 30px;

  border-bottom: 1px solid ${(props) => props.theme.colors.footer.separator};
`;

const HeaderContent = styled.div`
  ${flexRow}

  width: 100%;
  padding: ${(props) => props.theme.spacing.m};

  text-align: center;
`;

const HeaderItem = styled.div<{ width: string }>`
  ${flexColumn}

  width: ${(props) => (props.width ? `${props.width}` : "50%")};
  margin-left: ${(props) => props.theme.spacing.m};

  &:last-of-type {
    margin-right: ${(props) => props.theme.spacing.m};
  }
`;

const HeaderText = styled(Text)`
  margin: 0;
  margin-block-start: 0;
  margin-block-end: 0;
`;

const Header = () => {
  return (
    <HeaderContainer>
      <HeaderContent>
        <HeaderItem width="60%">
          <HeaderText>Python. Wabbajack Theatrical Fantasy</HeaderText>
        </HeaderItem>
        <HeaderItem width="40%">
          <Search
            itemList={[
              "alma",
              "almale",
              "almaszorp",
              "korte",
              "kortelekvar",
              "ribizli",
              "ribizliszorp",
            ]}
            onSelect={(alma) => {
              console.log(alma);
            }}
          />
        </HeaderItem>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;
