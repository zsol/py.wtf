import { useRouter } from "next/router";

import Package from "@/components/Docs/Package";
import FetchPackage from "@/components/FetchPackage";
import Layout from "@/components/Layout";

export default function PackagePage() {
  const router = useRouter();
  return (
    <FetchPackage
      name={router.query.pkg as string}
      content={(pkg) => (
        <Layout pkg={pkg}>
          <Package pkg={pkg} />
        </Layout>
      )}
    />
  );
}
