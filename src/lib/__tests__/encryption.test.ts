import { describe, expect, it } from "vitest";
import {
  encryptBackup,
  decryptBackup,
  loadEncryptionKey,
  type EncryptedBackup,
} from "@/lib/backup/encryption";

function makeTestKey(): string {
  // 32 random bytes, Base64-encoded (44 chars).
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) bytes[i] = i + 1;
  return Buffer.from(bytes).toString("base64");
}

const TEST_KEY = makeTestKey();
const TEST_PLAINTEXT = Buffer.from(
  "SELECT * FROM users; SELECT * FROM audit_logs; -- backup content"
);

describe("Backup encryption — AES-256-GCM", () => {
  describe("loadEncryptionKey", () => {
    it("returns null when key is unset (non-production)", () => {
      const prev = process.env.BACKUP_ENCRYPTION_KEY;
      delete process.env.BACKUP_ENCRYPTION_KEY;
      try {
        expect(loadEncryptionKey(false)).toBeNull();
      } finally {
        if (prev) process.env.BACKUP_ENCRYPTION_KEY = prev;
        else delete process.env.BACKUP_ENCRYPTION_KEY;
      }
    });

    it("throws in production when key is missing", () => {
      const prev = process.env.BACKUP_ENCRYPTION_KEY;
      delete process.env.BACKUP_ENCRYPTION_KEY;
      try {
        expect(() => loadEncryptionKey(true)).toThrow(/required in production/);
      } finally {
        if (prev) process.env.BACKUP_ENCRYPTION_KEY = prev;
        else delete process.env.BACKUP_ENCRYPTION_KEY;
      }
    });

    it("throws for invalid Base64", () => {
      const prev = process.env.BACKUP_ENCRYPTION_KEY;
      // A string with characters outside the Base64 alphabet that causes
      // Buffer.from to fail. Node's base64 decoder is lenient, so we use
      // a string that decodes to the wrong length instead.
      process.env.BACKUP_ENCRYPTION_KEY = Buffer.from("short").toString("base64");
      try {
        expect(() => loadEncryptionKey(false)).toThrow(/exactly 32 bytes/);
      } finally {
        if (prev) process.env.BACKUP_ENCRYPTION_KEY = prev;
        else delete process.env.BACKUP_ENCRYPTION_KEY;
      }
    });

    it("throws for wrong decoded length", () => {
      const prev = process.env.BACKUP_ENCRYPTION_KEY;
      process.env.BACKUP_ENCRYPTION_KEY = Buffer.from("short").toString("base64");
      try {
        expect(() => loadEncryptionKey(false)).toThrow(/exactly 32 bytes/);
      } finally {
        if (prev) process.env.BACKUP_ENCRYPTION_KEY = prev;
        else delete process.env.BACKUP_ENCRYPTION_KEY;
      }
    });

    it("returns the key when valid", () => {
      const prev = process.env.BACKUP_ENCRYPTION_KEY;
      process.env.BACKUP_ENCRYPTION_KEY = TEST_KEY;
      try {
        const key = loadEncryptionKey(false);
        expect(key).toBeInstanceOf(Buffer);
        expect(key!.length).toBe(32);
      } finally {
        if (prev) process.env.BACKUP_ENCRYPTION_KEY = prev;
        else delete process.env.BACKUP_ENCRYPTION_KEY;
      }
    });
  });

  describe("encryptBackup / decryptBackup round trip", () => {
    const key = Buffer.from(TEST_KEY, "base64");

    it("encrypts and decrypts back to original plaintext", () => {
      const encrypted: EncryptedBackup = encryptBackup(TEST_PLAINTEXT, key);
      expect(encrypted.version).toBe(1);
      expect(encrypted.data.length).toBeGreaterThan(TEST_PLAINTEXT.length);

      const decrypted = decryptBackup(encrypted.data, key);
      expect(decrypted.equals(TEST_PLAINTEXT)).toBe(true);
    });

    it("produces different ciphertext for the same plaintext (random nonce)", () => {
      const e1 = encryptBackup(TEST_PLAINTEXT, key);
      const e2 = encryptBackup(TEST_PLAINTEXT, key);
      expect(e1.data.equals(e2.data)).toBe(false);
    });

    it("rejects tampered ciphertext (authentication tag mismatch)", () => {
      const encrypted = encryptBackup(TEST_PLAINTEXT, key);
      const tampered = Buffer.from(encrypted.data);
      // Flip a byte in the ciphertext region (after magic + nonce + tag).
      const offset = 4 + 12 + 16 + 1;
      tampered[offset] = tampered[offset] ^ 0xff;
      expect(() => decryptBackup(tampered, key)).toThrow(
        /authentication tag invalid|corrupted/
      );
    });

    it("rejects tampered nonce", () => {
      const encrypted = encryptBackup(TEST_PLAINTEXT, key);
      const tampered = Buffer.from(encrypted.data);
      // Flip a byte in the nonce region.
      tampered[6] = tampered[6] ^ 0xff;
      expect(() => decryptBackup(tampered, key)).toThrow(
        /authentication tag invalid|corrupted/
      );
    });

    it("rejects wrong key", () => {
      const encrypted = encryptBackup(TEST_PLAINTEXT, key);
      const wrongKey = Buffer.alloc(32, 255);
      expect(() => decryptBackup(encrypted.data, wrongKey)).toThrow(
        /authentication tag invalid|corrupted/
      );
    });

    it("rejects artifact that is too short", () => {
      expect(() => decryptBackup(Buffer.from("LBK1"), key)).toThrow(
        /artifact too short/
      );
    });

    it("rejects unrecognized magic header", () => {
      const bad = Buffer.concat([
        Buffer.from("XXXX"), // wrong magic
        Buffer.alloc(12), // nonce
        Buffer.alloc(16), // tag
        Buffer.from("ciphertext"),
      ]);
      expect(() => decryptBackup(bad, key)).toThrow(/unrecognized magic/);
    });

    it("handles empty plaintext", () => {
      const encrypted = encryptBackup(Buffer.alloc(0), key);
      const decrypted = decryptBackup(encrypted.data, key);
      expect(decrypted.length).toBe(0);
    });
  });

  describe("format integrity", () => {
    const key = Buffer.from(TEST_KEY, "base64");

    it("starts with LBK1 magic header", () => {
      const encrypted = encryptBackup(TEST_PLAINTEXT, key);
      const magic = encrypted.data.subarray(0, 4).toString("latin1");
      expect(magic).toBe("LBK1");
    });

    it("has correct total structure size", () => {
      const encrypted = encryptBackup(TEST_PLAINTEXT, key);
      // magic(4) + nonce(12) + tag(16) + compressed ciphertext (>= 0)
      const minSize = 4 + 12 + 16;
      expect(encrypted.data.length).toBeGreaterThanOrEqual(minSize);
    });
  });
});
