import type { Json } from "./validate";

/** JSON with object keys sorted recursively: equivalent documents serialize identically. */
export function canonicalize(value: Json): Json {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    const out: { [key: string]: Json } = {};
    for (const key of Object.keys(value).sort()) out[key] = canonicalize(value[key] as Json);
    return out;
  }
  return value;
}

export function canonicalJson(value: Json): string {
  return JSON.stringify(canonicalize(value));
}

/** Hex SHA-256 via Web Crypto (available in Bun and Node; no imports needed in the bundle). */
export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
