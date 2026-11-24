// ============================================================
// HeroVisual — Static Visual Hero Element
//
// Optimized static hero visual for LensBD matching the reference design:
//   • Large cinematic camera lens on the right side
//   • Layered newspapers ("THE DAILY NEWS", "BANGLADESH Towards a Better Tomorrow")
//   • Bangladesh reality inside the lens (National Martyrs' Monument & crowds)
//   • Glowing Earth horizon at the bottom
//   • Dark navy, cyan, and LensBD red accents
//   • Responsive WebP / AVIF with eager loading and zero layout shift
// ============================================================

export default function HeroVisual() {
  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      <picture className="w-full h-full block">
        <source
          media="(max-width: 640px)"
          srcSet="/images/hero-visual-mobile.avif"
          type="image/avif"
        />
        <source
          media="(max-width: 640px)"
          srcSet="/images/hero-visual-mobile.webp"
          type="image/webp"
        />
        <source
          srcSet="/images/hero-visual.avif"
          type="image/avif"
        />
        <source
          srcSet="/images/hero-visual.webp"
          type="image/webp"
        />
        <img
          src="/images/hero-visual.webp"
          alt="LensBD Hero Visual - The Reality Behind The Lens"
          width={1920}
          height={1080}
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover object-[75%_center] lg:object-right-bottom xl:object-right"
        />
      </picture>

      {/* Subtle responsive contrast gradient to guarantee text readability on smaller viewports */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#020B18] via-[#020B18]/70 to-transparent lg:via-[#020B18]/20 lg:to-transparent pointer-events-none" />
    </div>
  );
}
