export type MediaReference = string | { url: string };

export function getFileUrl(file?: MediaReference | null): string {
  if (!file) return "";
  return typeof file === "string" ? file : file.url;
}
