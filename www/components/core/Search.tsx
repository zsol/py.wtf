import styled from "@emotion/styled";
import { useEffect, useState } from "react";

import { flexColumn } from "./layout/helpers";
import { Link, RouterLink } from "./navigation/Link";

// type SearchItem = {
// };

type SearchParams = {
  itemList: Array<string>;
};

const SearchContainer = styled.div`
  ${flexColumn}
  position: relative;
`;

const SearchResultContainer = styled.div`
  position: absolute;
  top: 30px;
  left: 0px;
  width: 100%;
  max-height: 200px;
  padding: ${(props) => props.theme.spacing.xs} 0;

  background-color: ${(props) => props.theme.colors.input.background};
  border-color: ${(props) => props.theme.colors.input.border};
  border-radius: 10px;
  color: ${(props) => props.theme.colors.input.text};
`;

const SearchResultItem = styled.div`
  &:hover {
    background-color: ${(props) => props.theme.colors.input.hover};
  }
`;

const ItemLink = styled(Link)`
  display: block;
  padding: ${(props) => props.theme.spacing.xs};

  width: 100%;
`;

export const Search = ({ itemList = [] }: SearchParams) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    // TODO: debounce this
    if (searchTerm) {
      setResults(itemList.filter((item) => item.includes(searchTerm)));
    } else {
      setResults([]);
    }
  }, [searchTerm]);

  return (
    <SearchContainer>
      <input
        onChange={(event) => {
          setSearchTerm(event.target.value);
        }}
      />
      {searchTerm && (
        <SearchResultContainer>
          {results.length === 0 && "No results found"}
          {results?.length > 0 &&
            results.map((item) => (
              <SearchResultItem>
                <ItemLink href={`/${item as string}`}>{item}</ItemLink>
              </SearchResultItem>
            ))}
        </SearchResultContainer>
      )}
    </SearchContainer>
  );
};
