import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "LENS privacy policy - how we collect, use and protect your personal information.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-24">
        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Privacy Policy</h1>
            <div className="prose prose-slate max-w-none space-y-6 text-sm text-slate-600 leading-relaxed">
              <p><strong>Last updated:</strong> September 2025</p>
              <h2 className="text-xl font-bold text-slate-900 mt-8">1. Information We Collect</h2>
              <p>We collect information you provide directly, such as when you subscribe to our newsletter, contact us, or participate in our events. This may include your name, email address and any other information you choose to provide.</p>
              <h2 className="text-xl font-bold text-slate-900 mt-8">2. How We Use Your Information</h2>
              <p>We use the information we collect to operate and improve our services, send you research updates and event notifications, respond to your inquiries, and analyze website usage to enhance user experience.</p>
              <h2 className="text-xl font-bold text-slate-900 mt-8">3. Analytics</h2>
              <p>We use Google Analytics and Meta Pixel to understand how visitors interact with our website. These tools collect information such as pages visited, time spent on pages, and referral sources. You can opt out of analytics tracking through our cookie consent banner.</p>
              <h2 className="text-xl font-bold text-slate-900 mt-8">4. Data Protection</h2>
              <p>We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>
              <h2 className="text-xl font-bold text-slate-900 mt-8">5. Third-Party Services</h2>
              <p>We may use third-party services that collect information used to identify you. These services have their own privacy policies addressing how they use such information.</p>
              <h2 className="text-xl font-bold text-slate-900 mt-8">6. Your Rights</h2>
              <p>You have the right to access, correct, or delete your personal information. To exercise these rights, please contact us at <a href="mailto:info@lens.org.bd" className="text-teal-600 hover:underline">info@lens.org.bd</a>.</p>
              <h2 className="text-xl font-bold text-slate-900 mt-8">7. Contact</h2>
              <p>If you have questions about this privacy policy, please contact us at <a href="mailto:info@lens.org.bd" className="text-teal-600 hover:underline">info@lens.org.bd</a>.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
