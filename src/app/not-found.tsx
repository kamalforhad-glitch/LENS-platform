import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist or has been moved.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-teal-400/20 mb-4">404</div>
        <h1 className="text-2xl font-bold text-white mb-3">Page Not Found</h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          The page you are looking for does not exist or has been moved. Please
          check the URL or navigate back to the homepage.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-full transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
