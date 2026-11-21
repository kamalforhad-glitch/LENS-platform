import type { Metadata } from "next";
import ContactContent from "./ContactContent";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { getPublicPage, getPublicSiteSettings, type PublicSectionData } from "@/lib/actions/cms";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";
import type { SectionWithResolved } from "@/components/page/PageSectionsView";
import CmsPageView from "@/components/page/CmsPageView";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with LENS for research inquiries, partnership opportunities and media queries.",
};

async function resolveCmsSections(sections: PublicSectionData[]) {
  return Promise.all(
    sections.map(async (s) => ({
      ...s,
      resolved: await resolveSectionItems(s.type, s.content).catch(() => ({ items: [] })),
    }))
  );
}

export default async function ContactPage() {
  const [cms, settings] = await Promise.all([
    getPublicPage("contact"),
    getPublicSiteSettings(),
  ]);

  if (cms) {
    const sections: SectionWithResolved[] = await resolveCmsSections(cms.sections);
    return <CmsPageView page={{ id: cms.id, slug: cms.slug, title: cms.title, sections }} />;
  }

  return (
    <>
      <SiteHeader />
      <main className="bg-gray-50 flex-1 pt-24">
        <ContactContent
          contactEmail={settings.contact_email?.value}
          mediaEmail={settings.media_email?.value}
          officeAddress={settings.office_address?.value}
          contactPhone={settings.contact_phone?.value}
          officeHours={settings.office_hours?.value}
        />
      </main>
      <SiteFooter />
    </>
  );
}