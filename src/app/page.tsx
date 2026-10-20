import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import HomeClient from "./HomeClient";
import { getPublicPage } from "@/lib/actions/cms";

export default async function Home() {
  const pageData = await getPublicPage("home");
  return (
    <HomeClient
      header={<SiteHeader />}
      footer={<SiteFooter />}
      pageData={pageData}
    />
  );
}
