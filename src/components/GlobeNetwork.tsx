"use client";

import { useRef, useMemo, useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { isScrollActive, subscribeScrollActivity } from "@/lib/scroll-activity";

const subscribeWindowResize = (callback: () => void) => {
  window.addEventListener("resize", callback, { passive: true });
  return () => window.removeEventListener("resize", callback);
};

const subscribeReducedMotion = (callback: () => void) => {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
};

const useMounted = () => {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
};

const useIsMobile = () => {
  return useSyncExternalStore(
    subscribeWindowResize,
    () => window.innerWidth < 768,
    () => false
  );
};

const useReducedMotion = () => {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
};

function seededRandom(seed: number) {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// Convert latitude and longitude to 3D Cartesian coordinates on a sphere
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// ============================================================
// Procedural Equirectangular Earth Texture Generators
// Self-contained, zero external asset dependencies, instant load.
// ============================================================

// 1. Realistic Day Texture (Oceans, detailed continental landmasses, biomes, ice caps)
function createEarthDayCanvas(): HTMLCanvasElement {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Ocean base: deep abyssal navy to vibrant oceanic blue with latitude gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
  oceanGrad.addColorStop(0.0, "#030d1e"); // North pole dark waters
  oceanGrad.addColorStop(0.18, "#061833");
  oceanGrad.addColorStop(0.5, "#0b2c56"); // Equatorial deep blue
  oceanGrad.addColorStop(0.82, "#061833");
  oceanGrad.addColorStop(1.0, "#030d1e"); // South pole waters
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle ocean bathymetric current textures
  ctx.fillStyle = "rgba(14, 60, 110, 0.25)";
  for (let i = 0; i < 40; i++) {
    const cy = seededRandom(i * 3 + 1) * h;
    const cx = seededRandom(i * 3 + 2) * w;
    const cr = 40 + seededRandom(i * 3 + 3) * 120;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();
  }

  const toXY = (lon: number, lat: number): [number, number] => [
    ((lon + 180) / 360) * w,
    ((90 - lat) / 180) * h,
  ];

  const drawPoly = (points: [number, number][], fill: string, shelf = true) => {
    if (points.length < 3) return;
    const mapped = points.map(([lon, lat]) => toXY(lon, lat));

    // Continental shelf shallow waters glow
    if (shelf) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(mapped[0][0], mapped[0][1]);
      for (let i = 1; i < mapped.length; i++) ctx.lineTo(mapped[i][0], mapped[i][1]);
      ctx.closePath();
      ctx.strokeStyle = "rgba(14, 116, 144, 0.4)";
      ctx.lineWidth = 14;
      ctx.lineJoin = "round";
      ctx.stroke();

      ctx.strokeStyle = "rgba(6, 182, 212, 0.25)";
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.restore();
    }

    // Landmass fill
    ctx.beginPath();
    ctx.moveTo(mapped[0][0], mapped[0][1]);
    for (let i = 1; i < mapped.length; i++) ctx.lineTo(mapped[i][0], mapped[i][1]);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };

  // --- Continents Definition ---

  // North America & Central America
  drawPoly([
    [-168, 65], [-162, 60], [-150, 59], [-140, 60], [-132, 54], [-124, 48],
    [-122, 38], [-117, 32], [-110, 24], [-105, 20], [-96, 16], [-90, 14],
    [-84, 9], [-78, 8], [-80, 9], [-85, 11], [-88, 15], [-90, 20],
    [-97, 22], [-97, 28], [-92, 30], [-84, 30], [-81, 25], [-80, 26],
    [-81, 31], [-75, 35], [-73, 40], [-68, 44], [-60, 46], [-53, 48],
    [-56, 52], [-62, 58], [-75, 62], [-82, 53], [-92, 53], [-94, 61],
    [-105, 68], [-125, 70], [-140, 69], [-155, 71], [-168, 65]
  ], "#224c2b");

  // South America
  drawPoly([
    [-77, 8], [-72, 12], [-62, 10], [-50, 2], [-42, -2], [-35, -6],
    [-36, -10], [-39, -17], [-42, -23], [-50, -30], [-56, -35], [-65, -42],
    [-66, -50], [-68, -55], [-74, -52], [-74, -44], [-71, -30], [-70, -18],
    [-77, -10], [-81, -5], [-79, 1], [-77, 8]
  ], "#1e4426");

  // Europe & Scandinavia
  drawPoly([
    [-9, 37], [-9, 43], [-1, 44], [3, 43], [7, 44], [10, 44], [14, 40],
    [16, 41], [19, 40], [24, 38], [28, 41], [28, 46], [22, 45], [14, 46],
    [8, 48], [4, 52], [8, 55], [10, 58], [5, 62], [14, 66], [24, 70],
    [32, 70], [38, 67], [30, 60], [22, 54], [14, 54], [0, 49], [-4, 48],
    [-2, 44], [-9, 37]
  ], "#2b5633");

  // Africa
  drawPoly([
    [-6, 35], [-12, 28], [-17, 21], [-17, 15], [-12, 8], [-3, 5], [6, 4],
    [9, 1], [12, -7], [13, -16], [16, -26], [18, -34], [26, -34], [33, -27],
    [36, -18], [40, -10], [42, 0], [51, 11], [43, 13], [38, 20], [33, 28],
    [25, 32], [14, 32], [10, 37], [0, 36], [-6, 35]
  ], "#38522d");

  // Asia & Siberia
  drawPoly([
    [28, 41], [35, 42], [42, 41], [44, 38], [36, 35], [35, 29], [43, 22],
    [54, 17], [58, 24], [50, 30], [56, 26], [62, 25], [68, 23], [72, 19],
    [76, 9], [80, 12], [86, 20], [90, 22], [93, 19], [98, 12], [103, 2],
    [104, 3], [101, 8], [104, 11], [108, 16], [107, 20], [114, 22], [120, 26],
    [122, 31], [119, 36], [122, 40], [129, 35], [132, 42], [140, 48], [150, 58],
    [162, 56], [172, 63], [180, 66], [170, 71], [145, 73], [120, 74], [100, 77],
    [75, 72], [55, 68], [40, 66], [32, 60], [30, 50], [28, 41]
  ], "#244d2d");

  // Australia
  drawPoly([
    [114, -22], [114, -33], [120, -34], [135, -35], [142, -38], [150, -37],
    [153, -28], [150, -22], [144, -14], [141, -11], [136, -13], [128, -14],
    [120, -18], [114, -22]
  ], "#5e4b2d");

  // Greenland
  drawPoly([
    [-45, 60], [-35, 65], [-20, 72], [-18, 77], [-30, 83], [-50, 83],
    [-58, 77], [-52, 70], [-45, 60]
  ], "#f1f5f9", false);

  // Antarctica (polar ice)
  drawPoly([
    [-180, -70], [-120, -72], [-65, -64], [-60, -66], [-40, -73], [0, -70],
    [50, -68], [90, -66], [130, -67], [160, -71], [180, -70],
    [180, -90], [-180, -90]
  ], "#f8fafc", false);

  // Major Islands
  // UK & Ireland
  drawPoly([[-10, 51], [-6, 55], [-1, 58], [1, 52], [-5, 50], [-10, 51]], "#2a5431");
  // Japan
  drawPoly([[130, 32], [136, 35], [141, 41], [144, 44], [140, 40], [133, 34], [130, 32]], "#224c2b");
  // Madagascar
  drawPoly([[44, -13], [50, -15], [48, -25], [44, -25], [44, -13]], "#3b582f");
  // New Zealand
  drawPoly([[172, -35], [178, -38], [175, -42], [168, -46], [170, -42], [172, -35]], "#254e2e");

  // --- Biome Overlays ---
  // Sahara & Arabian Deserts
  drawPoly([
    [-15, 28], [5, 30], [25, 29], [34, 28], [45, 25], [52, 22], [55, 18],
    [48, 16], [35, 20], [25, 18], [10, 16], [-5, 17], [-15, 22], [-15, 28]
  ], "rgba(163, 131, 84, 0.7)", false);

  // Australian Outback (red sand desert)
  drawPoly([
    [118, -22], [128, -20], [138, -22], [140, -28], [134, -32], [122, -30], [118, -22]
  ], "rgba(180, 110, 55, 0.65)", false);

  // Gobi & Central Asian Steppes
  drawPoly([
    [75, 42], [90, 44], [105, 44], [112, 40], [105, 36], [90, 37], [75, 40], [75, 42]
  ], "rgba(150, 130, 95, 0.6)", false);

  // Himalayan Snowy Mountain Range
  drawPoly([
    [74, 34], [82, 30], [90, 28], [95, 28], [92, 30], [84, 33], [76, 36], [74, 34]
  ], "rgba(226, 232, 240, 0.75)", false);

  // Fine organic terrain noise
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 16) {
    // If pixel is land (has green/brown/white tint)
    if (data[i + 1] > data[i + 2] || data[i] > 180) {
      const n = (seededRandom(i) - 0.5) * 18;
      data[i] = Math.min(255, Math.max(0, data[i] + n));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  return canvas;
}

// 2. Realistic Night City Lights Texture (Glowing metropolitan hubs)
function createEarthNightCanvas(): HTMLCanvasElement {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Space darkness base
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);

  const toXY = (lon: number, lat: number): [number, number] => [
    ((lon + 180) / 360) * w,
    ((90 - lat) / 180) * h,
  ];

  // Major world city clusters [lon, lat, size, intensity]
  const cities: [number, number, number, number][] = [
    // South Asia & LENS core
    [90.41, 23.81, 7.0, 1.0],   // Dhaka (prominent)
    [91.83, 22.35, 4.5, 0.85],  // Chittagong
    [88.36, 22.57, 6.0, 0.9],   // Kolkata
    [77.20, 28.61, 6.5, 0.95],  // Delhi
    [72.87, 19.07, 6.5, 0.95],  // Mumbai
    [77.59, 12.97, 5.5, 0.9],   // Bengaluru
    [67.00, 24.86, 5.5, 0.9],   // Karachi
    // East Asia
    [139.69, 35.68, 8.0, 1.0],  // Tokyo
    [135.50, 34.69, 6.5, 0.9],  // Osaka
    [126.97, 37.56, 7.0, 0.95], // Seoul
    [116.40, 39.90, 7.5, 0.95], // Beijing
    [121.47, 31.23, 8.0, 1.0],  // Shanghai
    [113.26, 23.12, 7.0, 0.95], // Guangzhou
    [114.16, 22.31, 6.0, 0.95], // Hong Kong
    [121.56, 25.03, 5.0, 0.85], // Taipei
    // Southeast Asia
    [103.81, 1.35, 6.0, 0.95],  // Singapore
    [100.50, 13.75, 5.5, 0.9],  // Bangkok
    [106.84, -6.20, 6.0, 0.9],  // Jakarta
    [120.98, 14.59, 5.5, 0.85], // Manila
    // Middle East
    [31.23, 30.04, 6.5, 0.95],  // Cairo & Nile Delta
    [55.27, 25.20, 6.0, 0.95],  // Dubai
    [46.72, 24.71, 5.0, 0.85],  // Riyadh
    [34.78, 32.08, 5.0, 0.85],  // Tel Aviv
    [28.97, 41.00, 6.0, 0.9],   // Istanbul
    // Europe
    [-0.12, 51.50, 7.5, 1.0],   // London
    [2.35, 48.85, 7.0, 0.95],   // Paris
    [4.90, 52.36, 5.5, 0.9],    // Amsterdam / Benelux
    [13.40, 52.52, 6.0, 0.9],   // Berlin
    [9.19, 45.46, 6.5, 0.9],    // Milan / Po Valley
    [-3.70, 40.41, 5.5, 0.85],  // Madrid
    [37.61, 55.75, 6.5, 0.9],   // Moscow
    // North America
    [-74.00, 40.71, 8.5, 1.0],  // New York City / Corridor
    [-71.05, 42.36, 5.5, 0.9],  // Boston
    [-77.03, 38.90, 6.5, 0.95], // Washington DC
    [-87.62, 41.87, 7.0, 0.95], // Chicago
    [-118.24, 34.05, 8.0, 1.0], // Los Angeles
    [-122.41, 37.77, 6.5, 0.9], // San Francisco
    [-80.19, 25.76, 5.5, 0.85], // Miami
    [-95.36, 29.76, 6.0, 0.9],  // Houston
    [-79.38, 43.65, 6.0, 0.9],  // Toronto
    // South America
    [-46.63, -23.55, 7.0, 0.95],// Sao Paulo
    [-43.17, -22.90, 6.0, 0.9], // Rio de Janeiro
    [-58.38, -34.60, 6.5, 0.9], // Buenos Aires
    // Africa & Oceania
    [28.04, -26.20, 5.5, 0.85], // Johannesburg
    [3.37, 6.52, 5.0, 0.85],    // Lagos
    [36.82, -1.29, 4.5, 0.8],   // Nairobi
    [151.20, -33.86, 6.0, 0.9], // Sydney
    [144.96, -37.81, 5.5, 0.85],// Melbourne
  ];

  cities.forEach(([lon, lat, size, intensity]) => {
    const [x, y] = toXY(lon, lat);

    // Warm golden-amber halo
    const rad = ctx.createRadialGradient(x, y, 0, x, y, size * 2.5);
    rad.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
    rad.addColorStop(0.3, `rgba(251, 191, 36, ${intensity * 0.8})`);
    rad.addColorStop(0.7, `rgba(217, 119, 6, ${intensity * 0.35})`);
    rad.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = rad;
    ctx.beginPath();
    ctx.arc(x, y, size * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Specular center micro-dot
    ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1, size * 0.3), 0, Math.PI * 2);
    ctx.fill();
  });

  return canvas;
}

