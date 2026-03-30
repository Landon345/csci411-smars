/**
 * Dev-only script: assigns a fresh random encrypted SSN to every user.
 * Run with: pnpm exec tsx scripts/randomize-ssns.ts
 */
import "dotenv/config";
import { encryptSSN } from "../lib/crypto";
import { prisma } from "../lib/prisma";

function randomSSN(): string {
  // Returns a random 9-digit string, zero-padded
  return Math.floor(Math.random() * 1_000_000_000)
    .toString()
    .padStart(9, "0");
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("This script must not be run in production.");
    process.exit(1);
  }

  const users = await prisma.user.findMany({ select: { UserID: true, Email: true } });
  console.log(`Found ${users.length} user(s). Assigning random SSNs...\n`);

  // Track used SSNs within this run to avoid collisions
  const usedSSNs = new Set<string>();

  for (const user of users) {
    let ssn: string;
    do {
      ssn = randomSSN();
    } while (usedSSNs.has(ssn));
    usedSSNs.add(ssn);

    await prisma.user.update({
      where: { UserID: user.UserID },
      data: { SSN: encryptSSN(ssn) },
    });

    console.log(`  ${user.Email.padEnd(40)} → ***-**-${ssn.slice(5)} (encrypted)`);
  }

  console.log("\nDone.");
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
