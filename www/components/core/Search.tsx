import styled from "@emotion/styled";
import { ReactElement, useEffect, useState } from "react";

import { Index, Result, search } from "@/lib/searchDescriptor";

import { flexColumn } from "./layout/helpers";
import { RouterLink } from "./navigation/Link";

type SearchParams = {
  descriptors: Index;
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
  overflow: scroll;

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

const ItemLink = styled(RouterLink)`
  display: block;
  padding: ${(props) => props.theme.spacing.xs};

  width: 100%;
`;

interface MatchProps {
  result: Result;
}
function Match({ result }: MatchProps): ReactElement {
  if (!result.matches) {
    return <span>{result.item.name}</span>;
  }

  const ret = [];
  let nameInd = 0;
  for (const ind of result.matches[0].indices) {
    const [matchStart, matchEnd] = ind;
    if (matchStart !== nameInd) {
      ret.push(<span>{result.item.name.slice(nameInd, matchStart)}</span>);
    }
    ret.push(<b>{result.item.name.slice(matchStart, matchEnd + 1)}</b>);
    nameInd = matchEnd + 1;
  }
  if (nameInd !== result.item.name.length) {
    ret.push(<span>{result.item.name.slice(nameInd)}</span>);
  }
  return <>{ret}</>;
}

export const Search = ({ descriptors }: SearchParams) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Array<Result>>([]);

  useEffect(() => {
    // TODO: debounce this
    if (searchTerm) {
      setResults(search(descriptors, searchTerm));
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
          {results.length > 0 &&
            results.map((result: Result, ind: number) => (
              <SearchResultItem key={`${result.item.name}_${ind}`}>
                <ItemLink to={`${result.item.url}`}>
                  <Match result={result} />
                </ItemLink>
              </SearchResultItem>
            ))}
        </SearchResultContainer>
      )}
    </SearchContainer>
  );
};
