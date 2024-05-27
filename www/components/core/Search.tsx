import styled from "@emotion/styled";
import fuzzysort from "fuzzysort";
import { ReactElement, useEffect, useState } from "react";

import { Index, Result, Results, search } from "@/lib/searchDescriptor";

import { flexColumn } from "./layout/helpers";
import { Link } from "./navigation/Link";

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

const ItemLink = styled(Link)`
  display: block;
  padding: ${(props) => props.theme.spacing.xs};
  text-decoration: none;
  &:focus {
    background-color: ${(props) => props.theme.colors.input.hover};
  }

  width: 100%;
`;

interface MatchProps {
  result: Result;
}

function highlightCallback(highlighted: string, ind: number): ReactElement {
  return <b key={ind}>{highlighted}</b>;
}

function Match({ result }: MatchProps): ReactElement {
  const ret = fuzzysort.highlight(result, highlightCallback) ?? "";
  const localNameIndex = result.obj.fqname.lastIndexOf(`.${result.obj.name}`);
  let suffix = null;
  if (localNameIndex > -1) {
    const parent = result.obj.fqname.slice(
      0,
      result.obj.fqname.lastIndexOf(`.${result.obj.name}`),
    );
    suffix = (
      <>
        {" "}
        <small>
          (in <em>{parent}</em>)
        </small>
      </>
    );
  }

  return (
    <>
      {ret}
      {suffix}
    </>
  );
}

export const Search = ({ descriptors }: SearchParams) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Results | null>(null);

  useEffect(() => {
    // TODO: debounce this
    if (searchTerm) {
      setResults(search(descriptors, searchTerm));
    } else {
      setResults(null);
    }
  }, [searchTerm]);

  function keyPressHandler(event: React.KeyboardEvent, index: number) {
    if (event.key === "ArrowDown" && index + 1 < (results?.length ?? 0)) {
      document.getElementById(`SearchResultItem_Link_${index + 1}`)?.focus();
      event.preventDefault();
    } else if (event.key === "ArrowUp" && index >= 0) {
      const target = document.getElementById(
        index === 0 ? "Search_Input" : `SearchResultItem_Link_${index - 1}`,
      );
      target?.focus();
      event.preventDefault();
    }
  }

  return (
    <SearchContainer>
      <input
        id="Search_Input"
        onChange={(event) => {
          setSearchTerm(event.target.value);
        }}
        value={searchTerm}
        onKeyDown={(event) => keyPressHandler(event, -1)}
      />
      {searchTerm && results && (
        <SearchResultContainer>
          {results.total === 0 && "No results found"}
          {results.total > 0 &&
            results.map((result: Result, ind: number) => (
              <SearchResultItem key={`${result.obj.name}_${ind}`}>
                <ItemLink
                  id={`SearchResultItem_Link_${ind}`}
                  to={`${result.obj.url}`}
                  onClick={() => setSearchTerm("")}
                  onKeyDown={(event) => keyPressHandler(event, ind)}
                >
                  <Match result={result} />
                </ItemLink>
              </SearchResultItem>
            ))}
        </SearchResultContainer>
      )}
    </SearchContainer>
  );
};
