// ============================================================
// LensWorldTelemetry — "LENS × Global Narrative Network"
//
// Cinematic "Geopolitical Research Observatory" rendered with a
// single lightweight HTML5 Canvas 2D context (no 3D / animation
// libraries, no external assets):
//
//   • World layer — muted slate/navy continent landmasses
//     (dot-matrix coastline texture), lat/long graticule and an
//     elliptical globe outline.
//   • LENS optical HUD — dual concentric calibration rings,
//     locked crosshair, 15° camera focus ticks, focal boundary
//     ring and perimeter telemetry micro-text (LAT / LON /
//     SYSTEM / OPTICAL ZOOM / FOCAL MODE / GLOBAL HUBS / STATUS).
//   • Narrative network — seven labelled hub nodes plotted from
//     real coordinates, quadratic-bezier narrative corridors
//     from the Dhaka Prime Node with slow sine-wave opacity,
//     glowing cyan telemetry packets with fading trails, and a
//     radar pulse expanding from Dhaka every 3–4 seconds.
//   • Interaction — easing camera-parallax drift under a locked
//     reticle, 30 px nearest-node detection, active-route
//     highlighting and an elegant canvas-drawn tooltip card.
//   • Lifecycle — DPR 2 (capped) for Retina crispness,
//     IntersectionObserver pauses the loop off-screen (zero CPU
//     when not visible), ResizeObserver handles resizes.
// ============================================================
"use client";

import { useEffect, useRef } from "react";

const TAU = Math.PI * 2;
const MAX_DPR = 2;
const PLOT_PAD = 36;
const RETICLE_RADIUS = 0.40;
const ANGLE_STEP = (15 * Math.PI) / 180; // focal angle markers every 15°
const CORE_INDEX = 0; // Dhaka Prime Node is the optical origin

const COLOUR = {
  bg: "#0B132B",
  land: "#1E293B",
  landMuted: "#334155",
  coast: "#475569",
  graticule: "#1E293B",
  globe: "#334155",
  node: "#F1F5F9",
  nodeCore: "#22D3EE",
  packet: "#06B6D4",
  packetGlow: "#22D3EE",
  packetCore: "#EFFFFF",
  ping: "#22D3EE",
  reticle: "30, 41, 59", // slate-700 rgb
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  status: "34, 197, 94", // emerald-500 rgb
} as const;

type Node = {
  id: string;
  label: string;
  role: string;
  lat: number;
  lon: number;
  /** Dhaka is the focal / prime node. */
  core: boolean;
  /** Hand-tuned callsign placement, tuned against the reference render. */
  placement: "above" | "below" | "left" | "right";
};

const NODES: ReadonlyArray<Node> = [
  { id: "dhaka", label: "DHAKA PRIME NODE", role: "CORE NODE", lat: 23.8103, lon: 90.4125, core: true, placement: "right" },
  { id: "london", label: "LONDON", role: "NARRATIVE HUB", lat: 51.5074, lon: -0.1278, core: false, placement: "above" },
  { id: "geneva", label: "GENEVA", role: "NARRATIVE HUB", lat: 46.2044, lon: 6.1432, core: false, placement: "left" },
  { id: "new-york", label: "NEW YORK", role: "NARRATIVE HUB", lat: 40.7128, lon: -74.006, core: false, placement: "left" },
  { id: "nairobi", label: "NAIROBI", role: "NARRATIVE HUB", lat: -1.2921, lon: 36.8219, core: false, placement: "left" },
  { id: "tokyo", label: "TOKYO", role: "NARRATIVE HUB", lat: 35.6762, lon: 139.6503, core: false, placement: "right" },
  { id: "singapore", label: "SINGAPORE", role: "NARRATIVE HUB", lat: 1.3521, lon: 103.8198, core: false, placement: "right" },
];

/** Every narrative hub links back to the Dhaka Prime Node. */
const LINKS: ReadonlyArray<number> = NODES
  .map((_, index) => index)
  .filter((index) => index !== CORE_INDEX);

const MAX_PACKETS = 14;
const MAX_PINGS = 3;
const PACKET_SPAWN = 0.30; // seconds between telemetry packets
const PING_MIN = 3.0; // seconds between focal radar pulses
const PING_MAX = 4.2;
const PING_LIFE = 3.0; // seconds a ping ring takes to reach the outer rings
const HOVER_RADIUS = 30; // px — nearest-node detection radius
const PARALLAX_STRENGTH = 0.016;
const PARALLAX_LIMIT = 24;

