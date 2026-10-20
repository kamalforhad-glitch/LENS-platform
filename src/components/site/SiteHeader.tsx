// Server wrapper: resolves navigation (MenuItem CMS -> static fallback)
// and the CMS-managed logo URL, then hands plain data to the interactive
// client header below.
import SiteHeaderClient from "./SiteHeaderClient";
import { getHeaderNavigation } from "@/lib/site-menus";
import { getPublicSiteSettings } from "@/lib/actions/cms";
import { sanitizeUrl } from "@/lib/cms-validation";

export default async function SiteHeader() {
  const [entries, settings] = await Promise.all([
    getHeaderNavigation(),
    getPublicSiteSettings(),
  ]);
  // Validate the CMS-managed logo URL (blocks javascript:/data: etc.);
  // fall back to the packaged logo when unset or invalid.
  const check = sanitizeUrl(settings.site_logo_url?.value || "");
  const logoUrl = check.ok && check.url ? check.url : "/images/logo/lens-logo.png";
  return <SiteHeaderClient entries={entries} logoUrl={logoUrl} />;
}
