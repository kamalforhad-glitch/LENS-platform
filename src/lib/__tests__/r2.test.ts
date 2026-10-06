import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  R2UploadError,
  createR2Client,
  downloadFromR2,
  getR2Config,
  r2ObjectKey,
  r2PublicUrl,
  uploadToR2,
  type R2Config,
} from "@/lib/backup/r2";

const TEST_CONFIG: R2Config = {
  accountId: "test-account",
  accessKeyId: "test-key-id",
  secretAccessKey: "test-secret",
  bucket: "lens-backups",
  endpoint: "https://test-account.r2.cloudflarestorage.com",
  publicUrl: "https://backups.lens.org.bd",
};

function clearR2Env() {
  delete process.env.R2_ACCOUNT_ID;
  delete process.env.R2_ACCESS_KEY_ID;
  delete process.env.R2_SECRET_ACCESS_KEY;
  delete process.env.R2_BUCKET;
  delete process.env.R2_ENDPOINT;
  delete process.env.R2_PUBLIC_URL;
}

describe("Cloudflare R2 backup persistence (mocked client, no real credentials)", () => {
  beforeEach(() => {
    clearR2Env();
    vi.unstubAllEnvs();
  });

  it("returns null when R2 is entirely unconfigured (explicit local mode)", () => {
    expect(getR2Config()).toBeNull();
  });

  it("fails closed on partial configuration (names only, no values)", () => {
    process.env.R2_BUCKET = "lens-backups";
    expect(() => getR2Config()).toThrow(/R2_ACCOUNT_ID/);
    // The thrown message must name variables, never values.
    process.env.R2_SECRET_ACCESS_KEY = "super-secret-value";
    try {
      getR2Config();
      expect.unreachable();
    } catch (error) {
      expect((error as Error).message).not.toContain("super-secret-value");
    }
  });

  it("derives the Cloudflare account endpoint when R2_ENDPOINT is unset", () => {
    process.env.R2_ACCOUNT_ID = "abc123";
    process.env.R2_ACCESS_KEY_ID = "key";
    process.env.R2_SECRET_ACCESS_KEY = "secret";
    process.env.R2_BUCKET = "lens-backups";
    const config = getR2Config();
    expect(config?.endpoint).toBe("https://abc123.r2.cloudflarestorage.com");
  });

  it("derives deterministic traversal-safe object keys", () => {
    expect(r2ObjectKey("lens-backup-2026-01-01.sql")).toBe("backups/lens-backup-2026-01-01.sql");
    expect(r2ObjectKey("../../etc/passwd")).toBe("backups/passwd");
    expect(r2ObjectKey("/abs/path/lens-backup-x.sql")).toBe("backups/lens-backup-x.sql");
  });

  it("builds public URLs without leaking credentials", () => {
    const url = r2PublicUrl(TEST_CONFIG, "backups/lens-backup-x.sql");
    expect(url).toBe("https://backups.lens.org.bd/backups/lens-backup-x.sql");
    expect(url).not.toContain("test-secret");
    expect(url).not.toContain("test-key-id");
    expect(r2PublicUrl({ ...TEST_CONFIG, publicUrl: undefined }, "k")).toBeNull();
  });

  it("successful upload resolves without exposing secrets", async () => {
    const send = vi.fn().mockResolvedValue({});
    await uploadToR2({ send }, TEST_CONFIG.bucket, "backups/x.sql", Buffer.from("sql"));
    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0][0] as { input: Record<string, unknown> };
    expect(command.input.Bucket).toBe("lens-backups");
    expect(command.input.Key).toBe("backups/x.sql");
    expect(JSON.stringify(command.input)).not.toContain("test-secret");
  });

  it("upload failure throws R2UploadError (backup must NOT report success)", async () => {
    const send = vi.fn().mockRejectedValue(new Error("network down"));
    await expect(
      uploadToR2({ send }, TEST_CONFIG.bucket, "backups/x.sql", Buffer.from("sql"))
    ).rejects.toBeInstanceOf(R2UploadError);
    // Failure carries key context only — no credentials.
    await expect(
      uploadToR2({ send }, TEST_CONFIG.bucket, "backups/x.sql", Buffer.from("sql")).catch((e) => {
        throw new Error((e as Error).message);
      })
    ).rejects.toThrow(/backups\/x\.sql/);
  });

  it("download reconstructs buffers from the R2 client", async () => {
    const send = vi.fn().mockResolvedValue({
      Body: { transformToByteArray: async () => new Uint8Array([115, 113, 108]) },
    });
    const data = await downloadFromR2({ send }, TEST_CONFIG.bucket, "backups/x.sql");
    expect(data.toString()).toBe("sql");
  });

  it("createR2Client never embeds secrets in non-credential fields", () => {
    let captured: unknown;
    class FakeClient {
      constructor(opts: unknown) {
        captured = opts;
      }
      async send() {
        return {};
      }
    }
    createR2Client(TEST_CONFIG, FakeClient);
    const opts = captured as { endpoint: string; region: string };
    expect(opts.endpoint).toBe(TEST_CONFIG.endpoint);
    expect(opts.region).toBe("auto");
    expect(JSON.stringify(captured)).toContain("test-secret"); // credentials block only
    expect(opts.endpoint).not.toContain("test-secret");
  });
});
