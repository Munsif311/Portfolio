"use client";

import { upload } from "@vercel/blob/client";
import { useRef, useState, type DragEvent } from "react";
import type { FileReference, UploadReference } from "@/lib/portfolio";

type UploadKind = "image" | "pdf" | "document" | "archive";

type AdminFileUploadProps = {
  label: string;
  kind: UploadKind;
  value?: FileReference;
  onChange: (value: FileReference | undefined) => void;
};

const uploadLimits: Record<UploadKind, number> = {
  image: 10 * 1024 * 1024,
  pdf: 25 * 1024 * 1024,
  document: 25 * 1024 * 1024,
  archive: 100 * 1024 * 1024,
};

const uploadAccept: Record<UploadKind, string> = {
  image: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
  pdf: ".pdf,application/pdf",
  document: ".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain",
  archive: ".zip,application/zip,application/x-zip-compressed",
};

function isAllowedFile(file: File, kind: UploadKind) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const extensions: Record<UploadKind, string[]> = {
    image: ["jpg", "jpeg", "png", "webp"],
    pdf: ["pdf"],
    document: ["pdf", "doc", "docx", "txt"],
    archive: ["zip"],
  };

  return extensions[kind].includes(extension);
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fileUrl(value?: FileReference): string {
  if (!value) return "";
  return typeof value === "string" ? value : value.url;
}

function fileName(value: FileReference, url: string) {
  if (typeof value !== "string") return value.filename;
  try {
    return decodeURIComponent(new URL(url, window.location.origin).pathname.split("/").pop() ?? url);
  } catch {
    return url.split("/").pop() ?? url;
  }
}

function fileSize(value: FileReference) {
  return typeof value === "string" ? null : value.size;
}

export function AdminFileUpload({ label, kind, value, onChange }: AdminFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const currentUrl = value ? fileUrl(value) : "";

  async function uploadFile(file?: File) {
    if (!file) return;
    setError("");
    setStatus("");

    if (!isAllowedFile(file, kind)) {
      setError(`Choose a supported ${kind} file.`);
      return;
    }
    if (file.size > uploadLimits[kind]) {
      setError(`File is too large. Maximum size is ${formatBytes(uploadLimits[kind])}.`);
      return;
    }

    setBusy(true);
    setProgress(0);
    setStatus("Uploading...");
    try {
      const modeResponse = await fetch("/api/admin/upload", { cache: "no-store" });
      const modeResult = (await modeResponse.json()) as { mode?: "blob" | "local"; error?: string };
      if (!modeResponse.ok) throw new Error(modeResult.error ?? "Unable to start the upload.");

      let reference: UploadReference;
      if (modeResult.mode === "blob") {
        const blob = await upload(`portfolio-media/${kind}/${crypto.randomUUID()}-${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/admin/upload",
          clientPayload: JSON.stringify({ kind }),
          multipart: file.size > 5 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
        });
        reference = {
          url: blob.url,
          downloadUrl: blob.downloadUrl,
          pathname: blob.pathname,
          filename: file.name,
          size: file.size,
          contentType: blob.contentType,
        };
      } else {
        reference = await new Promise<UploadReference>((resolve, reject) => {
          const request = new XMLHttpRequest();
          request.open("POST", "/api/admin/upload");
          request.upload.onprogress = (event) => {
            if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
          };
          request.onload = () => {
            let result: { file?: UploadReference; error?: string } = {};
            try {
              result = JSON.parse(request.responseText) as typeof result;
            } catch {
              reject(new Error("The server returned an invalid upload response."));
              return;
            }
            if (request.status < 200 || request.status >= 300 || !result.file) {
              reject(new Error(result.error ?? `Upload failed (${request.status}).`));
              return;
            }
            resolve(result.file);
          };
          request.onerror = () => reject(new Error("Network error while uploading the file."));
          const formData = new FormData();
          formData.set("file", file);
          formData.set("kind", kind);
          request.send(formData);
        });
      }

      onChange(reference);
      setProgress(100);
      setStatus("Upload complete. Save changes to publish the reference.");
    } catch (uploadError) {
      setStatus("");
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void uploadFile(event.dataTransfer.files[0]);
  }

  return (
    <div
      className={`rounded-xl border border-dashed p-4 ${dragging ? "border-accentBlue bg-accentBlue/10" : "border-white/20"}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={uploadAccept[kind]}
        className="hidden"
        onChange={(event) => void uploadFile(event.target.files?.[0])}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-200">{label}</p>
          <p className="mt-1 text-xs text-gray-400">
            {kind === "image" ? "JPG, JPEG, PNG or WebP" : kind === "pdf" ? "PDF" : kind === "archive" ? "ZIP archive" : "PDF, DOC, DOCX or TXT"}
            {" · "}max {formatBytes(uploadLimits[kind])}
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-full border border-accentBlue/50 px-4 py-2 text-sm font-semibold text-accentBlue hover:bg-accentBlue/10 disabled:opacity-50"
        >
          {busy
            ? "Uploading..."
            : value
              ? `Replace ${kind === "image" ? "Image" : kind === "pdf" ? "PDF" : "file"}`
              : `Upload ${kind === "image" ? "Image" : kind === "pdf" ? "PDF" : "file"}`}
        </button>
      </div>

      {busy ? (
        <div className="mt-4" aria-live="polite">
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-accentBlue transition-all" style={{ width: `${progress ?? 0}%` }} />
          </div>
          <p className="mt-1 text-xs text-gray-400">{progress ?? 0}%</p>
        </div>
      ) : null}

      {value && currentUrl ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {kind === "image" ? (
            <img src={currentUrl} alt={`${label} preview`} className="h-20 w-20 rounded-lg border border-white/10 object-cover" />
          ) : (
            <div className="min-w-0">
              <p className="truncate text-sm text-white">{fileName(value, currentUrl)}</p>
              {fileSize(value) !== null ? <p className="text-xs text-gray-400">{formatBytes(fileSize(value) as number)}</p> : null}
              {(kind === "pdf" || (typeof value !== "string" && value.contentType === "application/pdf")) ? (
                <div className="mt-2 flex flex-wrap gap-3">
                  <a href={currentUrl} target="_blank" rel="noreferrer" className="text-xs text-accentBlue hover:text-accentPurple">View PDF</a>
                  <details className="basis-full">
                    <summary className="cursor-pointer text-xs text-gray-300">Preview PDF</summary>
                    <iframe title={`${label} PDF preview`} src={currentUrl} className="mt-2 h-80 w-full rounded-lg border border-white/10" />
                  </details>
                </div>
              ) : null}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              onChange(undefined);
              setStatus("File removed. Save changes to apply.");
              setError("");
            }}
            className="text-sm text-red-300 hover:text-red-200"
          >
            {kind === "image" ? "Remove image" : kind === "pdf" ? "Remove PDF" : "Remove file"}
          </button>
        </div>
      ) : null}

      <p className="mt-2 text-xs text-gray-500">Drop a file here or use the upload button.</p>
      {status ? <p className="mt-2 text-xs text-green-300" role="status">{status}</p> : null}
      {error ? <p className="mt-2 text-xs text-red-300" role="alert">{error}</p> : null}
    </div>
  );
}
