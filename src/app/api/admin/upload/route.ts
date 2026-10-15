import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { del } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import type { UploadReference } from "@/lib/portfolio";

export const runtime = "nodejs";

type UploadKind = "image" | "pdf" | "document" | "archive";

const sizeLimits: Record<UploadKind, number> = {
  image: 10 * 1024 * 1024,
  pdf: 25 * 1024 * 1024,
  document: 25 * 1024 * 1024,
  archive: 100 * 1024 * 1024,
};

const allowedTypes: Record<UploadKind, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp"],
  pdf: ["application/pdf"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ],
  archive: ["application/zip", "application/x-zip-compressed"],
};

const allowedExtensions: Record<UploadKind, string[]> = {
  image: [".jpg", ".jpeg", ".png", ".webp"],
  pdf: [".pdf"],
  document: [".pdf", ".doc", ".docx", ".txt"],
  archive: [".zip"],
};

function isUploadKind(value: string | null): value is UploadKind {
  return value !== null && Object.hasOwn(sizeLimits, value);
}

function blobMode() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

function fileSignatureMatches(kind: UploadKind, bytes: Buffer, extension: string) {
  if (kind === "image") {
    if (extension === ".jpg" || extension === ".jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (extension === ".png") return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (extension === ".webp") return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    return false;
  }
  if (extension === ".pdf") return bytes.toString("ascii", 0, 5) === "%PDF-";
  if (extension === ".zip" || extension === ".docx") {
    return bytes[0] === 0x50 && bytes[1] === 0x4b && [0x03, 0x05, 0x07].includes(bytes[2]);
  }
  if (extension === ".doc") return bytes.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  if (extension === ".txt") return !bytes.includes(0);
  return true;
}

export async function GET() {
  if (!getAuthenticatedAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (process.env.VERCEL === "1" && !process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    return NextResponse.json({ error: "Vercel Blob is not configured for this deployment." }, { status: 503 });
  }
  return NextResponse.json({ mode: blobMode() ? "blob" : "local" });
}

export async function POST(request: Request) {
  if (process.env.VERCEL === "1" && !blobMode()) {
    return NextResponse.json({ error: "Vercel Blob is not configured for this deployment." }, { status: 503 });
  }

  if (blobMode()) {
    const body = (await request.json().catch(() => null)) as HandleUploadBody | null;
    if (!body) return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
    const isCompletion = body.type === "blob.upload-completed";
    if (!isCompletion && !getAuthenticatedAdmin()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const result = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async (pathname, clientPayload) => {
          const requestedKind = (JSON.parse(clientPayload ?? "{}") as { kind?: string }).kind;
          const kindValue = requestedKind ?? "";
          const pathnameParts = pathname.split("/");
          const extension = path.extname(pathname).toLowerCase();
          if (!isUploadKind(kindValue) || pathnameParts[0] !== "portfolio-media" || pathnameParts[1] !== kindValue) {
            throw new Error("Unsupported upload category.");
          }
          const kind = kindValue;
          if (!allowedExtensions[kind].includes(extension)) {
            throw new Error("This file extension is not allowed.");
          }
          return {
            allowedContentTypes: allowedTypes[kind],
            maximumSizeInBytes: sizeLimits[kind],
            addRandomSuffix: true,
            tokenPayload: JSON.stringify({ kind }),
          };
        },
        onUploadCompleted: async ({ blob, tokenPayload }) => {
          const payload = JSON.parse(tokenPayload ?? "{}") as { kind?: string };
          const pathnameParts = blob.pathname.split("/");
          const kindValue = payload.kind ?? "";
          if (!isUploadKind(kindValue) || pathnameParts[1] !== kindValue) {
            await del(blob.url);
            throw new Error("Unsupported upload category.");
          }
          const extension = path.extname(blob.pathname).toLowerCase();
          if (
            !allowedExtensions[kindValue].includes(extension) ||
            !allowedTypes[kindValue].includes(blob.contentType)
          ) {
            await del(blob.url);
            throw new Error("Uploaded file type is not allowed.");
          }

          const response = await fetch(blob.url, { headers: { Range: "bytes=0-15" } });
          if (!response.ok || !response.body) {
            await del(blob.url);
            throw new Error("Unable to validate the uploaded file.");
          }
          const reader = response.body.getReader();
          const chunks: Uint8Array[] = [];
          let byteLength = 0;
          while (byteLength < 16) {
            const chunk = await reader.read();
            if (chunk.done) break;
            chunks.push(chunk.value);
            byteLength += chunk.value.length;
          }
          await reader.cancel();
          const prefix = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
          if (!fileSignatureMatches(kindValue, prefix, extension)) {
            await del(blob.url);
            throw new Error("File contents do not match the selected file type.");
          }
        },
      });
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Upload authorization failed." },
        { status: 400 },
      );
    }
  }

  if (!getAuthenticatedAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const kindValue = formData.get("kind");
    if (!(file instanceof File) || typeof kindValue !== "string" || !isUploadKind(kindValue)) {
      return NextResponse.json({ error: "Choose a supported file to upload." }, { status: 400 });
    }
    const kind = kindValue;
    const extension = path.extname(file.name).toLowerCase();
    const contentType = file.type.toLowerCase();
    if (!allowedExtensions[kind].includes(extension) || !allowedTypes[kind].includes(contentType)) {
      return NextResponse.json({ error: "The file type does not match the selected upload type." }, { status: 415 });
    }
    if (file.size > sizeLimits[kind]) {
      return NextResponse.json({ error: `File exceeds the ${Math.floor(sizeLimits[kind] / (1024 * 1024))} MB limit.` }, { status: 413 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    if (!fileSignatureMatches(kind, bytes, extension)) {
      return NextResponse.json({ error: "The file contents do not match the selected file type." }, { status: 415 });
    }

    const safeName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${randomUUID()}-${safeName}`;
    const relativePath = path.join("uploads", kind, filename);
    const absolutePath = path.join(process.cwd(), "public", relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, bytes, { flag: "wx" });

    const url = `/${relativePath.replace(/\\/g, "/")}`;
    const reference: UploadReference = {
      url,
      downloadUrl: url,
      pathname: relativePath.replace(/\\/g, "/"),
      filename: file.name,
      size: file.size,
      contentType,
    };
    return NextResponse.json({ file: reference });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to upload file." },
      { status: 500 },
    );
  }
}
