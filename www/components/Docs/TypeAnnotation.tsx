import React from "react";

import * as docs from "../../lib/docs";
import Intersperse from "../Intersperse";
import { RouterLink } from "../core/navigation/Link";

type UrlMaker = (xref: docs.XRef) => string | null;

export interface TypeAnnotationProps {
  type: docs.Typ;
  url: UrlMaker;
}

export default function TypeAnnotation({ type, url }: TypeAnnotationProps) {
  const name =
    type.xref == null ? (
      <>{type.name}</>
    ) : (
      <SymRef xref={type.xref} url={url}>
        {type.name}
      </SymRef>
    );
  const params = type.params?.map((param) => (
    <TypeAnnotation type={param} url={url} />
  ));
  const lbrak = params === undefined ? null : "[";
  const rbrak = params === undefined ? null : "]";
  return (
    <span>
      {name}
      {lbrak}
      <Intersperse separator=", ">{params ?? []}</Intersperse>
      {rbrak}
    </span>
  );
}

function SymRef({
  xref,
  url,
  children,
}: {
  xref: docs.XRef;
  url: UrlMaker;
  children: string;
}) {
  const to = url(xref);
  return to != null ? (
    <RouterLink to={to}>{children}</RouterLink>
  ) : (
    <span>{children}</span>
  );
}
