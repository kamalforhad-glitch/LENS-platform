import type { Metadata } from "next";
import ContactContent from "./ContactContent";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with LENS for research inquiries, partnership opportunities and media queries.",
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <ContactContent />
      </main>
      <SiteFooter />
    </>
  );
}
