/** Common business file types (max 20 MB on server) */
export const UPLOAD_ACCEPT =
  "image/*,application/pdf,.pdf,text/plain,.txt,.csv,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,application/vnd.ms-excel,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx,application/zip,.zip,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.tif,.heic,.heif,.avif,.svg";

const ALLOWED_EXT = new Set([
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "tiff",
  "tif",
  "svg",
  "heic",
  "heif",
  "avif",
  "ico",
  "txt",
  "csv",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "zip",
]);

export function isAllowedUploadFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  if (file.type === "application/pdf") return true;
  if (file.type.startsWith("text/")) return true;
  if (file.type.startsWith("application/vnd.")) return true;
  if (file.type === "application/zip" || file.type === "application/msword")
    return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext ? ALLOWED_EXT.has(ext) : false;
}
