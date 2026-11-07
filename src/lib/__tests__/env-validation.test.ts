import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  assertBucketsDistinct,
  requireBackupBucket,
  requireMediaBucket,
} from "@/lib/env";

function clearR2MediaEnv() {
  delete process.env.R2_MEDIA_BUCKET;
  delete process.env.R2_MEDIA_REGION;
  delete process.env.R2_MEDIA_ENDPOINT;
  delete process.env.R2_MEDIA_ACCESS_KEY_ID;
  delete process.env.R2_MEDIA_SECRET_ACCESS_KEY;
  delete process.env.R2_MEDIA_PUBLIC_URL;
}

function clearR2BackupEnv() {
  delete process.env.R2_BACKUP_BUCKET;
  delete process.env.R2_BACKUP_REGION;
  delete process.env.R2_BACKUP_ENDPOINT;
  delete process.env.R2_BACKUP_ACCESS_KEY_ID;
  delete process.env.R2_BACKUP_SECRET_ACCESS_KEY;
  delete process.env.R2_BACKUP_ACCOUNT_ID;
}

describe("Environment validation — bucket distinctness and required buckets", () => {
  beforeEach(() => {
    clearR2MediaEnv();
    clearR2BackupEnv();
    vi.stubEnv("NODE_ENV", undefined);
  });

  afterEach(() => {
    clearR2MediaEnv();
    clearR2BackupEnv();
    vi.unstubAllEnvs();
  });

  describe("assertBucketsDistinct()", () => {
    it("does nothing in non-production when buckets are identical", () => {
      vi.stubEnv("NODE_ENV", "development");
      process.env.R2_MEDIA_BUCKET = "same-bucket";
      process.env.R2_BACKUP_BUCKET = "same-bucket";
      expect(() => assertBucketsDistinct()).not.toThrow();
    });

    it("does nothing in non-production when buckets are unset", () => {
      vi.stubEnv("NODE_ENV", "development");
      expect(() => assertBucketsDistinct()).not.toThrow();
    });

    it("throws in production when media and backup buckets are identical", () => {
      vi.stubEnv("NODE_ENV", "production");
      process.env.R2_MEDIA_BUCKET = "shared-bucket";
      process.env.R2_BACKUP_BUCKET = "shared-bucket";
      expect(() => assertBucketsDistinct()).toThrow(
        /must not be the same bucket/
      );
    });

    it("does not throw in production when buckets are distinct", () => {
      vi.stubEnv("NODE_ENV", "production");
      process.env.R2_MEDIA_BUCKET = "lens-media";
      process.env.R2_BACKUP_BUCKET = "lens-backups";
      expect(() => assertBucketsDistinct()).not.toThrow();
    });

    it("does not throw in production when only one bucket is set", () => {
      vi.stubEnv("NODE_ENV", "production");
      process.env.R2_MEDIA_BUCKET = "lens-media";
      expect(() => assertBucketsDistinct()).not.toThrow();
    });
  });

  describe("requireMediaBucket()", () => {
    it("returns empty string in non-production when unset", () => {
      vi.stubEnv("NODE_ENV", "development");
      expect(requireMediaBucket()).toBe("");
    });

    it("returns the bucket when set", () => {
      vi.stubEnv("NODE_ENV", "production");
      process.env.R2_MEDIA_BUCKET = "lens-media";
      expect(requireMediaBucket()).toBe("lens-media");
    });

    it("throws in production when unset", () => {
      vi.stubEnv("NODE_ENV", "production");
      expect(() => requireMediaBucket()).toThrow(
        /R2_MEDIA_BUCKET environment variable is required in production/
      );
    });

    it("throws in production when value is the build-phase placeholder", () => {
      vi.stubEnv("NODE_ENV", "production");
      process.env.R2_MEDIA_BUCKET = "build-phase-media-bucket";
      expect(() => requireMediaBucket()).toThrow(
        /build-phase placeholder/
      );
    });
  });

  describe("requireBackupBucket()", () => {
    it("returns empty string in non-production when unset", () => {
      vi.stubEnv("NODE_ENV", "development");
      expect(requireBackupBucket()).toBe("");
    });

    it("returns the bucket when set", () => {
      vi.stubEnv("NODE_ENV", "production");
      process.env.R2_BACKUP_BUCKET = "lens-backups";
      expect(requireBackupBucket()).toBe("lens-backups");
    });

    it("throws in production when unset", () => {
      vi.stubEnv("NODE_ENV", "production");
      expect(() => requireBackupBucket()).toThrow(
        /R2_BACKUP_BUCKET environment variable is required in production/
      );
    });

    it("throws in production when value is the build-phase placeholder", () => {
      vi.stubEnv("NODE_ENV", "production");
      process.env.R2_BACKUP_BUCKET = "build-phase-backup-bucket";
      expect(() => requireBackupBucket()).toThrow(
        /build-phase placeholder/
      );
    });
  });

  describe("Combined media/backup validation", () => {
    it("allows distinct buckets in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      process.env.R2_MEDIA_BUCKET = "lens-media";
      process.env.R2_BACKUP_BUCKET = "lens-backups";
      expect(requireMediaBucket()).toBe("lens-media");
      expect(requireBackupBucket()).toBe("lens-backups");
      expect(() => assertBucketsDistinct()).not.toThrow();
    });

    it("rejects identical buckets in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      process.env.R2_MEDIA_BUCKET = "shared-bucket";
      process.env.R2_BACKUP_BUCKET = "shared-bucket";
      expect(() => assertBucketsDistinct()).toThrow(
        /must not be the same bucket/
      );
    });

    it("development without R2 config does not require backup bucket", () => {
      vi.stubEnv("NODE_ENV", "development");
      expect(requireMediaBucket()).toBe("");
      expect(requireBackupBucket()).toBe("");
      expect(() => assertBucketsDistinct()).not.toThrow();
    });
  });
});
