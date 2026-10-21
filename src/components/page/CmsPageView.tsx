import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageSectionsView, { type SectionWithResolved } from "./PageSectionsView";

export interface CmsPageViewProps {
  page: {
    id: string;
    slug: string;
    title: string;
    sections: SectionWithResolved[];
  };
}

/**
 * Shared CMS page shell: header, breadcrumb, PageSectionsView, footer.
 * Used by the public [slug] renderer and by hardcoded-page wrappers that
 * have been migrated to a published CMS page. Hardcoded fallbacks are
 * untouched — a wrapper only renders this when a published CMS page exists.
 */
export default function CmsPageView({ page }: CmsPageViewProps) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <div className="pt-24 pb-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="text-sm text-slate-500 mb-2" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-teal-600">
                Home
              </Link>
              <span className="mx-2">/</span>
              <span className="text-slate-800">{page.title}</span>
            </nav>
          </div>
        </div>
        <PageSectionsView sections={page.sections} />
      </main>
      <SiteFooter />
    </>
  );
}
