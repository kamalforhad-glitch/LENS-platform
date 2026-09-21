import type { Metadata } from "next";
import AssistantContent from "./AssistantContent";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "AI Research Assistant",
  description: "Ask questions about Bangladesh's media landscape and get AI-powered research insights.",
};

export default function AssistantPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-24">
        <AssistantContent />
      </main>
      <Footer />
    </>
  );
}
