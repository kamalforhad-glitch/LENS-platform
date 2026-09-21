import type { Metadata } from "next";
import ResearchersContent from "./ResearchersContent";

export const metadata: Metadata = {
  title: "Researcher Network",
  description: "Meet our affiliated researchers and their contributions to media studies in Bangladesh.",
};

export default function ResearchersPage() {
  return <ResearchersContent />;
}
