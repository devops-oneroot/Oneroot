import { getStoredToken } from "./auth";
import type { LeadDocument } from "./types";

function getApiOrigin(): string {
  const url =
    process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:5000";
  return url.replace(/\/api\/?$/, "").replace(/\/$/, "");
}

function isCloudinaryUrl(url?: string) {
  return !!url && /res\.cloudinary\.com/i.test(url);
}

export function isPdfDocument(doc: LeadDocument) {
  return (
    doc.resourceType === "raw" ||
    doc.format === "pdf" ||
    /\.pdf$/i.test(doc.name || "") ||
    /\/raw\/upload\//i.test(doc.url || "")
  );
}

export function isImageDocument(doc: LeadDocument) {
  if (isPdfDocument(doc)) return false;
  if (doc.resourceType === "image") return true;
  if (doc.format && /^(jpg|jpeg|png|gif|webp|bmp|svg|avif|heic|heif|tiff?)$/i.test(doc.format))
    return true;
  if (/\.(png|jpe?g|gif|webp|bmp|svg|avif|heic|heif|tiff?)$/i.test(doc.name || ""))
    return true;
  if (doc.url?.includes("/image/upload/")) return true;
  return false;
}

function buildProxyUrl(leadId: string, docId: string) {
  return `${getApiOrigin()}/api/leads/${leadId}/documents/${docId}/file`;
}

export async function openLeadDocument(leadId: string, doc: LeadDocument) {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Please sign in to view documents");
  }

  if (isCloudinaryUrl(doc.url) && isImageDocument(doc)) {
    window.open(doc.url, "_blank", "noopener,noreferrer");
    return;
  }

  const proxyUrl = buildProxyUrl(leadId, doc._id);
  const res = await fetch(proxyUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (isCloudinaryUrl(doc.url)) {
      window.open(doc.url, "_blank", "noopener,noreferrer");
      return;
    }
    throw new Error(`Could not open document (${res.status})`);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120_000);
}
