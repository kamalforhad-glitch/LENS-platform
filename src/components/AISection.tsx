"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Sparkles } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

function NeuralNetworkViz() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameCount = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let nodes: { x: number; y: number; vx: number; vy: number; size: number; pulse: number }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const count = window.innerWidth < 768 ? 25 : 50;

    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: 1 + Math.random() * 2,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    const draw = () => {
      frameCount.current++;
      if (frameCount.current % 3 !== 0) {
        animationId = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, w, h);

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const alpha = (1 - dist / 150) * 0.15;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const node of nodes) {
        node.pulse += 0.02;
        const pulseSize = node.size + Math.sin(node.pulse) * 0.5;

        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(34, 211, 238, 0.6)";
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseSize * 3, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, pulseSize * 3
        );
        gradient.addColorStop(0, "rgba(34, 211, 238, 0.1)");
        gradient.addColorStop(1, "rgba(34, 211, 238, 0)");
        ctx.fillStyle = gradient;
        ctx.fill();

        // Move
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > w) node.vx *= -1;
        if (node.y < 0 || node.y > h) node.vy *= -1;
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.4 }}
    />
  );
}

export default function AISection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { t } = useTranslation();

  const exampleQuestions = [
    t("ai.question1"),
    t("ai.question2"),
    t("ai.question3"),
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Badge reveal
      gsap.fromTo(
        ".ai-badge",
        { opacity: 0, scale: 0.8, filter: "blur(6px)" },
        {
          opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.7,
          ease: "back.out(1.7)",
          scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
        }
      );

      // Title fade-up
      gsap.fromTo(
        ".ai-title",
        { opacity: 0, y: 30, filter: "blur(8px)" },
        {
          opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 65%" },
        }
      );

      // Description fade-up
      gsap.fromTo(
        ".ai-desc",
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 0.7, delay: 0.15,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 60%" },
        }
      );

      // Question cards stagger
      const questions = gsap.utils.toArray<HTMLElement>(".ai-question");
      questions.forEach((q, i) => {
        gsap.fromTo(
          q,
          { opacity: 0, y: 20, scale: 0.95 },
          {
            opacity: 1, y: 0, scale: 1, duration: 0.5,
            ease: "power2.out",
            scrollTrigger: { trigger: sectionRef.current, start: "top 55%" },
            delay: i * 0.1,
          }
        );
      });

      // CTA animation
      gsap.fromTo(
        ".ai-cta",
        { opacity: 0, y: 20, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.6,
          ease: "back.out(1.4)",
          scrollTrigger: { trigger: sectionRef.current, start: "top 50%" },
          delay: 0.4,
        }
      );

      // Background orb parallax
      gsap.fromTo(
        ".ai-bg-orb",
        { y: 40, opacity: 0 },
        {
          y: -40, opacity: 0.08, ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 2,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 lg:py-32 relative overflow-hidden bg-gradient-to-b from-navy-950 via-[#0a1e38] to-navy-950">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(8,145,178,0.08)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(212,168,67,0.04)_0%,transparent_40%)]" />
      <div className="ai-bg-orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-teal-500 rounded-full blur-3xl opacity-0 pointer-events-none" />

      {/* Neural network visualization */}
      <div className="absolute inset-0 pointer-events-none">
        <NeuralNetworkViz />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-teal-400/30 rounded-full animate-float"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${4 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div className="ai-badge inline-flex items-center gap-2 px-5 py-2 rounded-full bg-teal-500/10 border border-teal-400/20 opacity-0 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-semibold text-teal-300 tracking-wide">{t("ai.badge")}</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="ai-title text-3xl lg:text-4xl font-bold text-white text-center mb-4 opacity-0">
          {t("ai.title")}
        </h2>

        {/* Description */}
        <p className="ai-desc text-slate-300/70 text-center max-w-2xl mx-auto mb-10 text-lg opacity-0">
          {t("ai.description")}
        </p>

        {/* Example questions */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {exampleQuestions.map((q: string, i: number) => (
            <span
              key={i}
              className="ai-question px-5 py-2.5 text-sm text-slate-300 bg-white/5 border border-white/10 rounded-full opacity-0 backdrop-blur-sm hover:bg-white/10 hover:border-teal-400/30 transition-all duration-300 cursor-default"
            >
              {q}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <a
            href="/assistant"
            className="ai-cta inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-full hover:from-teal-400 hover:to-teal-500 transition-all shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 hover:scale-105 opacity-0"
          >
            <Sparkles className="w-5 h-5" />
            {t("ai.cta")}
          </a>
        </div>
      </div>
    </section>
  );
}
