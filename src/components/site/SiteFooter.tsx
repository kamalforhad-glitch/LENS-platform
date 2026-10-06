// Server wrapper: resolves footer columns (MenuItem CMS -> static
// fallback) and hands plain data to the client footer below.
// Client rendering is needed only for en/bn labels (locale lives
// in localStorage); there is no animation or interaction logic.
import SiteFooterClient from "./SiteFooterClient";
import { getFooterColumns } from "@/lib/site-menus";

export default async function SiteFooter() {
  const columns = await getFooterColumns();
  return <SiteFooterClient columns={columns} />;
}
