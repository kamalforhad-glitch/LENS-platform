import type { Metadata } from "next";
import ImpactContent from "./ImpactContent";

export const metadata: Metadata = {
  title: "Impact & Data",
  description: "Data visualizations and impact metrics from LENS research and programs.",
};

export default function ImpactPage() {
  return <ImpactContent />;
}