const LATITUDE_LABELS = [-60, -30, 0, 30, 60];
const LONGITUDE_LABELS = [-180, -120, -60, 0, 60, 120, 180];

/** Equirectangular world landmass rings (lat, lon), simplified but recognisable. */
type Ring = ReadonlyArray<[number, number]>;
const CONTINENTS: ReadonlyArray<Ring> = [
  // AFRICA
  [
    [37.2, -8.7], [35.8, -5.4], [31.5, -9.8], [27.5, -13.5], [22.5, -17.0], [16.5, -17.0], [11.0, -17.5],
    [7.0, -16.0], [4.5, -16.5], [0, -17.5], [-6, -16], [-13, -15], [-17.5, -11.5], [-22.5, -14],
    [-28, -17], [-34.5, -20], [-35, -22.5], [-34.8, -26.5], [-34.5, -29], [-30.5, -27],
    [-25.5, -22], [-22, -14], [-17, -11.5], [-15, -11], [-12.5, -9.5], [-8, -9], [-4, -4],
    [0, 3.5], [5, 11], [9, 17], [12, 23], [15, 24], [21, 25], [25, 29], [30, 33], [31.5, 34.5],
    [33, 35.5], [31.5, 25], [29, 20], [26, 14], [23.5, 9.5], [22, 5.5], [21, 0], [20, -5],
    [22.5, -8.5], [25, -11], [27, -13], [29.5, -14], [31, -10], [33, -5], [35.5, -4], [37.2, -5.5],
  ],
  // EUROPE (mainland)
  [
    [36, -9], [43.5, -3], [48.5, -2], [51, 0], [55.8, -4.5], [58.5, -3], [60, 5], [63, 8], [66, 12],
    [70, 26], [70, 31], [65, 40], [55, 38], [52, 33], [47, 28], [44, 22], [41, 19], [39, 17],
    [36, 12.5], [36, -6], [40, -8],
  ],
  // EUROPE (British Isles)
  [
    [51.5, -7.5], [55.5, -8], [58, -6], [58.5, -3], [57, 0.5], [54, 1], [51, -1.5], [50.5, -4.5], [51.5, -7.5],
  ],
  // ASIA (greater landmass sweep: Russia → Pacific → SE Asia → India)
  [
    [45, 38], [48, 52], [55, 65], [62, 80], [68, 95], [72, 110], [76, 130], [74, 150], [72, 160],
    [70, 175], [65, 178], [60, 170], [52, 160], [45, 150], [42, 145], [38, 142], [30, 140],
    [20, 140], [10, 137], [5, 132], [0, 128], [-5, 128], [-10, 122], [-8, 115], [-5, 108],
    [0, 105], [5, 103], [7, 100], [10, 95], [15, 90], [18, 85], [22, 82], [25, 80], [28.5, 77],
    [32, 75], [30, 71], [27, 67], [24, 61], [23, 58], [25, 56], [30, 51], [33, 48], [35, 45],
    [38, 41], [40.5, 36], [42, 33], [41, 29], [40, 26], [38, 32], [45, 38],
  ],
  // ASIA (Arabian Peninsula)
  [
    [30, 35], [25, 40], [23, 52], [25, 56], [27, 60], [29, 50], [30, 42], [30, 35],
  ],
  // NORTH AMERICA
  [
    [72, -130], [68, -140], [60, -135], [50, -125], [45, -120], [40, -110], [35, -105], [30, -100],
    [25, -100], [22, -102], [18, -96], [15, -90], [12, -86], [8, -83], [7, -80], [15, -75],
    [22, -80], [30, -83], [35, -80], [42, -75], [46, -70], [50, -65], [56, -60], [62, -55],
    [68, -55], [72, -58], [72, -130],
  ],
  // SOUTH AMERICA
  [
    [12, -81], [10, -74], [6, -74], [2, -70], [-2, -60], [-8, -58], [-13, -56], [-17, -52],
    [-22, -47], [-27, -47], [-30, -51], [-34, -53], [-38, -57], [-43, -63], [-47, -66],
    [-52, -68], [-55, -67], [-54, -63], [-48, -59], [-42, -58], [-35, -56], [-25, -50],
    [-18, -45], [-10, -40], [-3, -37], [3, -38], [8, -43], [11, -50], [12, -62], [12, -75], [12, -81],
  ],
];

type Pulse = { link: number; t: number; speed: number; alive: boolean };
type Ping = { t: number; alive: boolean };

