import crypto from "crypto";

const rawKey = process.env.SSN_ENCRYPTION_KEY;

if (
  process.env.NODE_ENV === "production" &&
  (!rawKey || rawKey.length < 32)
) {
  throw new Error(
    "SSN_ENCRYPTION_KEY must be set and at least 32 characters in production",
  );
}

// Derive a 32-byte AES key from the encryption key
const KEY = crypto
  .createHash("sha256")
  .update(rawKey || "default_ssn_encryption_key_000000")
  .digest();

// Deterministic IV derived from PBKDF2 so identical SSNs produce identical
// ciphertext — required to maintain the @unique DB constraint on SSN.
function getDeterministicIV(): Buffer {
  return crypto.pbkdf2Sync(KEY, "ssn-iv-salt", 1, 16, "sha256");
}

export function encryptSSN(ssn: string): string {
  const iv = getDeterministicIV();
  const cipher = crypto.createCipheriv("aes-256-cbc", KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(ssn, "utf8"),
    cipher.final(),
  ]);
  return encrypted.toString("hex");
}

export function decryptSSN(cipherHex: string): string {
  const iv = getDeterministicIV();
  const decipher = crypto.createDecipheriv("aes-256-cbc", KEY, iv);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(cipherHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

// Decrypt an SSN that was RSA-OAEP encrypted by the client for transport.
// The private key is stored in SSN_PRIVATE_KEY (PEM, \n-escaped for .env).
export function decryptTransportSSN(base64Ciphertext: string): string {
  const rawPrivateKey = process.env.SSN_PRIVATE_KEY;
  if (!rawPrivateKey) {
    throw new Error("SSN_PRIVATE_KEY is not configured");
  }
  const privateKey = rawPrivateKey.replace(/\\n/g, "\n");
  const buffer = Buffer.from(base64Ciphertext, "base64");
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    buffer,
  );
  return decrypted.toString("utf8");
}
