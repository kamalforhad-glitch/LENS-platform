"use client";

import { useRef, useCallback } from "react";
import gsap from "gsap";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function TiltCard({ children, className = "" }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    const glow = glowRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const tiltX = ((y - 50) / 50) * -8;
    const tiltY = ((x - 50) / 50) * 8;

    gsap.to(el, {
      rotateX: tiltX,
      rotateY: tiltY,
      transformPerspective: 1000,
      duration: 0.3,
      ease: "power2.out",
    });

    if (glow) {
      gsap.to(glow, {
        opacity: 1,
        background: `radial-gradient(circle at ${x}% ${y}%, rgba(34, 211, 238, 0.08) 0%, transparent 50%)`,
        duration: 0.3,
      });
    }
  }, []);

  const handleLeave = useCallback(() => {
    const el = ref.current;
    const glow = glowRef.current;
    if (el) {
      gsap.to(el, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.5,
        ease: "power2.out",
      });
    }
    if (glow) {
      gsap.to(glow, { opacity: 0, duration: 0.3 });
    }
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`relative overflow-hidden ${className}`}
      style={{ transformStyle: "preserve-3d", willChange: "transform" }}
    >
      <div
        ref={glowRef}
        className="absolute inset-0 opacity-0 pointer-events-none"
      />
      {children}
    </div>
  );
}
