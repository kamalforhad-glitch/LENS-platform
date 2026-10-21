import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageSectionsView, { type SectionWithResolved } from "@/components/page/PageSectionsView";
import HomeClient from "@/app/HomeClient";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";
import { getPage } from "@/lib/actions/cms";
import { getCurrentUser } from "@/lib/auth";
import { parseJsonSafe } from "@/lib/cms-validation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Draft Preview | LENS Admin",
  robots: { index: false, follow: false },
};

type PageRow = Record<string, unknown>;

function toPublicSections(page: PageRow): SectionWithResolved[] {
  const rawSections = Array.isArray(page.sections) ? page.sections : [];
  return rawSections.map((raw) => {
    const s = (raw ?? {}) as Record<string, unknown>;
    return {
      id: String(s.id ?? ""),
      type: String(s.type ?? ""),
      title: String(s.title ?? ""),
      titleBn: String(s.titleBn ?? ""),
      description: String(s.description ?? ""),
      descriptionBn: String(s.descriptionBn ?? ""),
      sortOrder: typeof s.sortOrder === "number" ? s.sortOrder : Number(s.sortOrder) || 0,
      visible: Boolean(s.visible),
      settings: parseJsonSafe(s.settings, {}),
      content: parseJsonSafe(s.content, {}),
      contentBn: parseJsonSafe(s.contentBn, {}),
      resolved: { items: [] },
    } as SectionWithResolved;
  });
}

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // getCurrentUser is cheap; getPage enforces viewer+ and throws otherwise.
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  let page: PageRow;
  try {
    const row = await getPage(id);
    if (!row) redirect("/admin/pages");
    page = row as PageRow;
  } catch {
    redirect("/admin/login");
  }

  const sections = toPublicSections(page).map((section) => ({ ...section, visible: true }));

  // Resolve DB-driven collections synchronously for preview data.
  for (const section of sections) {
    try {
      section.resolved = await resolveSectionItems(section.type, section.content);
    } catch {
      section.resolved = { items: [] };
    }
  }

  const status = String(page.status ?? "draft");
  const slug = String(page.slug ?? "");

  const previewBanner = (
    <div className="pt-20 pb-2 bg-navy-950/90 border-b border-amber-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-semibold text-amber-950 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Draft preview mode
          </span>
          <span>
            Status: <span className="font-mono font-bold uppercase text-xs px-2 py-0.5 rounded bg-amber-100">{status}</span>
          </span>
          <span>
            Slug: <span className="font-mono">/{slug}</span>
          </span>
          <span className="text-amber-700 hidden sm:inline ml-auto text-xs">
            Viewing unpublished CMS changes. Hidden sections are enabled in preview.
          </span>
        </div>
      </div>
    </div>
  );

  if (slug === "home") {
    return (
      <>
        {previewBanner}
        <HomeClient
          header={<SiteHeader />}
          footer={<SiteFooter />}
          pageData={{ ...page, sections }}
        />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {previewBanner}
        <PageSectionsView sections={sections} />
      </main>
      <SiteFooter />
    </>
  );
}
