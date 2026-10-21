import { describe, expect, it } from "vitest";
import { validateFileSize, validateFileType, verifyUploadContent, sniffMimeType, sniffImageDimensions } from "@/lib/storage";

describe("upload allowlist (SVG must be rejected)", () => {
  it("allows jpg/png/webp/pdf", () => {
    expect(validateFileType("image/jpeg")).toBe(true);
    expect(validateFileType("image/png")).toBe(true);
    expect(validateFileType("image/webp")).toBe(true);
    expect(validateFileType("application/pdf")).toBe(true);
  });

  it("rejects svg and executables", () => {
    expect(validateFileType("image/svg+xml")).toBe(false);
    expect(validateFileType("application/x-sh")).toBe(false);
    expect(validateFileSize("image/svg+xml", 10).valid).toBe(false);
  });

  it("enforces image size quota", () => {
    expect(validateFileSize("image/jpeg", 11 * 1024 * 1024).valid).toBe(false);
    expect(validateFileSize("image/jpeg", 1024).valid).toBe(true);
  });
});

describe("magic-byte content sniffing", () => {
  const PNG = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from([0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]), // IHDR
    Buffer.from([0, 0, 0, 16, 0, 0, 0, 9]), // 16x9
    Buffer.from([8, 6, 0, 0, 0]),
    Buffer.alloc(4),
  ]);
  const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46]), Buffer.alloc(32)]);
  const HTML = Buffer.from('<html><script>alert(1)</script></html>', "utf8");
  const PDF = Buffer.from("%PDF-1.4 test", "utf8");

  it("detects png/jpeg and unknown content", () => {
    expect(sniffMimeType(PNG)).toBe("image/png");
    expect(sniffMimeType(JPEG)).toBe("image/jpeg");
    expect(sniffMimeType(HTML)).toBe(null);
    expect(sniffMimeType(PDF)).toBe("application/pdf");
  });

  it("rejects a text file renamed to .png", () => {
    const res = verifyUploadContent("image/png", HTML);
    expect(res.ok).toBe(false);
    expect(res.error).toBeDefined();
  });

  it("accepts genuine png and png-like declarations", () => {
    expect(verifyUploadContent("image/png", PNG).ok).toBe(true);
    expect(verifyUploadContent("image/jpeg", JPEG).ok).toBe(true);
  });

  it("keeps allowlist as first gate", () => {
    expect(verifyUploadContent("image/svg+xml", HTML).ok).toBe(false);
  });

  it("extracts png dimensions", async () => {
    const dims = await sniffImageDimensions(PNG, "image/png");
    expect(dims.width).toBe(16);
    expect(dims.height).toBe(9);
  });
});

describe("video upload validation", () => {
  const MP4 = Buffer.concat([
    Buffer.from([0, 0, 0, 32, 0x66, 0x74, 0x79, 0x70]), // ftyp box at offset 4
    Buffer.from([0x69, 0x73, 0x6f, 0x6d]), // isom brand
    Buffer.alloc(64),
  ]);
  const WEBM = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]); // EBML header
  const HTML = Buffer.from('<html><script>alert(1)</script></html>', "utf8");

  it("allows mp4/webm MIME types", () => {
    expect(validateFileType("video/mp4")).toBe(true);
    expect(validateFileType("video/webm")).toBe(true);
  });

  it("rejects other video container types", () => {
    expect(validateFileType("video/quicktime")).toBe(false);
    expect(validateFileType("video/mkv")).toBe(false);
    expect(validateFileType("video/x-matroska")).toBe(false);
  });

  it("enforces video size quota", () => {
    const limit = 100 * 1024 * 1024;
    expect(validateFileSize("video/mp4", limit + 1).valid).toBe(false);
    expect(validateFileSize("video/webm", limit).valid).toBe(true);
  });

  it("detects mp4/webm magic bytes", () => {
    expect(sniffMimeType(MP4)).toBe("video/mp4");
    expect(sniffMimeType(WEBM)).toBe("video/webm");
  });

  it("rejects an HTML file renamed to .mp4", () => {
    const res = verifyUploadContent("video/mp4", HTML);
    expect(res.ok).toBe(false);
    expect(res.error).toBeDefined();
  });

  it("accepts genuine mp4/webm with matching declarations", () => {
    expect(verifyUploadContent("video/mp4", MP4).ok).toBe(true);
    expect(verifyUploadContent("video/webm", WEBM).ok).toBe(true);
  });

  it("rejects declared image whose bytes are video", () => {
    const res = verifyUploadContent("image/png", MP4);
    expect(res.ok).toBe(false);
  });
});
