"use client";

import { useRef, useEffect, useCallback } from "react";
import { isScrollActive } from "@/lib/scroll-activity";

function seededRandom(seed: number) {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

interface Node {
  x: number;
  y: number;
  size: number;
  pulseSpeed: number;
  pulseOffset: number;
  brightness: number;
}

interface Connection {
  from: number;
  to: number;
  progress: number;
  speed: number;
}

export default function MediaIntelligenceMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const prefersReduced = useRef(false);
  const isVisible = useRef(false);
  // Static per-size layout (nodes, connections, grid path). All inputs are
  // pure functions of (seed, w, h), so caching per resize produces pixel-
  // identical output without per-frame array rebuilds and seededRandom calls.
  const layoutRef = useRef<{ nodes: Node[]; connections: Connection[]; grid: Path2D } | null>(null);

  const buildLayout = useCallback((w: number, h: number) => {
    const nodeCount = 12;
    const nodes: Node[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: seededRandom(i * 5 + 1) * w,
        y: seededRandom(i * 5 + 2) * h,
        size: 1.5 + seededRandom(i * 5 + 3) * 2,
        pulseSpeed: 0.5 + seededRandom(i * 5 + 4) * 1.5,
        pulseOffset: seededRandom(i * 5 + 5) * Math.PI * 2,
        brightness: 0.3 + seededRandom(i * 5 + 6) * 0.7,
      });
    }

    const connections: Connection[] = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          connections.push({
            from: i,
            to: j,
            progress: seededRandom(i * 10 + j) * 100,
            speed: 0.2 + seededRandom(i * 10 + j + 1) * 0.5,
          });
        }
      }
    }

    const grid = new Path2D();
    const gridSize = 24;
    for (let x = 0; x < w; x += gridSize) {
      grid.moveTo(x, 0);
      grid.lineTo(x, h);
    }
    for (let y = 0; y < h; y += gridSize) {
      grid.moveTo(0, y);
      grid.lineTo(w, y);
    }

    layoutRef.current = { nodes, connections, grid };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const layout = layoutRef.current;
    if (!layout) return;

    // Scroll-aware pause: skip animation work while actively scrolling, but
    // keep the RAF loop alive so rendering resumes instantly on settle.
    // The reduced-motion single-draw path (isVisible false) always renders.
    if (isScrollActive() && isVisible.current) {
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    const w = canvas.width;
    const h = canvas.height;
    const t = performance.now() * 0.001;
    const { nodes, connections } = layout;

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(8, 145, 178, 0.06)";
    ctx.lineWidth = 0.5;
    ctx.stroke(layout.grid);

    connections.forEach((conn) => {
      const a = nodes[conn.from];
      const b = nodes[conn.to];
      ctx.strokeStyle = "rgba(34, 211, 238, 0.08)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      const progress = ((conn.progress + t * conn.speed * 20) % 100) / 100;
      const px = a.x + (b.x - a.x) * progress;
      const py = a.y + (b.y - a.y) * progress;
      ctx.fillStyle = "rgba(34, 211, 238, 0.4)";
      ctx.beginPath();
      ctx.arc(px, py, 1, 0, Math.PI * 2);
      ctx.fill();
    });

    nodes.forEach((node) => {
      const pulse = Math.sin(t * node.pulseSpeed + node.pulseOffset) * 0.5 + 0.5;
      const size = node.size + pulse * 1.5;
      const alpha = node.brightness * (0.3 + pulse * 0.4);

      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size * 4);
      gradient.addColorStop(0, `rgba(34, 211, 238, ${alpha * 0.3})`);
      gradient.addColorStop(1, "rgba(34, 211, 238, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, size * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(34, 211, 238, ${alpha})`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
      ctx.fill();
    });

    const centerX = w * 0.5;
    const centerY = h * 0.7;
    const maxRadius = Math.min(w, h) * 0.4;
    const sweepAngle = t * 0.3;

    const sweepGradient = ctx.createConicGradient(sweepAngle, centerX, centerY);
    sweepGradient.addColorStop(0, "rgba(212, 168, 67, 0.08)");
    sweepGradient.addColorStop(0.1, "rgba(212, 168, 67, 0)");
    sweepGradient.addColorStop(1, "rgba(212, 168, 67, 0)");

    ctx.fillStyle = sweepGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
    ctx.fill();

    for (let r = 1; r <= 3; r++) {
      ctx.strokeStyle = `rgba(212, 168, 67, ${0.04 / r})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius * (r / 3), 0, Math.PI * 2);
      ctx.stroke();
    }

    if (isVisible.current) {
      animRef.current = requestAnimationFrame(draw);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReduced.current = mq.matches;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      buildLayout(canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    // IntersectionObserver to pause when not visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible.current = entry.isIntersecting;
        if (entry.isIntersecting && !prefersReduced.current) {
          animRef.current = requestAnimationFrame(draw);
        }
      },
      { threshold: 0 }
    );
    observer.observe(container);

    if (!prefersReduced.current) {
      isVisible.current = true;
      animRef.current = requestAnimationFrame(draw);
    } else {
      draw();
    }

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
      observer.disconnect();
    };
  }, [draw, buildLayout]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#030810]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#030810] via-transparent to-[#030810]" />
    </div>
  );
}