const clampValue = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const formatCoord = (value: number, pos: string, neg: string): string => {
  const abs = Math.abs(value).toFixed(4);
  return `${abs}° ${value >= 0 ? pos : neg}`;
};

export default function LensWorldTelemetry() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let plotX = 0;
    let plotY = 0;
    let plotW = 0;
    let plotH = 0;
    const px = new Float64Array(NODES.length);
    const py = new Float64Array(NODES.length);
    const hi = new Float64Array(NODES.length); // eased hover lift 0..1
    let stipple = new Float64Array(0); // cached land dot-matrix (projected px)
    const pulses: Pulse[] = Array.from({ length: MAX_PACKETS }, () => ({
      link: 0,
      t: 0,
      speed: 0,
      alive: false,
    }));
    const pings: Ping[] = Array.from({ length: MAX_PINGS }, () => ({ t: 0, alive: false }));

    let time = 0;
    let packetTimer = 0;
    let pingTimer = PING_MIN + Math.random() * (PING_MAX - PING_MIN);
    let hoverX = -1e4;
    let hoverY = -1e4;
    let hovering = false;
    let nearestNode = -1;
    let running = false;
    let inView = false;
    let reduceMotion = false;
    let rafId = 0;
    let lastTs = 0;
    let parallaxX = 0;
    let parallaxY = 0;
    let targetParallaxX = 0;
    let targetParallaxY = 0;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const cw = Math.round(rect.width);
      const ch = Math.round(rect.height);
      if (cw < 8 || ch < 8) return;
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const bw = Math.round(cw * dpr);
      const bh = Math.round(ch * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      w = cw;
      h = ch;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const padX = Math.min(PLOT_PAD, w * 0.07);
      const padY = Math.min(PLOT_PAD, h * 0.07);
      plotX = padX;
      plotY = padY;
      plotW = Math.max(1, w - padX * 2);
      plotH = Math.max(1, h - padY * 2);
      placeNodes();
      buildStipple();
    };

    /** Equirectangular projection: (0,0) top-left, north at top. */
    const project = (lat: number, lon: number): { x: number; y: number } => {
      const u = (lon + 180) / 360;
      const v = (90 - lat) / 180;
      return { x: plotX + u * plotW, y: plotY + v * plotH };
    };

    const placeNodes = () => {
      for (let i = 0; i < NODES.length; i++) {
        const p = project(NODES[i].lat, NODES[i].lon);
        px[i] = p.x;
        py[i] = p.y;
      }
    };

    /**
     * Pre-computes the dot-matrix landmass field. The stipple is built once per
     * resize (not per frame) so the animation loop only blits cached points.
     */
    const buildStipple = () => {
      const spacing = 4;
      // Projected rings in plot space, reused by the even-odd fill test.
      const rings = CONTINENTS.map((ring) =>
        ring.map(([lat, lon]) => project(lat, lon)),
      );
      const isLand = (x: number, y: number) => {
        let inside = false;
        for (let r = 0; r < rings.length; r++) {
          const ring = rings[r];
          for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const xi = ring[i].x;
            const yi = ring[i].y;
            const xj = ring[j].x;
            const yj = ring[j].y;
            if (
              (yi > y) !== (yj > y) &&
              x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
            ) {
              inside = !inside;
            }
          }
        }
        return inside;
      };

      const points: number[] = [];
      for (let y = plotY + 2; y < plotY + plotH; y += spacing) {
        for (let x = plotX + 2; x < plotX + plotW; x += spacing) {
          if (isLand(x, y)) points.push(x, y);
        }
      }
      stipple = new Float64Array(points);
    };

    // --- geometry helpers ----------------------------------------------
    const bezierPoint = (
      t: number,
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
    ): { x: number; y: number } => {
      const k = 1 - t;
      return {
        x: k * k * x0 + 2 * k * t * x1 + t * t * x2,
        y: k * k * y0 + 2 * k * t * y1 + t * t * y2,
      };
    };

    const linkControl = (index: number): { cx: number; cy: number } => {
      const p0 = { x: px[CORE_INDEX], y: py[CORE_INDEX] };
      const p2 = { x: px[index], y: py[index] };
      const mx = (p0.x + p2.x) / 2;
      const my = (p0.y + p2.y) / 2;
      const dx = p2.x - p0.x;
      const dy = p2.y - p0.y;
      const dist = Math.hypot(dx, dy);
      const nx = -dy / dist;
      const ny = dx / dist;
      const height = clampValue(dist * 0.45, 30, 120);
      return { cx: mx + nx * height, cy: my + ny * height };
    };

    // --- hover / focus ---------------------------------------------------
    const updateHover = (dt: number | null) => {
      let nearest = -1;
      if (hovering) {
        let best = HOVER_RADIUS * HOVER_RADIUS;
        for (let i = 0; i < NODES.length; i++) {
          const dx = px[i] + parallaxX - hoverX;
          const dy = py[i] + parallaxY - hoverY;
          const d2 = dx * dx + dy * dy;
          if (d2 <= best) {
            best = d2;
            nearest = i;
          }
        }
      }
      nearestNode = nearest;
      const ease = dt === null ? 1 : Math.min(1, Math.max(0, dt * 10));
      for (let i = 0; i < NODES.length; i++) {
        const target = i === nearest ? 1 : 0;
        hi[i] += (target - hi[i]) * ease;
      }
    };

    // --- spawning --------------------------------------------------------
    const spawnPacket = () => {
      const link = LINKS[(Math.random() * LINKS.length) | 0];
      for (let i = 0; i < pulses.length; i++) {
        if (pulses[i].alive) continue;
        pulses[i] = { link, t: 0, speed: 0.22 + Math.random() * 0.22, alive: true };
        return;
      }
    };

    const spawnPing = () => {
      for (let i = 0; i < pings.length; i++) {
        if (pings[i].alive) continue;
        pings[i] = { t: 0, alive: true };
        return;
      }
    };

    // --- draw: world landmasses ------------------------------------------
    const drawWorld = () => {
      // A whisper of body under the stipple keeps coastlines readable while
      // the dot-matrix texture stays the dominant visual (reference render).
      ctx.fillStyle = "rgba(51, 65, 85, 0.20)";
      for (const ring of CONTINENTS) {
        ctx.beginPath();
        const [firstLat, firstLon] = ring[0];
        const p0 = project(firstLat, firstLon);
        ctx.moveTo(p0.x + parallaxX, p0.y + parallaxY);
        for (let i = 1; i < ring.length; i++) {
          const p = project(ring[i][0], ring[i][1]);
          ctx.lineTo(p.x + parallaxX, p.y + parallaxY);
        }
        ctx.closePath();
        ctx.fill();
      }

      // Cached dot-matrix landmass field (drifts with the camera parallax).
      ctx.fillStyle = "rgba(125, 145, 170, 0.60)";
      for (let i = 0; i < stipple.length; i += 2) {
        ctx.fillRect(stipple[i] + parallaxX, stipple[i + 1] + parallaxY, 0.9, 0.9);
      }

      // Coastline hairlines.
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = `rgba(${COLOUR.reticle}, 0.24)`;
      ctx.setLineDash([3, 5]);
      for (const ring of CONTINENTS) {
        ctx.beginPath();
        const [firstLat, firstLon] = ring[0];
        const p0 = project(firstLat, firstLon);
        ctx.moveTo(p0.x + parallaxX, p0.y + parallaxY);
        for (let i = 1; i < ring.length; i++) {
          const p = project(ring[i][0], ring[i][1]);
          ctx.lineTo(p.x + parallaxX, p.y + parallaxY);
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Graticule — meridians and parallels.
      ctx.lineWidth = 0.5;
      for (const lon of LONGITUDE_LABELS) {
        const u = (lon + 180) / 360;
        const x = plotX + u * plotW + parallaxX;
        ctx.strokeStyle = `rgba(${COLOUR.reticle}, 0.08)`;
        ctx.beginPath();
        ctx.moveTo(x, plotY + parallaxY);
        ctx.lineTo(x, plotY + plotH + parallaxY);
        ctx.stroke();
      }
      for (const lat of LATITUDE_LABELS) {
        const v = (90 - lat) / 180;
        const y = plotY + v * plotH + parallaxY;
        ctx.strokeStyle = `rgba(${COLOUR.reticle}, 0.08)`;
        ctx.beginPath();
        ctx.moveTo(plotX + parallaxX, y);
        ctx.lineTo(plotX + plotW + parallaxX, y);
        ctx.stroke();
      }

      // Elliptical globe outline + plot frame.
      ctx.save();
      ctx.translate(w / 2 + parallaxX, h / 2 + parallaxY);
      ctx.scale(1, plotH / plotW);
      ctx.strokeStyle = `rgba(${COLOUR.globe}, 0.22)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, plotW * 0.49, 0, TAU);
      ctx.stroke();
      ctx.restore();

      ctx.strokeStyle = `rgba(${COLOUR.globe}, 0.30)`;
      ctx.strokeRect(plotX + parallaxX, plotY + parallaxY, plotW, plotH);
    };

    // --- draw: narrative corridors ---------------------------------------
    const drawFilaments = () => {
      const breathe = 0.5 + 0.5 * Math.sin(time * 0.55);
      for (let i = 0; i < LINKS.length; i++) {
        const index = LINKS[i];
        const active = nearestNode === index;
        const lift = hi[index];
        const wave = 0.55 + 0.45 * Math.sin(time * 0.7 + i * 1.7);
        const alpha = Math.min(
          0.70,
          0.16 + 0.22 * wave + 0.35 * breathe * lift + (active ? 0.30 : 0),
        );
        const r = Math.round(148 - 40 * lift);
        const g = Math.round(180 + 20 * lift);
        const b = Math.round(200 + 20 * lift);
        const c = linkControl(index);

        const path = new Path2D();
        path.moveTo(px[CORE_INDEX] + parallaxX, py[CORE_INDEX] + parallaxY);
        path.quadraticCurveTo(
          c.cx + parallaxX,
          c.cy + parallaxY,
          px[index] + parallaxX,
          py[index] + parallaxY,
        );

        // Soft optical bloom under the hairline corridor.
        ctx.lineWidth = 3.4;
        ctx.strokeStyle = `rgba(${r},${g},${b},${(alpha * 0.20).toFixed(3)})`;
        ctx.stroke(path);
        // Crisp narrative filament.
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
        ctx.stroke(path);
      }
    };

    // --- draw: radar pings -----------------------------------------------
    const drawPings = () => {
      const maxR = Math.min(w, h) * 0.62;
      for (let i = 0; i < pings.length; i++) {
        const ping = pings[i];
        if (!ping.alive) continue;
        const progress = Math.max(0, Math.min(1, ping.t / PING_LIFE));
        const alpha = (1 - progress) * 0.45;
        if (alpha <= 0.006) continue;
        const radius = Math.max(0.5, progress * maxR);
        ctx.strokeStyle = `rgba(34, 211, 238, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(px[CORE_INDEX] + parallaxX, py[CORE_INDEX] + parallaxY, radius, 0, TAU);
        ctx.stroke();
      }
    };

    // --- draw: telemetry packets -----------------------------------------
    const drawPackets = () => {
      for (let i = 0; i < pulses.length; i++) {
        const pulse = pulses[i];
        if (!pulse.alive) continue;
        const index = pulse.link;
        const head = Math.min(1, pulse.t);
        const c = linkControl(index);
        const sample = (tt: number) =>
          bezierPoint(
            tt,
            px[CORE_INDEX] + parallaxX,
            py[CORE_INDEX] + parallaxY,
            c.cx + parallaxX,
            c.cy + parallaxY,
            px[index] + parallaxX,
            py[index] + parallaxY,
          );
        const headP = sample(head);

        // Fading trail.
        for (let k = 1; k <= 4; k++) {
          const tt = head - 0.05 * k;
          if (tt < 0 || tt > 1) continue;
          const p = sample(tt);
          const a = (1 - k / 5) * 0.45;
          ctx.fillStyle = `rgba(6, 182, 212, ${a.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.4, 1.4 - k * 0.3), 0, TAU);
          ctx.fill();
        }

        // Glowing head.
        const glow = 0.35 + 0.25 * Math.sin(time * 12 + i);
        ctx.fillStyle = `rgba(34, 211, 238, ${glow.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(headP.x, headP.y, 3.6, 0, TAU);
        ctx.fill();
        ctx.fillStyle = COLOUR.packet;
        ctx.beginPath();
        ctx.arc(headP.x, headP.y, 1.8, 0, TAU);
        ctx.fill();
        ctx.fillStyle = COLOUR.packetCore;
        ctx.beginPath();
        ctx.arc(headP.x, headP.y, 0.7, 0, TAU);
        ctx.fill();
      }
    };

    // --- draw: nodes -----------------------------------------------------
    const drawNodes = () => {
      const breathe = 0.5 + 0.5 * Math.sin(time * 1.0);
      for (let i = 0; i < NODES.length; i++) {
        const node = NODES[i];
        const x = px[i] + parallaxX;
        const y = py[i] + parallaxY;
        const lift = hi[i];

        if (node.core) {
          ctx.fillStyle = `rgba(34, 211, 238, ${(0.10 + 0.05 * breathe).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x, y, 12 + 3 * breathe, 0, TAU);
          ctx.fill();
        }
        if (lift > 0.02) {
          ctx.strokeStyle = `rgba(34, 211, 238, ${(0.45 * lift).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 8 + 4 * lift, 0, TAU);
          ctx.stroke();
        }

        const radius = (node.core ? 2.6 : 1.7) + lift * 0.7;
        ctx.fillStyle = node.core
          ? COLOUR.nodeCore
          : `rgba(226, 232, 240, ${Math.min(1, 0.6 + 0.25 * breathe + 0.4 * lift).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, TAU);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 255, 255, ${node.core ? 0.9 : 0.6})`;
        ctx.beginPath();
        ctx.arc(x - radius * 0.35, y - radius * 0.35, node.core ? 0.9 : 0.6, 0, TAU);
        ctx.fill();
      }
    };

    const FONT = "600 10px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

    const drawNodeLabels = () => {
      // Slightly tighter type keeps callsigns collision-free on small canvases.
      ctx.font = w < 430
        ? "700 8.5px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
        : FONT;
      ctx.textBaseline = "middle";

      const drawLine = (
        text: string,
        tx: number,
        ty: number,
        align: CanvasTextAlign,
        color: string,
      ) => {
        ctx.save();
        ctx.textAlign = align;
        ctx.lineWidth = 2.6;
        ctx.strokeStyle = "rgba(11, 19, 43, 0.85)";
        ctx.strokeText(text, tx, ty);
        ctx.restore();
        ctx.fillStyle = color;
        ctx.fillText(text, tx, ty);
      };

      for (let i = 0; i < NODES.length; i++) {
        const node = NODES[i];
        const lift = hi[i];
        const x = px[i] + parallaxX;
        const y = py[i] + parallaxY;
        const lines = node.core ? ["DHAKA", "PRIME NODE"] : [node.label];
        const emphasis = node.core ? 1 : Math.min(1, 0.62 + 0.38 * lift);

        let widest = 0;
        for (const line of lines) {
          widest = Math.max(widest, ctx.measureText(line).width);
        }

        let align: CanvasTextAlign = "center";
        let tx = x;
        let ty = y;

        switch (node.placement) {
          case "above":
            ty = y - 11;
            break;
          case "below":
            ty = y + 14;
            break;
          case "left":
            align = "right";
            tx = x - 9;
            break;
          case "right":
          default:
            align = "left";
            tx = x + 9;
            break;
        }

        // Keep every callsign inside the frame, flipping sides when needed.
        if (align === "left" && tx + widest > w - 8) {
          tx = x - 9;
          align = "right";
        }
        if (align === "right" && tx - widest < 8) {
          tx = x + 9;
          align = "left";
        }
        if (align === "center") {
          tx = clampValue(x, 8 + widest / 2, Math.max(8 + widest / 2, w - 8 - widest / 2));
        }
        if (ty < 16) ty = y + 15;
        if (ty > h - 16) ty = y - 15;

        const lineHeight = 11;
        const firstTy = node.core
          ? ty - (lines.length - 1) * (lineHeight / 2)
          : ty;

        const color = node.core
          ? COLOUR.nodeCore
          : `rgba(226, 232, 240, ${emphasis.toFixed(3)})`;

        for (let l = 0; l < lines.length; l++) {
          drawLine(lines[l], tx, firstTy + l * lineHeight, align, color);
        }
      }
    };

    // --- draw: optical reticle -------------------------------------------
    const drawReticle = () => {
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * RETICLE_RADIUS;
      ctx.lineWidth = 1;

      // Crosshair hairlines (locked to center — reticle never drifts).
      ctx.strokeStyle = `rgba(${COLOUR.reticle}, 0.35)`;
      ctx.beginPath();
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx + r, cy);
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx, cy + r);
      ctx.stroke();

      // Dual concentric calibration rings.
      ctx.strokeStyle = `rgba(${COLOUR.reticle}, 0.18)`;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.5, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = `rgba(${COLOUR.reticle}, 0.34)`;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.88, 0, TAU);
      ctx.stroke();

      // Focal boundary ring.
      ctx.strokeStyle = `rgba(${COLOUR.reticle}, 0.14)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.stroke();
      ctx.lineWidth = 1;

      // 15° camera focus ticks (pure geometry — no numeric clutter inside
      // the HUD envelope, matching the reference viewfinder).
      for (let a = 0; a < TAU; a += ANGLE_STEP) {
        const isCardinal = a % (Math.PI / 2) < 0.0001;
        const len = isCardinal ? 14 : 7;
        const x1 = cx + Math.cos(a) * (r - len);
        const y1 = cy + Math.sin(a) * (r - len);
        const x2 = cx + Math.cos(a) * (r + len);
        const y2 = cy + Math.sin(a) * (r + len);
        ctx.strokeStyle = `rgba(${COLOUR.reticle}, ${(isCardinal ? 0.45 : 0.15).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };

    // --- draw: perimeter telemetry micro-text ----------------------------
    const drawPerimeterLabels = () => {
      const inset = 18;
      const topY = inset;
      const lineGap = 13;
      const compact = w < 520;

      ctx.font = FONT;
      ctx.textBaseline = "top";

      // Top-left — focal coordinates framed like a camera readout.
      ctx.textAlign = "left";
      ctx.fillStyle = COLOUR.text;
      ctx.fillText(
        compact ? "LAT 23.8103° N" : "LAT 23.8103° N  //  LON 90.4125° E",
        inset,
        topY,
      );
      ctx.fillStyle = COLOUR.textMuted;
      ctx.fillText("(Dhaka)", inset, topY + lineGap);

      // Top-right — system identity.
      ctx.textAlign = "right";
      ctx.fillStyle = COLOUR.textMuted;
      ctx.fillText(
        compact ? "LON 90.4125° E" : "SYSTEM: LENS NARRATIVE OBSERVER",
        w - inset,
        topY,
      );

      // Bottom-left — mode + hub count.
      const bottomY = h - inset - lineGap * 2;
      ctx.textAlign = "left";
      ctx.fillStyle = COLOUR.textMuted;
      ctx.fillText("FOCAL MODE: NARRATIVE", inset, bottomY);
      ctx.fillText("GLOBAL HUBS: 7 ACTIVE", inset, bottomY + lineGap);

      // Bottom-right — optical zoom + live status with pulsing emerald dot.
      ctx.textAlign = "right";
      ctx.fillStyle = COLOUR.textMuted;
      ctx.fillText("OPTICAL ZOOM: 1.0x", w - inset, bottomY);

      const statusText = "STATUS: LIVE";
      const statusDot = 2.4 + 1.2 * (0.5 + 0.5 * Math.sin(time * 4));
      const statusAlpha = 0.65 + 0.35 * (0.5 + 0.5 * Math.sin(time * 4));
      ctx.fillStyle = COLOUR.text;
      ctx.fillText(statusText, w - inset - statusDot * 2 - 5, bottomY + lineGap);

      ctx.fillStyle = `rgba(${COLOUR.status}, ${statusAlpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(w - inset - statusDot, bottomY + lineGap + 4.5, statusDot, 0, TAU);
      ctx.fill();
    };

    // --- draw: hover tooltip card ----------------------------------------
    const drawTooltip = () => {
      if (nearestNode < 0) return;
      const node = NODES[nearestNode];
      const x = px[nearestNode] + parallaxX;
      const y = py[nearestNode] + parallaxY;

      ctx.font = "700 10.5px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      const title = node.label;
      const sub = node.role;
      const coord = `${formatCoord(node.lat, "N", "S")} · ${formatCoord(node.lon, "E", "W")}`;
      ctx.font = "700 7.5px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      const tw = Math.max(ctx.measureText(title).width, ctx.measureText(sub).width, ctx.measureText(coord).width);

      const pad = 10;
      const cardW = tw + pad * 2 + 6;
      const cardH = 42;

      let cardX = x + 16;
      let cardY = y + 16;
      if (cardX + cardW > w - 8) cardX = x - 16 - cardW;
      if (cardY + cardH > h - 8) cardY = y - 16 - cardH;
      if (cardX < 8) cardX = 8;
      if (cardY < 8) cardY = 8;

      // Card background.
      ctx.save();
      ctx.translate(cardX, cardY);
      ctx.beginPath();
      ctx.roundRect(0, 0, cardW, cardH, 7);
      ctx.fillStyle = "rgba(11, 19, 43, 0.90)";
      ctx.fill();
      ctx.strokeStyle = `rgba(34, 211, 238, 0.35)`;
      ctx.lineWidth = 1;
      ctx.stroke();
      // Accent hairline.
      ctx.fillStyle = node.core ? COLOUR.nodeCore : COLOUR.packet;
      ctx.fillRect(0, 0, 2, cardH);
      ctx.restore();

      // Pointer triangle to node.
      const ty = y;
      const px0 = Math.max(cardX, Math.min(x, cardX + cardW));
      const py0 = Math.max(cardY, Math.min(ty, cardY + cardH));
      ctx.beginPath();
      ctx.moveTo(px0, py0);
      ctx.lineTo(px0 - 6, py0 - 6);
      ctx.lineTo(px0 + 6, py0 - 6);
      ctx.fillStyle = "rgba(11, 19, 43, 0.90)";
      ctx.fill();

      // Card text.
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      const innerX = cardX + 14;
      const titleY = cardY + 14;
      ctx.fillStyle = node.core ? COLOUR.nodeCore : COLOUR.text;
      ctx.font = "700 10.5px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.fillText(title, innerX, titleY);
      ctx.font = "700 7.5px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.fillStyle = COLOUR.textMuted;
      ctx.fillText(sub, innerX, titleY + 12);
      ctx.fillText(coord, innerX, titleY + 24);

      // Tiny active pulse dot beside title.
      const pulseAlpha = 0.5 + 0.5 * Math.sin(time * 5);
      ctx.fillStyle = `rgba(34, 211, 238, ${pulseAlpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(cardX + 7, titleY - 2, 2.2, 0, TAU);
      ctx.fill();
    };

    // --- frame -----------------------------------------------------------
    const render = () => {
      ctx.clearRect(0, 0, w, h);
      if (w < 8 || h < 8) return;

      ctx.fillStyle = COLOUR.bg;
      ctx.fillRect(0, 0, w, h);

      drawWorld();
      drawFilaments();
      drawPings();
      drawPackets();
      drawNodes();
      if (!reduceMotion) {
        drawReticle();
      }
      drawNodeLabels();
      drawPerimeterLabels();
      drawTooltip();
    };

    // --- simulation ------------------------------------------------------
    const step = (dt: number) => {
      time += dt;
      parallaxX += (targetParallaxX - parallaxX) * 0.14;
      parallaxY += (targetParallaxY - parallaxY) * 0.14;
      updateHover(dt);

      packetTimer += dt;
      while (packetTimer >= PACKET_SPAWN) {
        packetTimer -= PACKET_SPAWN;
        spawnPacket();
      }
      pingTimer += dt;
      if (pingTimer >= PING_MIN + Math.random() * (PING_MAX - PING_MIN)) {
        pingTimer = 0;
        spawnPing();
      }

      for (let i = 0; i < pulses.length; i++) {
        const pulse = pulses[i];
        if (!pulse.alive) continue;
        pulse.t += pulse.speed * dt;
        if (pulse.t >= 1) pulse.alive = false;
      }
      for (let i = 0; i < pings.length; i++) {
        const ping = pings[i];
        if (!ping.alive) continue;
        ping.t += dt;
        if (ping.t >= PING_LIFE) ping.alive = false;
      }    };

    // --- loop control (paused off-screen / reduced motion) ---------------
    const frame = (ts: number) => {
      // A requestAnimationFrame timestamp can predate the performance.now()
      // captured in start(); clamp so animation state never runs backwards.
      const dt = Math.max(0, Math.min((ts - lastTs) / 1000, 0.05));
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

    // --- observers -------------------------------------------------------
    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              const entry = entries[entries.length - 1];
              inView = entry.isIntersecting;
              if (inView) start();
              else stop();
            },
            { threshold: 0 },
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

    // --- pointer reactivity ----------------------------------------------
    const onPointer = (event: PointerEvent) => {
      hoverX = event.offsetX;
      hoverY = event.offsetY;
      hovering = true;
      targetParallaxX = clampValue(
        (event.offsetX - w / 2) * PARALLAX_STRENGTH,
        -PARALLAX_LIMIT,
        PARALLAX_LIMIT,
      );
      targetParallaxY = clampValue(
        (event.offsetY - h / 2) * PARALLAX_STRENGTH,
        -PARALLAX_LIMIT,
        PARALLAX_LIMIT,
      );
      if (!running) settle();
    };
    const onPointerLeave = () => {
      hovering = false;
      hoverX = -1e4;
      hoverY = -1e4;
      targetParallaxX = 0;
      targetParallaxY = 0;
      if (!running) settle();
    };
    canvas.addEventListener("pointermove", onPointer, { passive: true });
    canvas.addEventListener("pointerdown", onPointer, { passive: true });
    canvas.addEventListener("pointerleave", onPointerLeave);

    // --- reduced motion --------------------------------------------------
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

    // --- boot ------------------------------------------------------------
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
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-full"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full cursor-crosshair"
        role="img"
        aria-label="LENS world telemetry network — Dhaka Prime Node linked to London, Geneva, New York, Nairobi, Singapore and Tokyo"
      />
    </div>
  );
}
