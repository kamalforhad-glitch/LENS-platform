// ============================================================
// NetworkTopology — live 2D narrative-signal telemetry graph.
//
// Fills the bento "Ecosystem nodes" slot with a high-precision,
// minimal node-graph of Bangladesh's narrative & research
// ecosystem (Dhaka core, regional hubs, research desks):
//
//   • native HTML5 Canvas 2D only — zero 3D/animation libraries;
//   • fine, muted hairline filaments with slow breathing opacity;
//   • cyan (#06B6D4 / #22D3EE) telemetry packets traversing links;
//   • radar-style ping rings pulsing from the Dhaka core;
//   • eased hover highlight of the nearest node + its connections;
//   • one lightweight requestAnimationFrame loop, DPR capped at 2;
//   • IntersectionObserver pauses the loop off-screen, ResizeObserver
//     re-fits the graph, prefers-reduced-motion renders one static
//     frame, and captions are collision-checked so labels never
//     overlap or spill out of the card.
//
// The card shell (border, backdrop, heading) stays in
// EditorialInsightGrid so the surrounding bento layout, statistics
// cards and borders are untouched — the canvas is absolutely
// positioned, so it contributes no layout shift (zero CLS).
// ============================================================
"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

type TopologyNode = {
  id: string;
  label: { en: string; bn: string };
  /** Normalised 0–1 position inside the padded plot box. */
  x: number;
  y: number;
  /** Draw the caption above the dot instead of below it. */
  above?: boolean;
  /** Primary emitter the rest of the graph hangs off. */
  core?: boolean;
};

/** Bangladesh's narrative & research ecosystem — seven tracked nodes. */
const NODES: TopologyNode[] = [
  { id: "dhaka", label: { en: "Dhaka Core", bn: "ঢাকা কোর" }, x: 0.5, y: 0.5, core: true },
  { id: "chattogram", label: { en: "Chattogram Hub", bn: "চট্টগ্রাম হাব" }, x: 0.82, y: 0.72 },
  { id: "sylhet", label: { en: "Sylhet Node", bn: "সিলেট নোড" }, x: 0.85, y: 0.22 },
  { id: "khulna", label: { en: "Khulna Node", bn: "খুলনা নোড" }, x: 0.16, y: 0.74 },
  { id: "rajshahi", label: { en: "Rajshahi Node", bn: "রাজশাহী নোড" }, x: 0.14, y: 0.24 },
  { id: "factcheck", label: { en: "Fact-Check Desk", bn: "ফ্যাক্ট-চেক ডেস্ক" }, x: 0.5, y: 0.95 },
  { id: "indexer", label: { en: "Media Indexer", bn: "মিডিয়া ইনডেক্সার" }, x: 0.5, y: 0.1, above: true },
];

/** Filaments: core links first (the busiest corridor), then the regional mesh. */
const EDGE_PAIRS: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 5],
  [0, 6],
  [2, 6],
  [4, 6],
  [3, 5],
  [1, 5],
  [1, 2],
  [3, 4],
];

const EDGES = EDGE_PAIRS.map(([a, b], index) => ({ a, b, phase: index * 0.83 }));

const CORE = 0;
const TAU = Math.PI * 2;
const MAX_DPR = 2;
const PAD_X = 30;
const PAD_Y = 18;
const HOVER_RADIUS = 30;
const MAX_PULSES = 14;
const MAX_RIPPLES = 3;
const PULSE_SPAWN = 0.42; // seconds between telemetry packets
const RIPPLE_INTERVAL = 3.4; // seconds between core pings
const RIPPLE_LIFE = 2.6; // seconds a ping ring takes to fade out

type Pulse = { edge: number; dir: 1 | -1; t: number; speed: number; alive: boolean };
type Ripple = { t: number; alive: boolean };

