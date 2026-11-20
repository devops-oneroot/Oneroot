"use client";

import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FileText, Trash2, Upload, ExternalLink } from "lucide-react";
import { deleteLeadDocument, uploadLeadDocument } from "@/lib/api";
import { openLeadDocument } from "@/lib/openDocument";
import type { Lead } from "@/lib/types";
import { isAllowedUploadFile, UPLOAD_ACCEPT } from "@/lib/upload";

interface LeadDocumentsProps {
  lead: Lead;
}

function formatBytes(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function LeadDocuments({ lead }: LeadDocumentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const documents = lead.documents ?? [];

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadLeadDocument(lead._id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["saved-days"] });
      queryClient.invalidateQueries({ queryKey: ["saved-day"] });
      toast.success("Document uploaded");
      if (inputRef.current) inputRef.current.value = "";
    },
    onError: () => toast.error("Upload failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => deleteLeadDocument(lead._id, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["saved-days"] });
      queryClient.invalidateQueries({ queryKey: ["saved-day"] });
      toast.success("Document removed");
    },
    onError: () => toast.error("Could not delete document"),
  });

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
          <FileText className="h-4 w-4" />
          Documents
        </h3>
        <button
          type="button"
          disabled={uploadMutation.isPending}
          onClick={() => inputRef.current?.click()}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50 sm:w-auto sm:py-1.5"
        >
          <Upload className="h-3.5 w-3.5" />
          {uploadMutation.isPending ? "Uploading…" : "Upload"}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={UPLOAD_ACCEPT}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (!isAllowedUploadFile(file)) {
              toast.error(
                "File type not allowed (images, PDF, Office, text, ZIP — max 20 MB)"
              );
              e.target.value = "";
              return;
            }
            uploadMutation.mutate(file);
          }}
        />
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Images, PDF, Office docs, text, ZIP · max 20 MB
      </p>

      <ul className="space-y-2">
        {documents.length ? (
          [...documents].reverse().map((doc) => (
            <li
              key={doc._id}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await openLeadDocument(lead._id, doc);
                    } catch {
                      toast.error("Could not open document");
                    }
                  }}
                  className="flex w-full items-center gap-1 text-left text-sm font-medium text-violet-700 hover:underline"
                >
                  <span className="truncate">{doc.name}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </button>
                <p className="text-xs text-slate-400">
                  {new Date(doc.createdAt).toLocaleString()}
                  {doc.bytes ? ` · ${formatBytes(doc.bytes)}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(doc._id)}
                disabled={deleteMutation.isPending}
                className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Delete document"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))
        ) : (
          <p className="text-sm text-slate-400">No documents uploaded yet.</p>
        )}
      </ul>
    </div>
  );
}
