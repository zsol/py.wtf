import styled from "@emotion/styled";

import { Project } from "@/lib/docs";
import { generateProjectIndex } from "@/lib/searchDescriptor";

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

type HeaderProps = {
  showSearch?: boolean;
  project?: Project;
};

const Header = ({ project, showSearch = true }: HeaderProps) => {
  return (
    <HeaderContainer>
      <HeaderContent>
        <HeaderItem width={showSearch ? "60%" : "100%"}>
          <HeaderText>Python. Wabbajack Theatrical Fantasy</HeaderText>
        </HeaderItem>
        {showSearch && project && (
          <HeaderItem width="40%">
            <Search descriptors={generateProjectIndex(project)} />
          </HeaderItem>
        )}
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;
