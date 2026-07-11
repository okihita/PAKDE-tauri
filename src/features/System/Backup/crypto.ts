// ── Client-side crypto (zero-knowledge, matches docs/ARCHITECTURE.md §9) ──
//
// AES-256-GCM for confidentiality+integrity, PBKDF2(SHA-256) for key
// derivation from a user passphrase. All via the browser Web Crypto API —
// no secrets ever leave the device, and the server (if any) only ever sees
// opaque ciphertext.

export const PBKDF2_ITERATIONS = 210_000;

export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptBytes(plain: Uint8Array, key: CryptoKey, iv: Uint8Array): Promise<Uint8Array> {
  const buf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);
  return new Uint8Array(buf);
}

export async function decryptBytes(cipher: Uint8Array, key: CryptoKey, iv: Uint8Array): Promise<Uint8Array> {
  const buf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
  return new Uint8Array(buf);
}
