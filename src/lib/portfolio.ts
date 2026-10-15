import { promises as fs } from "fs";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import path from "path";
import { list, put } from "@vercel/blob";
import defaultPortfolio from "@/data/portfolio.json";

export type UploadReference = {
  url: string;
  downloadUrl: string;
  pathname: string;
  filename: string;
  size: number;
  contentType: string;
};

export type FileReference = string | UploadReference;

export type Skill = {
  id: string;
  name: string;
  category: string;
  description: string;
  featured?: boolean;
};

export type Project = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  problem: string;
  solution: string;
  category: string;
  tech: string[];
  image: FileReference;
  gallery: FileReference[];
  featured: boolean;
  published: boolean;
  url?: string;
  github?: string;
  demo?: string;
  documents?: Array<{
    id: string;
    title: string;
    type: string;
    url: FileReference;
    public?: boolean;
  }>;
};

export type Experience = {
  id: string;
  role: string;
  company: string;
  duration: string;
  description: string;
  published?: boolean;
  public?: boolean;
  location?: string;
  employmentType?: string;
  website?: string;
  startDate?: string;
  endDate?: string;
  highlights?: string[];
  technologies?: string[];
  supportLetterUrl?: FileReference;
};

export type Certification = {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  expirationDate?: string;
  description?: string;
  skills?: string[];
  image?: FileReference;
  pdfUrl?: FileReference;
  credentialId?: string;
  verificationUrl?: string;
  category?: string;
  featured?: boolean;
  displayOrder?: number;
  public?: boolean;
};

export type EducationItem = {
  id: string;
  title?: string;
  degree: string;
  school: string;
  department?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
  grade?: string;
  details?: string;
  description?: string;
  documentUrl?: FileReference;
  transcriptUrl?: FileReference;
  verificationUrl?: string;
  public?: boolean;
  displayOrder?: number;
  category?: string;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  date: string;
  issuer: string;
  category: string;
  image?: FileReference;
  documentUrl?: FileReference;
  verificationUrl?: string;
  public?: boolean;
};

export type DocumentItem = {
  id: string;
  title: string;
  issuer: string;
  category: string;
  public: boolean;
  url: FileReference;
  date: string;
  description: string;
  visibility?: "private" | "public" | "download";
  fileType?: string;
  downloadUrl?: FileReference;
};

export type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  published: boolean;
  date: string;
  coverImage?: FileReference;
};

export type PortfolioData = {
  profile: {
    name: string;
    title: string;
    tagline: string;
    summary: string;
    email: string;
    github: string;
    linkedin: string;
    location: string;
    resumeUrl: FileReference;
    image: FileReference;
  };
  skills: Skill[];
  projects: Project[];
  experience: Experience[];
  certifications: Certification[];
  education: EducationItem[];
  achievements?: Achievement[];
  documents: DocumentItem[];
  blogPosts: BlogPost[];
};

const PORTFOLIO_PATH = path.join(process.cwd(), "src", "data", "portfolio.json");
const PORTFOLIO_BLOB_PATH = "portfolio-data/portfolio.json.enc";
let portfolioCache: { data: PortfolioData; expiresAt: number } | null = null;
const PORTFOLIO_CACHE_TTL_MS = 30_000;

function shouldUseBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

function encryptionKey() {
  const secret = process.env.PORTFOLIO_DATA_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Set PORTFOLIO_DATA_SECRET to enable encrypted Vercel Blob portfolio storage.");
  }
  return scryptSync(secret, "portfolio-data-v1", 32);
}

function normalizePortfolio(parsed: PortfolioData): PortfolioData {
  return {
    ...parsed,
    achievements: parsed.achievements ?? [],
    documents: parsed.documents ?? [],
    blogPosts: parsed.blogPosts ?? [],
  };
}

