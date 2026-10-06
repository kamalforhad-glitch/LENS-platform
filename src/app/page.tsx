// Server shell: renders CMS-driven site chrome (header/footer) and
// passes them as slots to the client homepage body. The legacy
// components/Header.tsx + components/Footer.tsx are intentionally
// left untouched as the verified fallback.
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import HomeClient from "./HomeClient";

export default function Home() {
  return <HomeClient header={<SiteHeader />} footer={<SiteFooter />} />;
}
