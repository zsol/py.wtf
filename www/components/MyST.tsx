import type * as md from "mdast";
import { MyST } from "mystjs";
import { ReactElement, createContext, useContext } from "react";
import type { Literal } from "unist";

export interface MySTMarkupProps extends MySTRoles {
  source: string;
}

export interface MySTRoles {
  roles?: (role: MySTRole) => ReactElement;
}

const MySTContext = createContext<MySTRoles>({ roles: (_) => <></> });

export default function MySTMarkup({ source, roles }: MySTMarkupProps) {
  const parser = new MyST();
  const tree = parser.parse(source);
  return (
    <MySTContext.Provider value={{ roles }}>
      <MySTParent node={tree} />
    </MySTContext.Provider>
  );
}

export interface MySTRole extends Literal {
  type: "mystRole";
  name: string;
}

interface MySTRoleContentMap {
  mystRole: MySTRole;
}

interface ContentMap
  extends md.FrontmatterContentMap,
    md.DefinitionContentMap,
    md.ListContentMap,
    md.TableContentMap,
    md.RowContentMap,
    MySTRoleContentMap,
    Omit<md.BlockContentMap, "thematicbreak">,
    Omit<
      md.PhrasingContentMap,
      "inlinecode" | "imagereference" | "footnotereference"
    > {
  thematicBreak: md.BlockContentMap["thematicbreak"];
  inlineCode: md.PhrasingContentMap["inlinecode"];
  imageReference: md.PhrasingContentMap["imagereference"];
  footnoteReference: md.PhrasingContentMap["footnotereference"];
}

type Content = ContentMap[keyof ContentMap];

interface DispatchProps<T extends Content> {
  key: number;
  node: T;
}

type Dispatch = {
  [Type in keyof ContentMap]: (
    props: DispatchProps<ContentMap[Type]>,
  ) => ReactElement;
};

const dispatch: Dispatch = {
  paragraph: (props: DispatchProps<md.Paragraph>) => <Paragraph {...props} />,
  heading: (props: DispatchProps<md.Heading>) => <Heading {...props} />,
  thematicBreak: (props: DispatchProps<md.ThematicBreak>) => (
    <ThematicBreak {...props} />
  ),
  blockquote: (props: DispatchProps<md.Blockquote>) => (
    <Blockquote {...props} />
  ),
  list: (props: DispatchProps<md.List>) => <List {...props} />,
  listItem: (props: DispatchProps<md.ListItem>) => <ListItem {...props} />,
  table: (props: DispatchProps<md.Table>) => <Table {...props} />,
  tableRow: (props: DispatchProps<md.TableRow>) => <TableRow {...props} />,
  tableCell: (props: DispatchProps<md.TableCell>) => <TableCell {...props} />,
  html: (props: DispatchProps<md.HTML>) => <HTML {...props} />,
  code: (props: DispatchProps<md.Code>) => <Code {...props} />,
  yaml: (props: DispatchProps<md.YAML>) => <YAML {...props} />,
  definition: (props: DispatchProps<md.Definition>) => (
    <Definition {...props} />
  ),
  footnoteDefinition: (props: DispatchProps<md.FootnoteDefinition>) => (
    <FootnoteDefinition {...props} />
  ),
  text: (props: DispatchProps<md.Text>) => <Text {...props} />,
  emphasis: (props: DispatchProps<md.Emphasis>) => <Emphasis {...props} />,
  strong: (props: DispatchProps<md.Strong>) => <Strong {...props} />,
  delete: (props: DispatchProps<md.Delete>) => <Delete {...props} />,
  inlineCode: (props: DispatchProps<md.InlineCode>) => (
    <InlineCode {...props} />
  ),
  break: (props: DispatchProps<md.Break>) => <Break {...props} />,
  link: (props: DispatchProps<md.Link>) => <Link {...props} />,
  image: (props: DispatchProps<md.Image>) => <Image {...props} />,
  linkReference: (props: DispatchProps<md.LinkReference>) => (
    <LinkReference {...props} />
  ),
  imageReference: (props: DispatchProps<md.ImageReference>) => (
    <ImageReference {...props} />
  ),
  footnote: (props: DispatchProps<md.Footnote>) => <Footnote {...props} />,
  footnoteReference: (props: DispatchProps<md.FootnoteReference>) => (
    <FootnoteReference {...props} />
  ),
  mystRole: (props: DispatchProps<MySTRole>) => <Role {...props} />,
};

function MySTChild<K extends keyof Dispatch>(node: ContentMap[K], key: number) {
  return dispatch[node.type as K]({ key, node });
}

