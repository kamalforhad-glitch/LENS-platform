import type { Metadata } from "next";
import ContactContent from "./ContactContent";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with LENS for research inquiries, partnership opportunities and media queries.",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-24">
        <ContactContent />
      </main>
      <Footer />
    </>
  );
}
