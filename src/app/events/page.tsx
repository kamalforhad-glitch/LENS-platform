import type { Metadata } from "next";
import EventsContent from "./EventsContent";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Events",
  description: "Workshops, summits, conferences and community events by LENS to strengthen Bangladesh's narrative ecosystem.",
};

export default function EventsPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-24">
        <EventsContent />
      </main>
      <Footer />
    </>
  );
}
