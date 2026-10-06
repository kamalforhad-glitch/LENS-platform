"use client";

import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { isScrollActive, subscribeScrollActivity } from "@/lib/scroll-activity";

function seededRandom(seed: number) {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// ============================================================
// NetworkGlobe — Dense wireframe + hundreds of pulsing nodes
// ============================================================
function NetworkGlobe({ mouse, isMobile }: { mouse: React.MutableRefObject<{ x: number; y: number }>; isMobile: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const originalSizesRef = useRef<Float32Array | null>(null);
  const frameSkipRef = useRef(0);

  const nodeCount = isMobile ? 120 : 240;
  const connectionThreshold = isMobile ? 0.9 : 1.0;

  const { nodes, connections } = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / nodeCount);
      const theta = Math.sqrt(nodeCount * Math.PI) * phi;
      const r = 2.5;
      pts.push(
        new THREE.Vector3(
          r * Math.cos(theta) * Math.sin(phi),
          r * Math.sin(theta) * Math.sin(phi),
          r * Math.cos(phi)
        )
      );
    }
    const lines: [number, number][] = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        if (pts[i].distanceTo(pts[j]) < connectionThreshold) lines.push([i, j]);
      }
    }
    return { nodes: pts, connections: lines };
  }, [nodeCount, connectionThreshold]);

  const nodeGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(nodes.length * 3);
    const sizes = new Float32Array(nodes.length);
    nodes.forEach((p, i) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      sizes[i] = 0.04 + seededRandom(i * 7) * 0.05;
    });
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    originalSizesRef.current = sizes;
    return geo;
  }, [nodes]);

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(connections.length * 6);
    connections.forEach(([a, b], i) => {
      positions[i * 6] = nodes[a].x;
      positions[i * 6 + 1] = nodes[a].y;
      positions[i * 6 + 2] = nodes[a].z;
      positions[i * 6 + 3] = nodes[b].x;
      positions[i * 6 + 4] = nodes[b].y;
      positions[i * 6 + 5] = nodes[b].z;
    });
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [connections, nodes]);

  useFrame((state) => {
    frameSkipRef.current++;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (isMobile && frameSkipRef.current % 2 !== 0) return;
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Continuous smooth rotation — never stops
    groupRef.current.rotation.y = t * 0.08 + mouse.current.x * 0.12;
    groupRef.current.rotation.x = Math.sin(t * 0.035) * 0.1 + mouse.current.y * 0.06;

    // Breathing node pulse
    const sizeAttr = nodeGeometry.attributes.size as THREE.BufferAttribute;
    if (originalSizesRef.current) {
      for (let i = 0; i < sizeAttr.count; i++) {
        const wave = Math.sin(t * 1.2 + i * 0.08) * 0.025;
        sizeAttr.setX(i, originalSizesRef.current[i] + wave);
      }
      sizeAttr.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Node points — bright cyan */}
      <points geometry={nodeGeometry}>
        <pointsMaterial
          color="#22d3ee"
          size={isMobile ? 0.05 : 0.07}
          transparent
          opacity={1}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Connection lines */}
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Wireframe sphere — visible */}
      <mesh>
        <sphereGeometry args={[2.5, isMobile ? 36 : 52, isMobile ? 36 : 52]} />
        <meshBasicMaterial
          color="#0891b2"
          wireframe
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Inner glow sphere */}
      <mesh>
        <sphereGeometry args={[2.3, 24, 24]} />
        <meshBasicMaterial
          color="#0e7490"
          transparent
          opacity={0.03}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ============================================================
