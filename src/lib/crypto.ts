import { createHash, randomBytes } from "node:crypto";

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function randomDigits(length: number) {
  let out = "";
  for (const b of randomBytes(length)) out += (b % 10).toString();
  return out;
}

// Stable small integer from a string, used for deterministic fake data.
export function hashInt(value: string) {
  return parseInt(sha256(value).slice(0, 8), 16);
}
