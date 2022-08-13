import { TableProps, Table as WUITable } from "@welcome-ui/table";
import styled from "styled-components";

const Table = (props: TableProps) => <WUITable {...props} />;

Table.Thead = WUITable.Thead;
Table.Tbody = WUITable.Tbody;

Table.Tr = styled(WUITable.Tr)`
  border: none;
`;

Table.Th = styled(WUITable.Th)`
  border: none;
`;

Table.Td = styled(WUITable.Td)`
  padding: 0;
`;

export default Table;
