// Server wrapper: resolves footer columns (MenuItem CMS -> static
// fallback) and hands plain data to the client footer below.
// Client rendering is needed only for en/bn labels (locale lives
// in localStorage); there is no animation or interaction logic.
import SiteFooterClient from "./SiteFooterClient";
import { getFooterColumns } from "@/lib/site-menus";
import { getPublicSiteSettings } from "@/lib/actions/cms";

export default async function SiteFooter() {
  const [columns, settings] = await Promise.all([
    getFooterColumns(),
    getPublicSiteSettings(),
  ]);
  return <SiteFooterClient columns={columns} settings={settings} />;
}