async function readBlobPortfolio(): Promise<PortfolioData | null> {
  const result = await list({ prefix: PORTFOLIO_BLOB_PATH });
  const blob = result.blobs.find((item) => item.pathname === PORTFOLIO_BLOB_PATH);
  if (!blob) return null;

  const response = await fetch(blob.url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load portfolio data from Vercel Blob (${response.status}).`);
  }

  const envelope = (await response.json()) as { iv: string; tag: string; data: string };
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(envelope.iv, "base64"));
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.data, "base64")),
    decipher.final(),
  ]).toString("utf8");
  return normalizePortfolio(JSON.parse(plaintext) as PortfolioData);
}

export async function getPortfolioData(): Promise<PortfolioData> {
  if (process.env.VERCEL === "1" && !shouldUseBlobStorage()) {
    return normalizePortfolio(defaultPortfolio as PortfolioData);
  }

  if (portfolioCache && portfolioCache.expiresAt > Date.now()) {
    return portfolioCache.data;
  }

  const fallback: PortfolioData = {
    profile: {
      name: "Munsif Khan",
      title: "AI & Machine Learning Engineer",
      tagline: "Building intelligent systems that solve real-world problems.",
      summary:
        "Software Engineering graduate specializing in machine learning, computer vision, NLP, and AI-powered applications.",
      email: "munsifkhankhaksar@gmail.com",
      github: "https://github.com/Munsif311",
      linkedin: "https://www.linkedin.com/in/munsif-khan-418774257/",
      location: "Pakistan",
      resumeUrl: "/Munsif_Ai_Engr_CV.pdf",
      image: "/Munsif.png",
    },
    skills: [],
    projects: [],
    experience: [],
    certifications: [],
    education: [],
    achievements: [],
    documents: [],
    blogPosts: [],
  };

  if (shouldUseBlobStorage()) {
    const blobPortfolio = await readBlobPortfolio();
    if (blobPortfolio) {
      portfolioCache = { data: blobPortfolio, expiresAt: Date.now() + PORTFOLIO_CACHE_TTL_MS };
      return blobPortfolio;
    }
    try {
      const localPortfolio = normalizePortfolio(JSON.parse(await fs.readFile(PORTFOLIO_PATH, "utf8")) as PortfolioData);
      portfolioCache = { data: localPortfolio, expiresAt: Date.now() + PORTFOLIO_CACHE_TTL_MS };
      return localPortfolio;
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return fallback;
      throw error;
    }
  }

  try {
    const localPortfolio = normalizePortfolio(JSON.parse(await fs.readFile(PORTFOLIO_PATH, "utf8")) as PortfolioData);
    portfolioCache = { data: localPortfolio, expiresAt: Date.now() + PORTFOLIO_CACHE_TTL_MS };
    return localPortfolio;
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error;
    await fs.mkdir(path.dirname(PORTFOLIO_PATH), { recursive: true });
    await fs.writeFile(PORTFOLIO_PATH, JSON.stringify(fallback, null, 2));
    portfolioCache = { data: fallback, expiresAt: Date.now() + PORTFOLIO_CACHE_TTL_MS };
    return fallback;
  }
}

export async function savePortfolioData(data: PortfolioData) {
  if (process.env.VERCEL === "1" && !shouldUseBlobStorage()) {
    throw new Error("Vercel Blob is not configured. Connect a Blob store to enable portfolio editing.");
  }

  if (shouldUseBlobStorage()) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(data), "utf8"),
      cipher.final(),
    ]);
    const envelope = JSON.stringify({
      iv: iv.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
      data: encrypted.toString("base64"),
    });
    await put(PORTFOLIO_BLOB_PATH, envelope, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    portfolioCache = { data, expiresAt: Date.now() + PORTFOLIO_CACHE_TTL_MS };
    return;
  }

  await fs.mkdir(path.dirname(PORTFOLIO_PATH), { recursive: true });
  await fs.writeFile(PORTFOLIO_PATH, JSON.stringify(data, null, 2));
  portfolioCache = { data, expiresAt: Date.now() + PORTFOLIO_CACHE_TTL_MS };
}

export function getPublishedProjects(projects: Project[]) {
  return projects.filter((project) => project.published);
}

export function getFeaturedProjects(projects: Project[]) {
  return projects.filter((project) => project.featured && project.published);
}

export function getPublicCertifications(certifications: Certification[]) {
  return certifications.filter((cert) => cert.public !== false);
}

export function getPublicDocuments(documents: DocumentItem[] = []) {
  return documents.filter(
    (document) => document.public || document.visibility === "public" || document.visibility === "download",
  );
}

export function getPublishedAchievements(achievements: Achievement[] = []) {
  return achievements.filter((achievement) => achievement.public !== false);
}
