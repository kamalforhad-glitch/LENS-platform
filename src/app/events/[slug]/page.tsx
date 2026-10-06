import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { EventSchema } from "@/components/SchemaOrg";
import { formatFullDate, getPublicEvent } from "@/lib/public-content";

export const dynamic = "force-dynamic";

async function getEvent(slug: string) {
  return getPublicEvent(slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return { title: "Event Not Found" };
  return {
    title: `${event.name} — Events at LENS`,
    description: event.description,
    openGraph: { title: event.name, description: event.description },
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const dateLabel = formatFullDate(event.startDate);
  const baseUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.lensbd.org"}/events/${event.slug}`;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <EventSchema
          name={event.name}
          description={event.description}
          startDate={event.startDate.toISOString()}
          endDate={(event.endDate || event.startDate).toISOString()}
          location={event.location}
          url={baseUrl}
        />
        <section className="relative py-20 bg-navy-950 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_40%_60%,rgba(8,145,178,0.08)_0%,transparent_50%)]" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <nav className="text-sm text-slate-400 mb-6">
              <Link href="/" className="hover:text-teal-400">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/events" className="hover:text-teal-400">Events</Link>
              <span className="mx-2">/</span>
              <span className="text-white">{event.name}</span>
            </nav>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-3 block">
              {event.category}
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">{event.name}</h1>
            <p className="text-lg text-slate-300/80 leading-relaxed max-w-3xl">{event.description}</p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-[1fr_300px] gap-10">
              <div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </div>
              </div>
              <div className="lg:sticky lg:top-28 lg:self-start">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-4">Event Details</h3>
                  <div className="space-y-3 text-sm">
                    <div><span className="text-slate-500">Date:</span> <span className="text-slate-900 font-medium">{dateLabel}</span></div>
                    {event.time && <div><span className="text-slate-500">Time:</span> <span className="text-slate-900 font-medium">{event.time}</span></div>}
                    <div><span className="text-slate-500">Location:</span> <span className="text-slate-900 font-medium">{event.location}</span></div>
                    <div><span className="text-slate-500">Category:</span> <span className="text-slate-900 font-medium">{event.category}</span></div>
                    {event.capacity ? (
                      <div><span className="text-slate-500">Seats:</span> <span className="text-slate-900 font-medium">{event.registered} / {event.capacity}</span></div>
                    ) : null}
                  </div>
                  {event.registrationUrl && (
                    <a
                      href={event.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 w-full inline-flex items-center justify-center px-5 py-3 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-full transition-all"
                    >
                      Register
                    </a>
                  )}
                  {event.locationUrl && (
                    <a
                      href={event.locationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 w-full inline-flex items-center justify-center px-5 py-3 border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-semibold rounded-full transition-all"
                    >
                      View Location
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