// 3. Realistic Dynamic Clouds Texture (Swirling atmospheric weather systems)
function createEarthCloudsCanvas(): HTMLCanvasElement {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.clearRect(0, 0, w, h);

  const drawCloudPuff = (cx: number, cy: number, rx: number, ry: number, opacity: number) => {
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
    grad.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
    grad.addColorStop(0.35, `rgba(255, 255, 255, ${opacity * 0.7})`);
    grad.addColorStop(0.7, `rgba(255, 255, 255, ${opacity * 0.25})`);
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  // 1. Equatorial Intertropical Convergence Zone (ITCZ)
  for (let i = 0; i < 60; i++) {
    const cx = (i / 60) * w + (seededRandom(i * 3 + 10) - 0.5) * 20;
    const cy = h * 0.5 + Math.sin(i * 0.3) * 18 + (seededRandom(i * 3 + 11) - 0.5) * 20;
    const rx = 18 + seededRandom(i * 3 + 12) * 35;
    const ry = 8 + seededRandom(i * 3 + 13) * 16;
    drawCloudPuff(cx, cy, rx, ry, 0.32);
  }

  // 2. Swirling cyclones with delicate spiral arms
  const stormCenters = [
    { x: w * 0.35, y: h * 0.28, r: 55, angle: 0.5 },  // North Atlantic
    { x: w * 0.15, y: h * 0.32, r: 60, angle: -0.4 }, // North Pacific
    { x: w * 0.72, y: h * 0.30, r: 50, angle: 0.7 },  // East Asia
    { x: w * 0.42, y: h * 0.72, r: 55, angle: -0.6 }, // South Atlantic
    { x: w * 0.85, y: h * 0.70, r: 50, angle: 0.4 },  // South Pacific
  ];

  stormCenters.forEach(({ x, y, r, angle }) => {
    for (let arm = 0; arm < 16; arm++) {
      const a = (arm / 16) * Math.PI * 2.5 + angle;
      const d = (arm / 16) * r;
      const px = x + Math.cos(a) * d;
      const py = y + Math.sin(a) * (d * 0.6);
      drawCloudPuff(px, py, 14 + arm * 1.5, 9 + arm * 0.9, 0.35);
    }
  });

  // 3. Wispy trade-wind filaments across temperate oceans
  for (let i = 0; i < 40; i++) {
    const cx = seededRandom(i * 7 + 1) * w;
    const isNorth = i % 2 === 0;
    const cy = isNorth ? h * (0.22 + seededRandom(i * 7 + 2) * 0.18) : h * (0.62 + seededRandom(i * 7 + 2) * 0.18);
    const rx = 35 + seededRandom(i * 7 + 3) * 55;
    const ry = 6 + seededRandom(i * 7 + 4) * 12;
    drawCloudPuff(cx, cy, rx, ry, 0.25);
  }

  return canvas;
}

// ============================================================
// LENS Global Media Hubs (Institutional Identity)
// ============================================================
const MEDIA_HUBS = [
  { name: "Dhaka", lon: 90.41, lat: 23.81, gold: true },
  { name: "Tokyo", lon: 139.69, lat: 35.68, gold: false },
  { name: "London", lon: -0.12, lat: 51.50, gold: false },
  { name: "New York", lon: -74.00, lat: 40.71, gold: false },
  { name: "Geneva", lon: 6.14, lat: 46.20, gold: true },
  { name: "Nairobi", lon: 36.82, lat: -1.29, gold: false },
  { name: "Singapore", lon: 103.81, lat: 1.35, gold: false },
  { name: "Sao Paulo", lon: -46.63, lat: -23.55, gold: false },
];

const HUB_CONNECTIONS: [number, number][] = [
  [0, 1], // Dhaka -> Tokyo
  [0, 4], // Dhaka -> Geneva
  [0, 6], // Dhaka -> Singapore
  [2, 3], // London -> New York
  [2, 4], // London -> Geneva
  [4, 5], // Geneva -> Nairobi
  [3, 7], // New York -> Sao Paulo
  [1, 6], // Tokyo -> Singapore
];

// Great circle arcing 3D line generator
function createArcPoints(p1: THREE.Vector3, p2: THREE.Vector3, radius: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const count = 32;
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    // Slerp on sphere surface
    const v = new THREE.Vector3().lerpVectors(p1, p2, t).normalize();
    // Arch upward away from Earth at midpoint
    const alt = Math.sin(t * Math.PI) * 0.18;
    v.multiplyScalar(radius + alt);
    points.push(v);
  }
  return points;
}

