import dynamic from "next/dynamic";

const NavigationManager = dynamic(() => import("@/components/admin/NavigationManager"), {
  loading: () => (
    <div className="p-6 animate-pulse" aria-busy="true">
      <div className="h-8 w-64 bg-slate-200 rounded mb-4" />
      <div className="h-4 w-96 bg-slate-100 rounded mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-lg border border-slate-200" />
        ))}
      </div>
    </div>
  ),
});

export const metadata = {
  title: "Navigation & Menus CMS | LENS Admin",
  description: "Manage bilingual navigation hierarchy, nested dropdowns, badges, and status.",
};

export default function NavigationPage() {
  return <NavigationManager />;
}
