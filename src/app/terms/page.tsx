import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "LENS terms and conditions governing the use of our website and services.",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-24">
        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Terms & Conditions</h1>
            <div className="prose prose-slate max-w-none space-y-6 text-sm text-slate-600 leading-relaxed">
              <p><strong>Last updated:</strong> September 2025</p>
              <h2 className="text-xl font-bold text-slate-900 mt-8">1. Acceptance of Terms</h2>
              <p>By accessing and using the LENS website, you accept and agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use our website.</p>
              <h2 className="text-xl font-bold text-slate-900 mt-8">2. Intellectual Property</h2>
              <p>All content published on this website, including research reports, articles, graphics and logos, is the property of LENS and is protected by intellectual property laws. You may share our content with proper attribution.</p>
              <h2 className="text-xl font-bold text-slate-900 mt-8">3. Use of Content</h2>
              <p>You may read, share and cite our research content with proper attribution to LENS. Commercial use of our content requires prior written permission.</p>
              <h2 className="text-xl font-bold text-slate-900 mt-8">4. Disclaimer</h2>
              <p>The information provided on this website is for general informational purposes only. While we strive for accuracy, we make no warranties about the completeness, reliability or suitability of this information.</p>
              <h2 className="text-xl font-bold text-slate-900 mt-8">5. Limitation of Liability</h2>
              <p>LENS shall not be liable for any indirect, incidental, or consequential damages arising from the use of our website or reliance on the information provided.</p>
              <h2 className="text-xl font-bold text-slate-900 mt-8">6. Changes to Terms</h2>
              <p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on this page.</p>
              <h2 className="text-xl font-bold text-slate-900 mt-8">7. Contact</h2>
              <p>For questions about these terms, contact us at <a href="mailto:info@lens.org.bd" className="text-teal-600 hover:underline">info@lens.org.bd</a>.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