// ============================================================
// AtmosphericRimGlow — Rayleigh Scattering Fresnel Atmosphere
// ============================================================
function AtmosphericRimGlow() {
  const atmosphereUniforms = useMemo(
    () => ({
      color: { value: new THREE.Color("#38bdf8") },
    }),
    []
  );

  return (
    <mesh>
      <sphereGeometry args={[2.58, 64, 64]} />
      <shaderMaterial
        uniforms={atmosphereUniforms}
        vertexShader={`
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 color;
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vec3 viewDir = normalize(-vPosition);
            float fresnel = clamp(1.0 - dot(viewDir, vNormal), 0.0, 1.0);
            float intensity = pow(fresnel, 2.2) * 1.5;
            gl_FragColor = vec4(color, intensity);
          }
        `}
        transparent
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ============================================================
// RealisticEarth — Rotating 3D Earth, Cloud Shell & Media Signals
// ============================================================
function RealisticEarth({
  mouse,
  isMobile,
  isReducedMotion,
}: {
  mouse: React.MutableRefObject<{ x: number; y: number }>;
  isMobile: boolean;
  isReducedMotion: boolean;
}) {
  const earthGroupRef = useRef<THREE.Group>(null);
  const earthSurfaceRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const hubsRef = useRef<THREE.Group>(null);

  // Generate procedural equirectangular maps once on mount
  const { dayTexture, nightTexture, cloudsTexture } = useMemo(() => {
    if (typeof document === "undefined") {
      return { dayTexture: null, nightTexture: null, cloudsTexture: null };
    }
    const day = new THREE.CanvasTexture(createEarthDayCanvas());
    day.wrapS = THREE.RepeatWrapping;
    day.wrapT = THREE.ClampToEdgeWrapping;

    const night = new THREE.CanvasTexture(createEarthNightCanvas());
    night.wrapS = THREE.RepeatWrapping;
    night.wrapT = THREE.ClampToEdgeWrapping;

    const clouds = new THREE.CanvasTexture(createEarthCloudsCanvas());
    clouds.wrapS = THREE.RepeatWrapping;
    clouds.wrapT = THREE.ClampToEdgeWrapping;

    return { dayTexture: day, nightTexture: night, cloudsTexture: clouds };
  }, []);

  // Hub 3D positions on Earth's surface (radius = 2.46)
  const hubPositions = useMemo(() => {
    return MEDIA_HUBS.map((h) => latLonToVector3(h.lat, h.lon, 2.465));
  }, []);

  // Great circle communication arcs
  const arcLines = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color: "#22d3ee",
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return HUB_CONNECTIONS.map(([a, b]) => {
      const pts = createArcPoints(hubPositions[a], hubPositions[b], 2.465);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      return new THREE.Line(geo, mat);
    });
  }, [hubPositions]);

  // Continuous smooth rotation around Earth's tilted polar axis
  useFrame((state, delta) => {
    if (!earthGroupRef.current) return;
    const t = state.clock.elapsedTime;
    const rotSpeed = isReducedMotion ? 0.02 : 0.065;

    // Continuous rotation of surface
    if (earthSurfaceRef.current) {
      earthSurfaceRef.current.rotation.y += delta * rotSpeed;
    }

    // Clouds rotate independently and slightly faster for 3D atmospheric parallax
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * (rotSpeed * 1.35);
    }

    // Hubs rotate synchronously with the surface
    if (hubsRef.current) {
      hubsRef.current.rotation.y += delta * rotSpeed;
    }

    // Interactive mouse tracking parallax (subtle and smooth)
    if (!isReducedMotion) {
      earthGroupRef.current.rotation.x = Math.sin(t * 0.05) * 0.03 + mouse.current.y * 0.06;
      earthGroupRef.current.rotation.z = 0.41 + mouse.current.x * 0.04; // 23.4 deg astronomical tilt
    }
  });

  return (
    <group ref={earthGroupRef} rotation={[0, 0, 0.41]}>
      {/* 1. Base Earth Sphere (Surface Terrain + Night Lights) */}
      <mesh ref={earthSurfaceRef}>
        <sphereGeometry args={[2.45, isMobile ? 48 : 64, isMobile ? 48 : 64]} />
        <meshStandardMaterial
          map={dayTexture}
          emissiveMap={nightTexture}
          emissive={new THREE.Color("#fbbf24")}
          emissiveIntensity={0.8}
          roughness={0.45}
          metalness={0.1}
        />
      </mesh>

      {/* 2. Dynamic Volumetric Cloud Layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.478, isMobile ? 48 : 64, isMobile ? 48 : 64]} />
        <meshStandardMaterial
          map={cloudsTexture}
          transparent
          opacity={0.62}
          depthWrite={false}
          blending={THREE.NormalBlending}
          roughness={0.8}
        />
      </mesh>

      {/* 3. LENS Global Narrative Intelligence Beacons & Arcs */}
      <group ref={hubsRef}>
        {hubPositions.map((pos, i) => {
          const hub = MEDIA_HUBS[i];
          return (
            <group key={hub.name} position={pos}>
              {/* Core signal point */}
              <mesh>
                <sphereGeometry args={[0.028, 12, 12]} />
                <meshBasicMaterial
                  color={hub.gold ? "#fbbf24" : "#22d3ee"}
                  toneMapped={false}
                />
              </mesh>
              {/* Outer glowing halo ring */}
              <mesh>
                <sphereGeometry args={[0.048, 12, 12]} />
                <meshBasicMaterial
                  color={hub.gold ? "#f59e0b" : "#06b6d4"}
                  transparent
                  opacity={0.45}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            </group>
          );
        })}

        {/* Global narrative connection arcs */}
        {arcLines.map((lineObj, idx) => (
          <primitive key={idx} object={lineObj} />
        ))}
      </group>

      {/* 4. Atmospheric Blue Rim Glow (Rayleigh scattering) */}
      <AtmosphericRimGlow />
    </group>
  );
}

