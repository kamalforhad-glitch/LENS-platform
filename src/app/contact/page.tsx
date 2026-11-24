import type { Metadata } from "next";
import ContactContent, { type ContactFormField } from "./ContactContent";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { getPublicPage, getPublicSiteSettings, type PublicSectionData } from "@/lib/actions/cms";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";
import type { SectionWithResolved } from "@/components/page/PageSectionsView";

export const metadata: Metadata = {
  title: "Contact Us — LENS",
  description: "Get in touch with LENS for research inquiries, partnership opportunities and media queries.",
};

async function resolveCmsSections(sections: PublicSectionData[]): Promise<SectionWithResolved[]> {
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

  const sections: SectionWithResolved[] = cms?.sections
    ? await resolveCmsSections(cms.sections)
    : [];

  const heroSection = sections.find((s) => s.type === "hero" || s.type === "banner");
  const richTextSection = sections.find((s) => s.type === "rich_text");
  const formSection = sections.find((s) => s.type === "contact_form");

  // Preserve any custom sections added in CMS admin (e.g. FAQ, testimonials, maps)
  const extraSections = sections.filter(
    (s) => s !== heroSection && s !== richTextSection && s !== formSection
  );

  const heroContent = (heroSection?.content || {}) as Record<string, unknown>;
  const heroContentBn = (heroSection?.contentBn || {}) as Record<string, unknown>;
  const formContent = (formSection?.content || {}) as Record<string, unknown>;
  const formContentBn = (formSection?.contentBn || {}) as Record<string, unknown>;
  const richTextContent = (richTextSection?.content || {}) as Record<string, unknown>;
  const richTextContentBn = (richTextSection?.contentBn || {}) as Record<string, unknown>;

  const infoParagraphs = Array.isArray(richTextContent.paragraphs)
    ? (richTextContent.paragraphs as string[])
    : undefined;
  const infoParagraphsBn = Array.isArray(richTextContentBn.paragraphs)
    ? (richTextContentBn.paragraphs as string[])
    : undefined;

  const breadcrumbs = cms?.breadcrumbs?.length
    ? cms.breadcrumbs.map((b) => ({
        label: b.label,
        labelBn: b.labelBn,
        href: b.href,
      }))
    : undefined;

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1 pt-20 sm:pt-24">
        <ContactContent
          // Hero CMS content
          eyebrow={typeof heroContent.eyebrow === "string" ? heroContent.eyebrow : undefined}
          eyebrowBn={typeof heroContentBn.eyebrow === "string" ? heroContentBn.eyebrow : undefined}
          title={typeof heroContent.title === "string" ? heroContent.title : cms?.title}
          titleBn={typeof heroContentBn.title === "string" ? heroContentBn.title : cms?.titleBn}
          description={
            typeof heroContent.subtitle === "string"
              ? heroContent.subtitle
              : cms?.description
          }
          descriptionBn={
            typeof heroContentBn.subtitle === "string"
              ? heroContentBn.subtitle
              : cms?.descriptionBn
          }
          breadcrumbs={breadcrumbs}

          // Contact info CMS content
          infoTitle={richTextSection?.title}
          infoTitleBn={richTextSection?.titleBn}
          infoDescription={richTextSection?.description}
          infoDescriptionBn={richTextSection?.descriptionBn}
          infoParagraphs={infoParagraphs}
          infoParagraphsBn={infoParagraphsBn}

          // Site Settings
          contactEmail={settings.contact_email?.value}
          contactEmailBn={settings.contact_email?.valueBn}
          mediaEmail={settings.media_email?.value}
          mediaEmailBn={settings.media_email?.valueBn}
          officeAddress={settings.office_address?.value}
          officeAddressBn={settings.office_address?.valueBn}
          contactPhone={settings.contact_phone?.value}
          contactPhoneBn={settings.contact_phone?.valueBn}
          officeHours={settings.office_hours?.value}
          officeHoursBn={settings.office_hours?.valueBn}

          // Form CMS content
          formTitle={typeof formContent.title === "string" ? formContent.title : formSection?.title}
          formTitleBn={typeof formContentBn.title === "string" ? formContentBn.title : formSection?.titleBn}
          formDescription={
            typeof formContent.description === "string"
              ? formContent.description
              : formSection?.description
          }
          formDescriptionBn={
            typeof formContentBn.description === "string"
              ? formContentBn.description
              : formSection?.descriptionBn
          }
          submitLabel={typeof formContent.submitLabel === "string" ? formContent.submitLabel : undefined}
          submitLabelBn={typeof formContentBn.submitLabel === "string" ? formContentBn.submitLabel : undefined}
          fields={Array.isArray(formContent.fields) ? (formContent.fields as ContactFormField[]) : undefined}

          // Extra CMS sections if any
          extraSections={extraSections}
        />
      </main>
      <SiteFooter />
    </>
  );
}