function MySTParent({ node }: { node: md.Parent }) {
  const ret = node.children.map((node, key) => {
    if (node.type in dispatch) {
      return MySTChild(node, key);
    }
    console.log(`Unexpected node with type ${node.type}`, node);
  });
  return <>{ret}</>;
}

function Paragraph({ node }: { node: md.Paragraph }) {
  return (
    <p>
      <MySTParent node={node} />
    </p>
  );
}

function Heading({ node }: { node: md.Heading }) {
  const children = <MySTParent node={node} />;
  switch (node.depth) {
    case 1:
      return <h1>{children}</h1>;
    case 2:
      return <h2>{children}</h2>;
    case 3:
      return <h3>{children}</h3>;
    case 4:
      return <h4>{children}</h4>;
    case 5:
      return <h5>{children}</h5>;
    case 6:
      return <h6>{children}</h6>;
  }
}

function ThematicBreak() {
  return <hr />;
}

function Blockquote({ node }: { node: md.Blockquote }) {
  return (
    <blockquote>
      <MySTParent node={node} />
    </blockquote>
  );
}

function List({ node }: { node: md.List }) {
  // TODO: support spread https://github.com/syntax-tree/mdast#list
  const children = <MySTParent node={node} />;
  if (node.ordered === true) {
    return <ol start={node.start ?? undefined}>{children}</ol>;
  }
  return <ul>{children}</ul>;
}

function ListItem({ node }: { node: md.ListItem }) {
  // TODO: support spread https://github.com/syntax-tree/mdast#listitem
  // TODO: support checked https://github.com/syntax-tree/mdast#listitem-gfm
  return (
    <li>
      <MySTParent node={node} />
    </li>
  );
}

function Table(_: { node: md.Table }) {
  // TODO: support table https://github.com/syntax-tree/mdast#table
  return <></>;
}

function TableRow(_: { node: md.TableRow }) {
  // TODO: support tablerow https://github.com/syntax-tree/mdast#tablerow
  return <></>;
}

function TableCell(_: { node: md.TableCell }) {
  // TODO: support tablecell https://github.com/syntax-tree/mdast#tablecell
  return <></>;
}

function HTML(_: { node: md.HTML }) {
  // HTML is unsupported.
  return <></>;
}

function Code({ node }: { node: md.Code }) {
  return (
    <pre>
      <code>{node.value}</code>
    </pre>
  );
}

function YAML(_: { node: md.YAML }) {
  // YAML is unsupported.
  return <></>;
}

function Definition(_: { node: md.Definition }) {
  // TODO: support definition https://github.com/syntax-tree/mdast#definition
  return <></>;
}

function FootnoteDefinition(_: { node: md.FootnoteDefinition }) {
  // TODO: support footnotedefinition https://github.com/syntax-tree/mdast#footnotedefinition
  return <></>;
}

function Text({ node }: { node: md.Text }) {
  return <span>{node.value}</span>;
}

function Emphasis({ node }: { node: md.Emphasis }) {
  return (
    <em>
      <MySTParent node={node} />
    </em>
  );
}

function Strong({ node }: { node: md.Strong }) {
  return (
    <b>
      <MySTParent node={node} />
    </b>
  );
}

function Delete({ node }: { node: md.Delete }) {
  return (
    <s>
      <MySTParent node={node} />
    </s>
  );
}

function InlineCode({ node }: { node: md.InlineCode }) {
  return <code>{node.value}</code>;
}

function Break(_: { node: md.Break }) {
  return <br />;
}

function Link({ node }: { node: md.Link }) {
  // title gets lost?
  return (
    <a href={node.url}>
      <MySTParent node={node} />
    </a>
  );
}

function Image({ node }: { node: md.Image }) {
  return <a href={node.url}>{node.alt} (Image)</a>;
}

function LinkReference(_: { node: md.LinkReference }) {
  // TODO: support linkreference https://github.com/syntax-tree/mdast#linkreference
  return <></>;
}

function ImageReference(_: { node: md.ImageReference }) {
  // TODO: support imagereference https://github.com/syntax-tree/mdast#imagereference
  return <></>;
}

function Footnote(_: { node: md.Footnote }) {
  // TODO: support footnote https://github.com/syntax-tree/mdast#footnote
  return <></>;
}

function FootnoteReference(_: { node: md.FootnoteReference }) {
  // TODO: support footnotereference https://github.com/syntax-tree/mdast#footnotereference
  return <></>;
}

function Role({ node }: { node: MySTRole }) {
  const { roles } = useContext(MySTContext);
  if (roles == null) {
    return null;
  }
  return roles(node);
}