// ============================================================
// DataStreams — Orbital gold particle tracks around Earth
// ============================================================
function DataStreams({ isMobile }: { isMobile: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const count = isMobile ? 40 : 80;

  const { geometry, bases } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const parts: { r: number; baseAngle: number; baseY: number; v: number }[] = [];
    for (let i = 0; i < count; i++) {
      const p = {
        baseAngle: seededRandom(i * 3 + 100) * Math.PI * 2,
        r: 2.7 + (seededRandom(i * 3 + 101) - 0.5) * 0.4,
        baseY: (seededRandom(i * 3 + 102) - 0.5) * 3.5,
        v: 0.003 + seededRandom(i * 3 + 103) * 0.005,
      };
      parts.push(p);
      positions[i * 3] = Math.cos(p.baseAngle) * p.r;
      positions[i * 3 + 1] = p.baseY;
      positions[i * 3 + 2] = Math.sin(p.baseAngle) * p.r;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geometry: geo, bases: parts };
  }, [count]);
  const tickRef = useRef(0);

  useFrame(() => {
    if (!ref.current) return;
    tickRef.current += 1;
    const k = tickRef.current;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const p = bases[i];
      const angle = p.baseAngle + k * 0.0012;
      const y = -2.5 + ((((p.baseY + 2.5 + k * p.v) % 5) + 5) % 5);
      arr[i * 3] = Math.cos(angle) * p.r;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = Math.sin(angle) * p.r;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        color="#fbbf24"
        size={isMobile ? 0.03 : 0.04}
        transparent
        opacity={0.65}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ============================================================
// AtmosphericParticles — Slow ambient deep space dust
// ============================================================
function AtmosphericParticles() {
  const ref = useRef<THREE.Points>(null);
  const count = 160;

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (seededRandom(i * 4) - 0.5) * 18;
      positions[i * 3 + 1] = (seededRandom(i * 4 + 1) - 0.5) * 18;
      positions[i * 3 + 2] = (seededRandom(i * 4 + 2) - 0.5) * 18;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 0.008;
    ref.current.rotation.x = Math.sin(t * 0.005) * 0.03;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        color="#7dd3fc"
        size={0.02}
        transparent
        opacity={0.3}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ============================================================
// Scene — Cinematic Deep Space Composition
// ============================================================
function Scene({
  mouse,
  isMobile,
  isReducedMotion,
}: {
  mouse: React.MutableRefObject<{ x: number; y: number }>;
  isMobile: boolean;
  isReducedMotion: boolean;
}) {
  return (
    <>
      {/* Directional Sunlight from front-left creating natural day/night terminator */}
      <directionalLight position={[-6, 2.5, 4.5]} intensity={2.8} color="#ffffff" />
      {/* Soft ambient space fill light */}
      <ambientLight intensity={0.16} color="#051020" />
      {/* Secondary cyan rim back-light */}
      <directionalLight position={[5, -2, -3]} intensity={0.35} color="#0284c7" />

      {/* Realistic 3D Earth assembly */}
      <RealisticEarth mouse={mouse} isMobile={isMobile} isReducedMotion={isReducedMotion} />

      {/* Narrative data streams and ambient space particles */}
      <DataStreams isMobile={isMobile} />
      {!isMobile && <AtmosphericParticles />}
    </>
  );
}

// ============================================================
// GlobeNetwork — Canvas wrapper with responsive resizing & scroll pause
// ============================================================
export default function GlobeNetwork() {
  const mouseRef = useRef({ x: 0, y: 0 });
  const mounted = useMounted();
  const isMobile = useIsMobile();
  const isReducedMotion = useReducedMotion();
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");
  const containerRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);

  const updateFrameloop = useCallback(() => {
    setFrameloop((prev) => {
      const next = visibleRef.current && !isScrollActive() ? "always" : "never";
      return prev === next ? prev : next;
    });
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        updateFrameloop();
      },
      { threshold: 0 }
    );
    if (containerRef.current) observer.observe(containerRef.current);

    const unsubscribe = subscribeScrollActivity(updateFrameloop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      observer.disconnect();
      unsubscribe();
    };
  }, [updateFrameloop]);

  if (!mounted) {
    return <div className="w-full h-full" />;
  }

  return (
    <div ref={containerRef} className="relative w-full h-full select-none">
      <Canvas
        camera={{ position: [0, 0, 6.7], fov: 46 }}
        resize={{ scroll: false }}
        dpr={isMobile ? [1, 1] : [1, 1.5]}
        gl={{
          antialias: !isMobile,
          alpha: true,
          powerPreference: isMobile ? "low-power" : "high-performance",
        }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
        frameloop={frameloop}
      >
        <Scene mouse={mouseRef} isMobile={isMobile} isReducedMotion={isReducedMotion} />
      </Canvas>
    </div>
  );
}
