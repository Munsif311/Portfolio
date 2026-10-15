import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "portfolio_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

function getSessionSecret() {
  return process.env.SESSION_SECRET?.trim() || null;
}

export function getAdminCredentials() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();

  if (!username || !password) {
    return null;
  }

  return { username, password };
}

export function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password.trim()).digest("hex");
}

export function isValidAdminCredentials(username: string, password: string) {
  const expectedCredentials = getAdminCredentials();
  if (!expectedCredentials) {
    return false;
  }

  const normalizedUsername = String(username ?? "").trim();
  const normalizedPassword = String(password ?? "").trim();

  if (normalizedUsername !== expectedCredentials.username) {
    return false;
  }

  const submittedHash = hashPassword(normalizedPassword);
  const expectedHash = hashPassword(expectedCredentials.password);

  if (submittedHash.length !== expectedHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(submittedHash), Buffer.from(expectedHash));
}

export function signSession(username: string) {
  const secret = getSessionSecret();
  if (!secret) {
    return "";
  }

  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${username}:${expiresAt}`;
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

export function verifySession(token?: string) {
  const secret = getSessionSecret();
  if (!token || !secret) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(Buffer.from(payload, "base64url").toString("utf8"))
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  const decoded = Buffer.from(payload, "base64url").toString("utf8");
  const [username, expiresAtRaw] = decoded.split(":");
  if (!username || !expiresAtRaw) return null;

  const expiresAt = Number(expiresAtRaw);
  if (Number.isNaN(expiresAt) || Date.now() > expiresAt) return null;

  return username;
}

export function getAuthenticatedAdmin() {
  const cookieStore = cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySession(session);
}