export default function NetworkTopology({
  title,
  ariaLabel,
}: {
  /** Card heading rendered above the graph (keeps bento typography). */
  title?: string;
  /** Accessible description for the canvas image. */
  ariaLabel?: string;
}) {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const captions = NODES.map((node) => (isBn ? node.label.bn : node.label.en));

    // --- geometry (rebuilt only when the box resizes) ------------------
    let w = 0;
    let h = 0;
    const px = new Float64Array(NODES.length);
    const py = new Float64Array(NODES.length);
    const hi = new Float64Array(NODES.length); // eased hover highlight 0..1
    const capX = new Float64Array(NODES.length);
    const capY = new Float64Array(NODES.length);
    const capW = new Float64Array(NODES.length);
    const capPlaced = new Uint8Array(NODES.length);
    const boxX = new Float64Array(NODES.length);
    const boxY = new Float64Array(NODES.length);
    const boxW = new Float64Array(NODES.length);
    const boxH = new Float64Array(NODES.length);
    let boxCount = 0;

    // --- animation state ------------------------------------------------
    let time = 0;
    let spawnTimer = 0;
    let rippleTimer = RIPPLE_INTERVAL - 0.9;
    let hoverX = -1e4;
    let hoverY = -1e4;
    let hovering = false;
    let nearestNode = -1;
    let running = false;
    let inView = false;
    let reduceMotion = false;
    let rafId = 0;
    let lastTs = 0;

    const pulses: Pulse[] = Array.from({ length: MAX_PULSES }, (): Pulse => ({
      edge: 0,
      dir: 1,
      t: 0,
      speed: 0,
      alive: false,
    }));
    const ripples: Ripple[] = Array.from({ length: MAX_RIPPLES }, (): Ripple => ({
      t: 0,
      alive: false,
    }));

    // --- sizing / layout -------------------------------------------------
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const cw = Math.round(rect.width);
      const ch = Math.round(rect.height);
      if (cw < 8 || ch < 8) return;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const bw = Math.round(cw * dpr);
      const bh = Math.round(ch * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      w = cw;
      h = ch;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const padX = Math.min(PAD_X, w * 0.14);
      const padY = Math.min(PAD_Y, h * 0.16);
      const innerW = Math.max(1, w - padX * 2);
      const innerH = Math.max(1, h - padY * 2);
      for (let i = 0; i < NODES.length; i++) {
        px[i] = padX + NODES[i].x * innerW;
        py[i] = padY + NODES[i].y * innerH;
      }
    };

    // --- hover ------------------------------------------------------------
    const updateHover = (dt: number | null) => {
      let nearest = -1;
      if (hovering) {
        let best = HOVER_RADIUS * HOVER_RADIUS;
        for (let i = 0; i < NODES.length; i++) {
          const dx = px[i] - hoverX;
          const dy = py[i] - hoverY;
          const d2 = dx * dx + dy * dy;
          if (d2 <= best) {
            best = d2;
            nearest = i;
          }
        }
      }
      nearestNode = nearest;
      const ease = dt === null ? 1 : Math.min(1, dt * 9);
      for (let i = 0; i < NODES.length; i++) {
        const target = i === nearest ? 1 : 0;
        hi[i] += (target - hi[i]) * ease;
      }
    };

    // --- spawning ---------------------------------------------------------
    const spawnPulse = () => {
      for (let i = 0; i < pulses.length; i++) {
        const pulse = pulses[i];
        if (pulse.alive) continue;
        // Bias traffic through the core corridor — Dhaka is the busiest link.
        pulse.edge = Math.random() < 0.55 ? (Math.random() * 6) | 0 : (Math.random() * EDGES.length) | 0;
        pulse.dir = Math.random() < 0.5 ? 1 : -1;
        pulse.t = 0;
        pulse.speed = 0.24 + Math.random() * 0.18;
        pulse.alive = true;
        return;
      }
    };

    const spawnRipple = () => {
      for (let i = 0; i < ripples.length; i++) {
        if (ripples[i].alive) continue;
        ripples[i].t = 0;
        ripples[i].alive = true;
        return;
      }
    };

    // --- captions ---------------------------------------------------------
    const fits = (x: number, y: number, ww: number, hh: number) => {
      for (let k = 0; k < boxCount; k++) {
        if (
          x < boxX[k] + boxW[k] + 2 &&
          x + ww + 2 > boxX[k] &&
          y < boxY[k] + boxH[k] + 1.5 &&
          y + hh + 1.5 > boxY[k]
        ) {
          return false;
        }
      }
      return true;
    };

    const drawCaption = (i: number) => {
      const node = NODES[i];
      const lift = hi[i];
      const br = node.core ? 103 : 203;
      const bg = node.core ? 232 : 213;
      const bb = node.core ? 249 : 225;
      const r = Math.round(br + (214 - br) * lift);
      const g = Math.round(bg + (253 - bg) * lift);
      const b = Math.round(bb + (254 - bb) * lift);
      const a = Math.min(1, (node.core ? 0.95 : 0.8) + 0.2 * lift);
      const text = captions[i];
      // Soft dark halo keeps type legible where filaments run behind it.
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "rgba(2, 6, 23, 0.9)";
      ctx.strokeText(text, capX[i], capY[i]);
      ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
      ctx.fillText(text, capX[i], capY[i]);
    };

    // --- frame ------------------------------------------------------------
    const render = () => {
      ctx.clearRect(0, 0, w, h);
      if (w < 8 || h < 8) return;

      // 1. hairline filaments — slow breathing opacity, cyan lift on hover
      ctx.lineWidth = 1;
      for (let i = 0; i < EDGES.length; i++) {
        const edge = EDGES[i];
        const lift = hi[edge.a] > hi[edge.b] ? hi[edge.a] : hi[edge.b];
        const breathe = 0.5 + 0.5 * Math.sin(time * 0.7 + edge.phase);
        const alpha = Math.min(0.85, 0.13 + 0.07 * breathe + 0.38 * lift);
        const r = Math.round(148 + (34 - 148) * lift);
        const g = Math.round(163 + (211 - 163) * lift);
        const b = Math.round(184 + (238 - 184) * lift);
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(px[edge.a], py[edge.a]);
        ctx.lineTo(px[edge.b], py[edge.b]);
        ctx.stroke();
      }

      // 2. radar-style ping rings from the core node
      const pingMax = Math.min(w, h) * 0.55;
      for (let i = 0; i < ripples.length; i++) {
        const ripple = ripples[i];
        if (!ripple.alive) continue;
        const progress = ripple.t / RIPPLE_LIFE;
        const alpha = (1 - progress) * 0.3;
        if (alpha <= 0.005) continue;
        ctx.strokeStyle = `rgba(34, 211, 238, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px[CORE], py[CORE], 7 + progress * pingMax, 0, TAU);
        ctx.stroke();
      }

      // 3. telemetry packets + their short fading trails
      for (let i = 0; i < pulses.length; i++) {
        const pulse = pulses[i];
        if (!pulse.alive) continue;
        const edge = EDGES[pulse.edge];
        const ax = px[edge.a];
        const ay = py[edge.a];
        const bx = px[edge.b];
        const by = py[edge.b];
        const head = pulse.dir === 1 ? pulse.t : 1 - pulse.t;
        for (let k = 0; k < 3; k++) {
          const tt = head - pulse.dir * 0.05 * k;
          if (tt < 0 || tt > 1) continue;
          const x = ax + (bx - ax) * tt;
          const y = ay + (by - ay) * tt;
          if (k === 0) {
            ctx.fillStyle = "rgba(34, 211, 238, 0.16)";
            ctx.beginPath();
            ctx.arc(x, y, 3.6, 0, TAU);
            ctx.fill();
            ctx.fillStyle = "rgba(165, 243, 252, 0.95)";
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, TAU);
            ctx.fill();
          } else {
            ctx.fillStyle = k === 1 ? "rgba(34, 211, 238, 0.4)" : "rgba(34, 211, 238, 0.18)";
            ctx.beginPath();
            ctx.arc(x, y, k === 1 ? 1.1 : 0.9, 0, TAU);
            ctx.fill();
          }
        }
      }

      // 4. nodes — muted telemetry dots, cyan emitter at the core
      for (let i = 0; i < NODES.length; i++) {
        const node = NODES[i];
        const x = px[i];
        const y = py[i];
        const lift = hi[i];
        const breathe = 0.5 + 0.5 * Math.sin(time * 1.1 + i * 0.9);
        if (node.core) {
          ctx.fillStyle = `rgba(6, 182, 212, ${(0.09 + 0.05 * breathe).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x, y, 9 + 2 * breathe, 0, TAU);
          ctx.fill();
        }
        if (lift > 0.02) {
          ctx.strokeStyle = `rgba(103, 232, 249, ${(0.35 * lift).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 6.5 + 3 * lift, 0, TAU);
          ctx.stroke();
        }
        const radius = (node.core ? 3.4 : 2.3) + lift * 0.8;
        ctx.fillStyle = node.core
          ? "rgba(34, 211, 238, 0.95)"
          : `rgba(226, 232, 240, ${Math.min(1, 0.6 + 0.22 * breathe + 0.35 * lift).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, TAU);
        ctx.fill();
        if (node.core || lift > 0.35) {
          ctx.fillStyle = `rgba(255, 255, 255, ${node.core ? 0.9 : (lift * 0.8).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x - radius * 0.3, y - radius * 0.3, node.core ? 1.2 : 0.9, 0, TAU);
          ctx.fill();
        }
      }

      // 5. captions — measured, clamped inside the box, collision-checked
      const fontSize = w < 190 ? 7.5 : 8.5;
      const capH = fontSize + 2;
      ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      for (let i = 0; i < NODES.length; i++) {
        const node = NODES[i];
        const tw = ctx.measureText(captions[i]).width;
        const maxTx = Math.max(3, w - 3 - tw);
        capX[i] = Math.max(3, Math.min(px[i] - tw / 2, maxTx));
        const dotR = node.core ? 3.4 : 2.3;
        const rawY = node.above ? py[i] - dotR - 4 - fontSize : py[i] + dotR + 4;
        capY[i] = Math.max(2, Math.min(rawY, h - 2 - capH));
        capW[i] = tw;
      }

      boxCount = 0;
      capPlaced.fill(0);
      const place = (i: number, force: boolean) => {
        if (capPlaced[i]) return;
        if (!force && !fits(capX[i], capY[i], capW[i], capH)) return;
        boxX[boxCount] = capX[i];
        boxY[boxCount] = capY[i];
        boxW[boxCount] = capW[i];
        boxH[boxCount] = capH;
        boxCount++;
        capPlaced[i] = 1;
      };

      place(CORE, false);
      if (nearestNode >= 0) place(nearestNode, true);
      for (let i = 0; i < NODES.length; i++) place(i, false);
      for (let i = 0; i < NODES.length; i++) if (capPlaced[i]) drawCaption(i);
      if (nearestNode >= 0) drawCaption(nearestNode);
    };

    // --- simulation --------------------------------------------------------
    const step = (dt: number) => {
      time += dt;
      updateHover(dt);

      spawnTimer += dt;
      while (spawnTimer >= PULSE_SPAWN) {
        spawnTimer -= PULSE_SPAWN;
        spawnPulse();
      }
      rippleTimer += dt;
      if (rippleTimer >= RIPPLE_INTERVAL) {
        rippleTimer -= RIPPLE_INTERVAL;
        spawnRipple();
      }

      for (let i = 0; i < pulses.length; i++) {
        const pulse = pulses[i];
        if (!pulse.alive) continue;
        pulse.t += pulse.speed * dt;
        if (pulse.t >= 1) pulse.alive = false;
      }
      for (let i = 0; i < ripples.length; i++) {
        const ripple = ripples[i];
        if (!ripple.alive) continue;
        ripple.t += dt;
        if (ripple.t >= RIPPLE_LIFE) ripple.alive = false;
      }
    };

    // --- loop control (paused off-screen / reduced motion) ------------------
    const frame = (ts: number) => {
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;
      step(dt);
      render();
      rafId = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || reduceMotion || !inView) return;
      running = true;
      lastTs = performance.now();
      rafId = requestAnimationFrame(frame);
    };

    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(rafId);
    };

    const settle = () => {
      updateHover(null);
      render();
    };

    // --- observers ----------------------------------------------------------
    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              const entry = entries[entries.length - 1];
              inView = entry.isIntersecting;
              if (inView) start();
              else stop();
            },
            { threshold: 0 }
          )
        : null;
    observer?.observe(wrap);
    if (!observer) {
      inView = true;
      start();
    }

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            resize();
            if (!running) render();
          })
        : null;
    resizeObserver?.observe(wrap);
    const onWindowResize = () => {
      resize();
      if (!running) render();
    };
    if (!resizeObserver) window.addEventListener("resize", onWindowResize);

    // --- pointer reactivity ---------------------------------------------------
    const onPointer = (event: PointerEvent) => {
      hoverX = event.offsetX;
      hoverY = event.offsetY;
      hovering = true;
      if (!running) settle();
    };
    const onPointerLeave = () => {
      hovering = false;
      hoverX = -1e4;
      hoverY = -1e4;
      if (!running) settle();
    };
    canvas.addEventListener("pointermove", onPointer, { passive: true });
    canvas.addEventListener("pointerdown", onPointer, { passive: true });
    canvas.addEventListener("pointerleave", onPointerLeave);

    // --- reduced motion --------------------------------------------------------
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotion = motionQuery.matches;
    const onMotionChange = (event: MediaQueryListEvent) => {
      reduceMotion = event.matches;
      if (reduceMotion) {
        stop();
        settle();
      } else if (inView) {
        start();
      }
    };
    motionQuery.addEventListener("change", onMotionChange);

    // --- boot ------------------------------------------------------------------
    resize();
    updateHover(null);
    render();

    return () => {
      stop();
      observer?.disconnect();
      resizeObserver?.disconnect();
      if (!resizeObserver) window.removeEventListener("resize", onWindowResize);
      motionQuery.removeEventListener("change", onMotionChange);
      canvas.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("pointerdown", onPointer);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [isBn]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-baseline justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          {title || t("hero.insight.nodes_title")}
        </p>
        <span className="hidden shrink-0 items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80 min-[460px]:inline-flex">
          <span className="h-1 w-1 rounded-full bg-cyan-400 motion-safe:animate-pulse" aria-hidden="true" />
          {t("hero.insight.nodes_live")}
        </span>
      </div>

      <div ref={wrapRef} className="relative mt-2 min-h-[68px] flex-1">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 block h-full w-full cursor-crosshair"
          role="img"
          aria-label={ariaLabel || title || t("hero.insight.nodes_title")}
        />
      </div>

      <ul className="sr-only">
        {captionsFor(isBn).map((label) => (
          <li key={label}>{label}</li>
        ))}
      </ul>
    </div>
  );
}

/** Screen-reader equivalent of the graph's node list. */
function captionsFor(isBn: boolean): string[] {
  return NODES.map((node) => (isBn ? node.label.bn : node.label.en));
}
