import type { Metadata } from "next";
import EventsContent from "./EventsContent";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { getPublicEvents } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Events",
  description: "Workshops, summits, conferences and community events by LENS to strengthen Bangladesh's narrative ecosystem.",
};

export default async function EventsPage() {
  const { items: events, error } = await getPublicEvents();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <EventsContent events={events} error={error} />
      </main>
      <SiteFooter />
    </>
  );
}
