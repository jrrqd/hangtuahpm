/**
 * Edge-safe JWT verify for middleware (avoids pulling jose JWE/deflate into Edge).
 */
import { Role } from "@prisma/client";

export type SessionPayload = {
  userId: string;
  role: Role;
  username: string;
  fullName: string;
  mustResetPw: boolean;
};

function b64urlToBytes(input: string): Uint8Array {
  const pad = "=".repeat((4 - (input.length % 4)) % 4);
  const b64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function verifySessionEdge(
  token: string
): Promise<SessionPayload | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;
    const [headerB64, payloadB64, sigB64] = token.split(".");
    if (!headerB64 || !payloadB64 || !sigB64) return null;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const sig = b64urlToBytes(sigB64);
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      sig.buffer as ArrayBuffer,
      data
    );
    if (!ok) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(b64urlToBytes(payloadB64))
    );
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;

    return {
      userId: payload.userId,
      role: payload.role,
      username: payload.username,
      fullName: payload.fullName,
      mustResetPw: Boolean(payload.mustResetPw),
    };
  } catch {
    return null;
  }
}
