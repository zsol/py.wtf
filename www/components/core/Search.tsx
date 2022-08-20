import styled from "@emotion/styled";
import { useEffect, useState } from "react";

import { flexColumn } from "./layout/helpers";

// type SearchItem = {
// };

type SearchParams = {
  itemList: Array<string>;
  onSelect: (result: string) => void;
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

  background-color: cornflowerblue;
  opacity: 0.8;
`;

const SearchResultItem = styled.div`
  /* background-color: white;
  opacity: 0.5; */
`;

export const Search = ({ itemList = [], onSelect }: SearchParams) => {
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
          {results.map((item) => (
            <SearchResultItem>{item}</SearchResultItem>
          ))}
        </SearchResultContainer>
      )}
    </SearchContainer>
  );
};