// LighthouseBeam — Rotating gold + teal scanning cones
// ============================================================
function LighthouseBeam({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const mesh2Ref = useRef<THREE.Mesh>(null);
  const mesh3Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.z = t * 0.3 + mouse.current.x * 0.25;
      const mat = meshRef.current.material;
      if (mat && !Array.isArray(mat)) mat.opacity = 0.07 + Math.sin(t * 0.5) * 0.03;
    }
    if (mesh2Ref.current) {
      mesh2Ref.current.rotation.z = -t * 0.2 + mouse.current.x * 0.15;
      const mat2 = mesh2Ref.current.material;
      if (mat2 && !Array.isArray(mat2)) mat2.opacity = 0.05 + Math.sin(t * 0.7 + 1) * 0.02;
    }
    if (mesh3Ref.current) {
      mesh3Ref.current.rotation.z = t * 0.15;
      const mat3 = mesh3Ref.current.material;
      if (mat3 && !Array.isArray(mat3)) mat3.opacity = 0.03 + Math.sin(t * 1.1 + 2) * 0.015;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <coneGeometry args={[6, 12, 8, 1, true]} />
        <meshBasicMaterial
          color="#d4a843"
          transparent
          opacity={0.07}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={mesh2Ref} position={[0, 0, 0]}>
        <coneGeometry args={[4, 9, 6, 1, true]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={mesh3Ref} position={[0, 0, 0]}>
        <coneGeometry args={[3, 7, 6, 1, true]} />
        <meshBasicMaterial
          color="#d4a843"
          transparent
          opacity={0.03}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ============================================================
// DataStreams — Gold particles orbiting and flowing vertically
// ============================================================
function DataStreams({ isMobile }: { isMobile: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const count = isMobile ? 50 : 120;

  // Per-particle orbital bases (read-only after memo). The frame tick lives in
  // a ref, so the animation advances with zero atan2/sqrt/reads and zero
  // mutation of memoized values — identical motion at a fraction of the cost.
  const { geometry, bases } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const parts: { r: number; baseAngle: number; baseY: number; v: number }[] = [];
    for (let i = 0; i < count; i++) {
      const p = {
        baseAngle: seededRandom(i * 3 + 100) * Math.PI * 2,
        r: 2.5 + (seededRandom(i * 3 + 101) - 0.5) * 0.6,
        baseY: (seededRandom(i * 3 + 102) - 0.5) * 5,
        v: 0.003 + seededRandom(i * 3 + 103) * 0.006,
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
      const angle = p.baseAngle + k * 0.0015;
      const y = -3.5 + ((((p.baseY + 3.5 + k * p.v) % 7) + 7) % 7);
      arr[i * 3] = Math.cos(angle) * p.r;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = Math.sin(angle) * p.r;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        color="#d4a843"
        size={isMobile ? 0.03 : 0.04}
        transparent
        opacity={0.75}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ============================================================
// AtmosphericParticles — Slow-moving ambient dust
// ============================================================
function AtmosphericParticles() {
  const ref = useRef<THREE.Points>(null);
  const count = 200;

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (seededRandom(i * 4) - 0.5) * 16;
      positions[i * 3 + 1] = (seededRandom(i * 4 + 1) - 0.5) * 16;
      positions[i * 3 + 2] = (seededRandom(i * 4 + 2) - 0.5) * 16;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 0.012;
    ref.current.rotation.x = Math.sin(t * 0.006) * 0.04;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        color="#94a3b8"
        size={0.018}
        transparent
        opacity={0.2}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ============================================================
// Scene — Compose all layers
// ============================================================
function Scene({ mouse, isMobile }: { mouse: React.MutableRefObject<{ x: number; y: number }>; isMobile: boolean }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <NetworkGlobe mouse={mouse} isMobile={isMobile} />
      <LighthouseBeam mouse={mouse} />
      <DataStreams isMobile={isMobile} />
      {!isMobile && <AtmosphericParticles />}
    </>
  );
}

// ============================================================
// GlobeNetwork — Canvas wrapper
// FIX: isVisible starts TRUE so globe renders immediately.
//       IntersectionObserver only pauses frameloop when scrolled away.
// ============================================================
export default function GlobeNetwork() {
  const mouseRef = useRef({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");
  const containerRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);

  // Render only when visible AND settled. Pausing during active scroll drops
  // the most expensive per-frame unit (WebGL raster) while scrolling; the
  // bitmap persists and the frozen clock resumes jump-free. Never destroys
  // the scene — frameloop toggle only.
  const updateFrameloop = useCallback(() => {
    setFrameloop((prev) => {
      const next = visibleRef.current && !isScrollActive() ? "always" : "never";
      return prev === next ? prev : next;
    });
  }, []);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);

    const onMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    // Only pause/resume — never prevent initial render
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

  if (!mounted) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        // Scroll-driven re-measure caused a full renderer resize per scroll
        // tick (configure → setSize → gl.setSize). Container size never
        // changes on scroll — observe resizes only.
        resize={{ scroll: false }}
        dpr={isMobile ? [1, 1] : [1, 1.5]}
        gl={{
          antialias: !isMobile,
          alpha: true,
          powerPreference: isMobile ? "low-power" : "high-performance",
        }}
        style={{ background: "transparent" }}
        frameloop={frameloop}
      >
        <Scene mouse={mouseRef} isMobile={isMobile} />
      </Canvas>
    </div>
  );
}
