import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";
import { list, put } from "@vercel/blob";
import defaultPortfolio from "@/data/portfolio.json";

const SESSION_COOKIE_NAME = "portfolio_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const ADMIN_ACCOUNT_PATH = path.join(process.cwd(), ".portfolio-admin-auth.json");
const ADMIN_ACCOUNT_BLOB_PATH = "portfolio-data/admin-account.json.enc";

type AdminAccount = {
  email: string;
  salt: string;
  passwordHash: string;
  verified: boolean;
  verificationTokenHash?: string;
  verificationExpiresAt?: number;
  resetTokenHash?: string;
  resetExpiresAt?: number;
};

function getSessionSecret() {
  return process.env.SESSION_SECRET?.trim() || null;
}

function getEncryptionKey() {
  const secret = process.env.PORTFOLIO_DATA_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Set PORTFOLIO_DATA_SECRET or SESSION_SECRET to enable secure admin account storage.");
  }
  return crypto.scryptSync(secret, "portfolio-admin-auth-v1", 32);
}

function shouldUseBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

function validateAccount(account: unknown): account is AdminAccount {
  if (!account || typeof account !== "object") return false;
  const value = account as Partial<AdminAccount>;
  return (
    typeof value.email === "string" &&
    typeof value.salt === "string" &&
    typeof value.passwordHash === "string" &&
    typeof value.verified === "boolean"
  );
}

function encryptAccount(account: AdminAccount) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(account), "utf8"),
    cipher.final(),
  ]);
  return JSON.stringify({
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: encrypted.toString("base64"),
  });
}

function decryptAccount(envelope: { iv: string; tag: string; data: string }) {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(envelope.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.data, "base64")),
    decipher.final(),
  ]).toString("utf8");
  const account: unknown = JSON.parse(plaintext);
  if (!validateAccount(account)) throw new Error("Stored admin account data is invalid.");
  return account;
}

async function readAdminAccount(): Promise<AdminAccount | null> {
  if (process.env.VERCEL === "1" && !shouldUseBlobStorage()) {
    throw new Error("Connect Vercel Blob to enable secure admin account storage.");
  }

  if (shouldUseBlobStorage()) {
    const result = await list({ prefix: ADMIN_ACCOUNT_BLOB_PATH });
    const blob = result.blobs.find((item) => item.pathname === ADMIN_ACCOUNT_BLOB_PATH);
    if (!blob) return null;

    const response = await fetch(blob.url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Unable to load the admin account from Vercel Blob (${response.status}).`);
    }
    return decryptAccount(await response.json());
  }

  try {
    const account: unknown = JSON.parse(await fs.readFile(ADMIN_ACCOUNT_PATH, "utf8"));
    if (!validateAccount(account)) throw new Error("Stored admin account data is invalid.");
    return account;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
}

async function writeAdminAccount(account: AdminAccount, createOnly = false) {
  if (process.env.VERCEL === "1" && !shouldUseBlobStorage()) {
    throw new Error("Connect Vercel Blob to enable secure admin account storage.");
  }

  if (shouldUseBlobStorage()) {
    await put(ADMIN_ACCOUNT_BLOB_PATH, encryptAccount(account), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: !createOnly,
      contentType: "application/json",
    });
    return;
  }

  const contents = JSON.stringify(account);
  if (createOnly) {
    await fs.writeFile(ADMIN_ACCOUNT_PATH, contents, { flag: "wx" });
    return;
  }
  await fs.writeFile(ADMIN_ACCOUNT_PATH, contents);
}

function hashPassword(password: string, salt: string) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function matchesSecret(submitted: string, expected: string) {
  const submittedBuffer = Buffer.from(submitted);
  const expectedBuffer = Buffer.from(expected);
  return (
    submittedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(submittedBuffer, expectedBuffer)
  );
}

function newToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function getAdminSetupState(): Promise<"setup" | "pending" | "ready"> {
  const account = await readAdminAccount();
  if (!account) return "setup";
  return account.verified ? "ready" : "pending";
}

export async function beginAdminSetup(email: string, password: string, passwordConfirm: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
    throw new Error("Enter a valid email address.");
  }
  const allowedEmail = (
    process.env.ADMIN_SETUP_EMAIL || defaultPortfolio.profile.email
  ).trim().toLowerCase();
  if (normalizedEmail !== allowedEmail) {
    throw new Error("Use the portfolio's configured contact email for the first admin account.");
  }
  if (password !== passwordConfirm) {
    throw new Error("Password and confirm password do not match.");
  }
  if (password.length < 6 || password.length > 200) {
    throw new Error("Use a password between 6 and 200 characters.");
  }

  const existing = await readAdminAccount();
  if (existing?.verified) throw new Error("Admin setup is already complete.");
  if (existing && existing.email !== normalizedEmail) {
    throw new Error("Admin setup has already started. Continue with the same email address.");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const account: AdminAccount = {
    email: normalizedEmail,
    salt,
    passwordHash: hashPassword(password, salt),
    verified: true,
  };

  try {
    await writeAdminAccount(account, !existing);
  } catch (error) {
    if (!existing) {
      throw new Error("Admin setup was started in another request. Refresh the page and try signing in.");
    }
    throw error;
  }
  return { email: normalizedEmail };
}

export async function isValidAdminCredentials(email: string, password: string) {
  const account = await readAdminAccount();
  if (!account || !account.verified || account.email !== email.trim().toLowerCase()) return false;
  return matchesSecret(hashPassword(password, account.salt), account.passwordHash);
}

export async function createPasswordReset(email: string) {
  const account = await readAdminAccount();
  if (!account || !account.verified || account.email !== email.trim().toLowerCase()) return null;

  const token = newToken();
  account.resetTokenHash = hashToken(token);
  account.resetExpiresAt = Date.now() + 15 * 60 * 1000;
  await writeAdminAccount(account);
  return { email: account.email, token };
}

export async function resetAdminPassword(token: string, password: string) {
  if (password.length < 6 || password.length > 200) {
    throw new Error("Use a password between 6 and 200 characters.");
  }
  const account = await readAdminAccount();
  if (
    !account ||
    !account.verified ||
    !account.resetTokenHash ||
    !account.resetExpiresAt ||
    Date.now() > account.resetExpiresAt ||
    !matchesSecret(hashToken(token), account.resetTokenHash)
  ) {
    return false;
  }

  account.salt = crypto.randomBytes(16).toString("hex");
  account.passwordHash = hashPassword(password, account.salt);
  delete account.resetTokenHash;
  delete account.resetExpiresAt;
  await writeAdminAccount(account);
  return true;
}

export function signSession(username: string) {
  const secret = getSessionSecret();
  if (!secret) return "";

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

  if (!matchesSecret(signature, expectedSignature)) return null;

  const decoded = Buffer.from(payload, "base64url").toString("utf8");
  const separator = decoded.lastIndexOf(":");
  const username = decoded.slice(0, separator);
  const expiresAt = Number(decoded.slice(separator + 1));
  if (!username || !Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

  return username;
}

export function getAuthenticatedAdmin() {
  const cookieStore = cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySession(session);
}
