import { useParams } from "react-router-dom";

import Package from "@/components/Docs/Package";
import FetchPackage from "@/components/FetchPackage";
import Layout from "@/components/Layout";

export default function PackagePage() {
  const { pkg } = useParams();
  return (
    <FetchPackage
      name={pkg as string}
      content={(pkg) => (
        <Layout pkg={pkg}>
          <Package pkg={pkg} />
        </Layout>
      )}
    />
  );
}
