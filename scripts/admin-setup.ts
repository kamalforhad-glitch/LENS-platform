/**
 * scripts/admin-setup.ts
 *
 * Secure CLI utility to provision or reset the local/development LENS administrator account.
 * - Prompts for email and password securely without echoing the password to terminal.
 * - Validates inputs and hashes passwords with bcrypt (12 rounds) matching application auth.
 * - Prevents accidental production execution (requires explicit --allow-production flag).
 * - Never prints passwords, hashes, or secrets.
 *
 * Usage:
 *   npx tsx scripts/admin-setup.ts
 *   npx tsx scripts/admin-setup.ts --use-env
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "readline";

const prisma = new PrismaClient();

function promptText(query: string, defaultValue: string = ""): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const promptLabel = defaultValue ? `${query} [${defaultValue}]: ` : `${query}: `;
    rl.question(promptLabel, (answer) => {
      rl.close();
      const val = answer.trim();
      resolve(val || defaultValue);
    });
  });
}

function promptHidden(query: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const stdin = process.stdin;
    process.stdout.write(`${query}: `);

    let password = "";

    if (stdin.isTTY) {
      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding("utf8");

      const onData = (char: string) => {
        // Ctrl+C
        if (char === "\u0003") {
          stdin.setRawMode(false);
          process.stdout.write("\n");
          process.exit(1);
        }
        // Enter / Return
        if (char === "\r" || char === "\n") {
          stdin.setRawMode(false);
          stdin.removeListener("data", onData);
          rl.close();
          process.stdout.write("\n");
          resolve(password);
          return;
        }
        // Backspace
        if (char === "\u0008" || char === "\u007f") {
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write("\b \b");
          }
          return;
        }
        // Visible characters
        password += char;
        process.stdout.write("*");
      };

      stdin.on("data", onData);
    } else {
      // Non-interactive / piped input
      rl.question("", (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

async function main() {
  const isProd = process.env.NODE_ENV === "production";
  const args = process.argv.slice(2);
  const allowProd = args.includes("--allow-production");
  const useEnv = args.includes("--use-env");

  if (isProd && !allowProd) {
    console.error("ERROR: This admin setup utility is restricted to development environments.");
    console.error("To run in production, pass the explicit flag: --allow-production");
    process.exit(1);
  }

  console.log("\n========================================================");
  console.log(" LENS Administrator Account Provisioning / Reset Utility ");
  console.log("========================================================\n");

  let email = "admin@lens.org.bd";
  let password = "";

  if (useEnv) {
    const envPassword = process.env.ADMIN_SEED_PASSWORD;
    if (!envPassword) {
      console.error("ERROR: --use-env specified but ADMIN_SEED_PASSWORD is not set in environment.");
      process.exit(1);
    }
    password = envPassword;
    console.log(`Using configured email: ${email}`);
    console.log("Using password from environment variable ADMIN_SEED_PASSWORD.");
  } else {
    email = await promptText("Enter administrator email", "admin@lens.org.bd");
    email = email.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      console.error("ERROR: Invalid email address.");
      process.exit(1);
    }

    password = await promptHidden("Enter new admin password (min 8 characters)");
    if (!password || password.length < 8) {
      console.error("ERROR: Password must be at least 8 characters long.");
      process.exit(1);
    }

    const confirmPassword = await promptHidden("Confirm new admin password");
    if (password !== confirmPassword) {
      console.error("ERROR: Passwords do not match.");
      process.exit(1);
    }
  }

  const normalizedEmail = email.trim().toLowerCase();
  console.log(`\nProcessing account for: ${normalizedEmail}`);

  // Hash password using bcrypt (12 rounds)
  const passwordHash = bcrypt.hashSync(password, 12);

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        passwordHash,
        role: "super_admin",
        active: true,
      },
    });
    console.log(`✓ Existing user updated: ${normalizedEmail}`);
    console.log("✓ Role confirmed as: super_admin");
    console.log("✓ Account status: active");
    console.log("✓ Password hash successfully updated in database.");
  } else {
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: "LENS Admin",
        passwordHash,
        role: "super_admin",
        active: true,
        createdBy: "cli-setup",
      },
    });
    console.log(`✓ New administrator user created: ${newUser.email} (id: ${newUser.id})`);
    console.log("✓ Role set to: super_admin");
    console.log("✓ Account status: active");
  }

  console.log("\nSetup complete! You can now sign in at /admin/login with these credentials.\n");
}

main()
  .catch((e) => {
    console.error("Setup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
