import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Favicon Configuration and Asset Integrity", () => {
  const rootDir = path.resolve(__dirname, "../../..");
  const publicFaviconIco = path.join(rootDir, "public/favicon.ico");
  const publicFaviconSvg = path.join(rootDir, "public/favicon.svg");
  const rootAppFaviconSvg = path.join(rootDir, "app/favicon.svg");
  const srcAppFaviconIco = path.join(rootDir, "src/app/favicon.ico");
  const vercelJsonPath = path.join(rootDir, "vercel.json");

  it("should have a valid binary public/favicon.ico with correct ICO header and frames", () => {
    expect(fs.existsSync(publicFaviconIco)).toBe(true);
    const buf = fs.readFileSync(publicFaviconIco);

    // Minimum size for a valid ICO with directory + header + image data
    expect(buf.length).toBeGreaterThan(100);

    // Validate ICO header (6 bytes)
    const reserved = buf.readUInt16LE(0);
    const type = buf.readUInt16LE(2);
    const count = buf.readUInt16LE(4);

    expect(reserved).toBe(0);
    expect(type).toBe(1); // 1 = ICO
    expect(count).toBeGreaterThanOrEqual(2); // At least 16x16 and 32x32

    // Check directory entries
    const widths: number[] = [];
    const heights: number[] = [];

    for (let i = 0; i < count; i++) {
      const entryOffset = 6 + i * 16;
      const w = buf.readUInt8(entryOffset) || 256;
      const h = buf.readUInt8(entryOffset + 1) || 256;
      const planes = buf.readUInt16LE(entryOffset + 4);
      const bpp = buf.readUInt16LE(entryOffset + 6);
      const size = buf.readUInt32LE(entryOffset + 8);
      const offset = buf.readUInt32LE(entryOffset + 12);

      widths.push(w);
      heights.push(h);

      expect(planes).toBe(1);
      expect(bpp).toBe(32);
      expect(size).toBeGreaterThan(0);
      expect(offset + size).toBeLessThanOrEqual(buf.length);

      // Validate that frame is either DIB (biSize = 40) or PNG (magic bytes)
      const isDib = buf.readUInt32LE(offset) === 40;
      const isPng =
        buf[offset] === 0x89 &&
        buf[offset + 1] === 0x50 &&
        buf[offset + 2] === 0x4e &&
        buf[offset + 3] === 0x47;

      expect(isDib || isPng).toBe(true);
    }

    expect(widths).toContain(16);
    expect(widths).toContain(32);
    expect(heights).toContain(16);
    expect(heights).toContain(32);
  });

  it("should have a valid public/favicon.svg with LENS branding", () => {
    expect(fs.existsSync(publicFaviconSvg)).toBe(true);
    const svg = fs.readFileSync(publicFaviconSvg, "utf8");

    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("#0891b2"); // LENS brand color
    expect(svg).toContain('viewBox="0 0 64 64"');
  });

  it("should not have conflicting root app/ or src/app/favicon.ico assets", () => {
    // Root app/ directory hijacks Next.js App Router away from src/app/
    expect(fs.existsSync(rootAppFaviconSvg)).toBe(false);

    // src/app/favicon.ico would override public/favicon.ico with the default Vercel logo
    expect(fs.existsSync(srcAppFaviconIco)).toBe(false);
  });

  it("should have a clean vercel.json without broken rewrites or favicon overrides", () => {
    expect(fs.existsSync(vercelJsonPath)).toBe(true);
    const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, "utf8"));

    if (vercelConfig.headers) {
      const faviconHeaders = vercelConfig.headers.filter(
        (h: { source: string }) => h.source === "/favicon.ico"
      );
      expect(faviconHeaders.length).toBe(0);
    }

    if (vercelConfig.rewrites) {
      const faviconRewrites = vercelConfig.rewrites.filter(
        (r: { source: string }) => r.source === "/favicon.ico"
      );
      expect(faviconRewrites.length).toBe(0);
    }
  });
});
