# LENS Backup Encryption — Key Rotation and Historical Backup Safety

## Overview

LENS database backups are encrypted using AES-256-GCM with the `LBK1` binary
format before being uploaded to Cloudflare R2. The encryption key is provided
via the `BACKUP_ENCRYPTION_KEY` environment variable, which must be a
Base64-encoded string that decodes to exactly 32 bytes.

## Why the Encryption Key Must Be Retained

The `LBK1` format (version 1) contains no key identifier or key version.
Consequently:

- A backup encrypted with key A cannot be decrypted with key B.
- There is no way to determine which key was used for a given backup
  artifact from the artifact itself.
- If `BACKUP_ENCRYPTION_KEY` is rotated without retaining the old key,
  **all historical backups encrypted with the old key become permanently
  inaccessible**.

## Safe Key Rotation Procedure

1. **Generate a new key securely:**
   ```sh
   openssl rand -base64 32
   ```
   This produces a Base64-encoded string that decodes to exactly 32 bytes.

2. **Retain the old key.** Do not delete or overwrite the previous
   `BACKUP_ENCRYPTION_KEY` value. Store it in a secure secret store
   (e.g., 1Password, AWS Secrets Manager, or your vault of choice).

3. **Test restore before retiring the old key.**
   - Restore a recent backup using the new key.
   - Restore an older backup using the old key.
   - Confirm both restorations succeed before removing the old key from
     active use.

4. **Update the active key.** Set `BACKUP_ENCRYPTION_KEY` to the new
   value in your production environment (Vercel) and in GitHub Actions
   repository secrets. Backups created after this point will use the new
   key.

5. **Retire the old key only after confirming** that no historical
   backups still require it, or continue retaining it indefinitely.

## Future Format Improvements

A future version of the backup format should include an explicit key
identifier or key version in the binary header to support safe, automated
key rotation with multi-key decryption. Until then, key rotation is a
manual, operator-controlled process.

## What Not to Do

- Do not delete `BACKUP_ENCRYPTION_KEY` from your secret store after
  rotating without first confirming all historical backups are no longer
  needed.
- Do not change the `LBK1` binary format in this release; doing so would
  break compatibility with all existing encrypted backups.
- Do not hardcode or commit the encryption key to any repository.
