import type { Metadata } from "next";
import PublicationsContent from "./PublicationsContent";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Publications",
  description: "Policy briefs, working papers, research reports and analysis from the LENS research team.",
};

export default function PublicationsPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-24">
        <PublicationsContent />
      </main>
      <Footer />
    </>
  );
}
