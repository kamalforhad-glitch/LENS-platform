// Server wrapper: resolves navigation (MenuItem CMS -> static fallback)
// and hands plain data to the interactive client header below.
import SiteHeaderClient from "./SiteHeaderClient";
import { getHeaderNavigation } from "@/lib/site-menus";

export default async function SiteHeader() {
  const entries = await getHeaderNavigation();
  return <SiteHeaderClient entries={entries} />;
}
