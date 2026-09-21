"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
}

export default function MagneticButton({
  children,
  className = "",
  href,
}: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const inner = innerRef.current;
    if (!el) return;

    const handleMove = (e: Event) => {
      const me = e as MouseEvent;
      const rect = el.getBoundingClientRect();
      const x = me.clientX - rect.left - rect.width / 2;
      const y = me.clientY - rect.top - rect.height / 2;
      gsap.to(el, { x: x * 0.3, y: y * 0.3, duration: 0.3, ease: "power2.out" });
      if (inner) {
        gsap.to(inner, { x: x * 0.15, y: y * 0.15, duration: 0.3, ease: "power2.out" });
      }
    };

    const handleLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
      if (inner) {
        gsap.to(inner, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
      }
    };

    const handleEnter = () => {
      gsap.to(el, { scale: 1.05, duration: 0.2, ease: "power2.out" });
    };

    const handleLeaveScale = () => {
      gsap.to(el, { scale: 1, duration: 0.3, ease: "power2.out" });
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    el.addEventListener("mouseenter", handleEnter);
    el.addEventListener("mouseleave", handleLeaveScale);

    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
      el.removeEventListener("mouseenter", handleEnter);
      el.removeEventListener("mouseleave", handleLeaveScale);
    };
  }, []);

  if (href) {
    return (
      <a ref={ref as React.Ref<HTMLAnchorElement>} href={href} className={`inline-flex items-center ${className}`}>
        <span ref={innerRef} className="inline-flex items-center">
          {children}
        </span>
      </a>
    );
  }

  return (
    <button ref={ref as React.Ref<HTMLButtonElement>} className={`inline-flex items-center ${className}`}>
      <span ref={innerRef} className="inline-flex items-center">
        {children}
      </span>
    </button>
  );
}
