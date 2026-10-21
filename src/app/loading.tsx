import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-navy-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(8,145,178,0.08)_0%,transparent_50%)]" />
      <div className="relative mb-8 flex items-center justify-center">
        <div
          className="absolute -inset-16 opacity-20 animate-rotate-slow pointer-events-none"
          style={{
            background: "conic-gradient(from 0deg, transparent 0deg, rgba(212,168,67,0.4) 15deg, transparent 40deg, transparent 360deg)",
            borderRadius: "50%",
          }}
        />
        <div className="relative z-10 px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md shadow-2xl shadow-teal-500/10">
          <Image
            src="/images/logo/lens-logo.png"
            alt="LENS — Lighthouse for Evolving Narrative Systems"
            width={180}
            height={46}
            className="h-10 sm:h-12 w-auto object-contain"
            priority
          />
        </div>
      </div>
      <p className="text-[10px] text-slate-400 tracking-[0.4em] uppercase mb-10 text-center">
        Lighthouse for Evolving Narrative Systems
      </p>
      <div className="w-40 h-[2px] bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-teal-400 to-gold-500 rounded-full animate-pulse" style={{ width: "60%" }} />
      </div>
    </div>
  );
}
