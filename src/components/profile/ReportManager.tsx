"use client";

import { useState, useCallback } from "react";
import { uploadReportFile, deleteReportFile } from "@/lib/supabaseStorage";
import { logProfileAccess } from "@/lib/profileService";

interface UploadedReport {
  name: string;
  url: string;
  size: number;
  type: string;
  file_name?: string;
}

interface ReportManagerProps {
  userId: string;
  reports: UploadedReport[];
  onReportsChange: (reports: UploadedReport[]) => void;
  disabled?: boolean;
  userEmail?: string;
}

export default function ReportManager({
  userId,
  reports,
  onReportsChange,
  disabled = false,
  userEmail,
}: ReportManagerProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [actionStates, setActionStates] = useState<Record<number, "idle" | "deleting" | "replacing" | "viewing">>({});

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (url: string) => {
    try {
      const parts = url.split("/");
      const filename = parts[parts.length - 1];
      const timestampStr = filename.split("_")[0];
      if (timestampStr && !isNaN(Number(timestampStr))) {
        return new Date(Number(timestampStr)).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } catch {}
    return "—";
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return "🖼️";
    if (type === "application/pdf") return "📄";
    return "📎";
  };

  const handleView = async (index: number) => {
    const report = reports[index];
    setActionStates(prev => ({ ...prev, [index]: "viewing" }));
    try {
      window.open(report.url, "_blank");
      await logProfileAccess(userId, "report_view", userEmail || "citizen", {
        reportName: report.name,
        reportUrl: report.url,
      });
    } catch (err) {
      console.error("View log failed:", err);
    } finally {
      setActionStates(prev => ({ ...prev, [index]: "idle" }));
    }
  };

  const handleDownload = async (index: number) => {
    const report = reports[index];
    try {
      const response = await fetch(report.url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = report.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      await logProfileAccess(userId, "report_download", userEmail || "citizen", {
        reportName: report.name,
      });
    } catch (err) {
      console.error("Download failed:", err);
      alert("Download failed. Try viewing and saving from the viewer.");
    }
  };

  const handleDelete = async (index: number) => {
    const report = reports[index];
    const confirmed = window.confirm(
      `⚠️ Delete "${report.name}"?\n\n` +
      `This action cannot be undone. The report will be permanently removed from your emergency profile.\n\n` +
      `File: ${report.name} (${formatSize(report.size)})\n` +
      `Uploaded: ${formatDate(report.url)}\n\n` +
      `Click OK to confirm deletion.`
    );

    if (!confirmed) return;

    const doubleConfirmed = window.confirm(
      `⚠️ FINAL CONFIRMATION\n\n` +
      `Are you absolutely sure you want to delete "${report.name}"?\n\n` +
      `This will remove it from your emergency medical profile.\n` +
      `First responders will NOT be able to access this document.\n\n` +
      `Type "DELETE" in the next prompt to confirm.`
    );

    if (!doubleConfirmed) return;

    const typed = prompt('Type "DELETE" to confirm:');
    if (typed !== "DELETE") {
      alert("Deletion cancelled. Text did not match.");
      return;
    }

    setActionStates(prev => ({ ...prev, [index]: "deleting" }));
    try {
      await deleteReportFile(report.url);
      await logProfileAccess(userId, "report_delete", userEmail || "citizen", {
        reportName: report.name,
        reportUrl: report.url,
        reportSize: report.size,
      });

      const newReports = reports.filter((_, i) => i !== index);
      onReportsChange(newReports);
      alert(`"${report.name}" deleted successfully.`);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete. Please try again.");
    } finally {
      setActionStates(prev => ({ ...prev, [index]: "idle" }));
    }
  };

  const handleReplace = async (index: number, file: File) => {
    const report = reports[index];
    const confirmed = window.confirm(
      `🔄 Replace "${report.name}" with "${file.name}"?\n\n` +
      `Current: ${report.name} (${formatSize(report.size)}, uploaded ${formatDate(report.url)})\n` +
      `New: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)\n\n` +
      `The old report will be permanently replaced.\n` +
      `First responders will see the new document.\n\n` +
      `Click OK to proceed.`
    );

    if (!confirmed) return;

    const reason = prompt(
      `Reason for replacement (required for audit trail):\n\n` +
      `e.g., "Updated lab results", "Corrected report", "New scan available"\n\n` +
      `This will be logged in your audit trail.`
    );

    if (!reason?.trim()) {
      alert("Replacement cancelled. Reason is required.");
      return;
    }

    setActionStates(prev => ({ ...prev, [index]: "replacing" }));
    try {
      // Delete old file
      await deleteReportFile(report.url);

      // Upload new file
      const uploaded = await uploadReportFile(userId, file);

      await logProfileAccess(userId, "report_replace", userEmail || "citizen", {
        oldReportName: report.name,
        oldReportUrl: report.url,
        newReportName: uploaded.name,
        newReportUrl: uploaded.url,
        reason: reason.trim(),
      });

      const newReports = [...reports];
      newReports[index] = uploaded;
      onReportsChange(newReports);

      alert(`"${report.name}" replaced with "${file.name}".\nReason logged: ${reason.trim()}`);
    } catch (err) {
      console.error("Replace failed:", err);
      alert("Failed to replace. Please try again.");
    } finally {
      setActionStates(prev => ({ ...prev, [index]: "idle" }));
    }
  };

  const handleFileSelect = (index: number, file: File) => {
    handleReplace(index, file);
  };

  if (reports.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>
        No reports uploaded yet.
      </div>
    );
  }

  return (
    <div 
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
      onClick={() => console.log("ReportManager outer container clicked")}
    >
{reports.map((report, index) => {
        const state = actionStates[index] ?? "idle";
        const isBusy = state !== "idle";

        return (
          <div
            key={index}
            style={{
              border: "1px solid var(--line)",
              borderRadius: 10,
              background: "#fff",
              overflow: "hidden",
            }}
          >
{/* Report Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                background: "var(--saffron-l)",
                borderBottom: "1px solid var(--line)",
                cursor: "pointer",
              }}
              onClick={(e) => {
                console.log("Header clicked", { index, target: (e.target as HTMLElement).tagName });
                setExpandedIndex(expandedIndex === index ? null : index);
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                <span style={{ fontSize: 24 }}>{getFileIcon(report.type)}</span>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--navy)", fontSize: 15 }}>
                    {report.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", gap: 16, marginTop: 2 }}>
                    <span>{formatSize(report.size)}</span>
                    <span>Uploaded: {formatDate(report.url)}</span>
                    <span style={{ textTransform: "capitalize", fontSize: 11, background: "var(--saffron)", color: "var(--saffron-d)", padding: "1px 6px", borderRadius: 3 }}>
                      {report.type.split("/")[1] || "file"}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {state === "viewing" && <span style={{ fontSize: 12, color: "var(--green)" }}>👁 Opening...</span>}
                {state === "deleting" && <span style={{ fontSize: 12, color: "var(--danger)" }}>🗑 Deleting...</span>}
                {state === "replacing" && <span style={{ fontSize: 12, color: "var(--saffron)" }}>🔄 Replacing...</span>}
                <span
                  style={{
                    fontSize: 18,
                    transition: "transform 0.2s",
                    transform: expandedIndex === index ? "rotate(180deg)" : "rotate(0deg)",
                    color: "var(--muted)",
                  }}
                >
                  ▼
                </span>
              </div>
            </div>

            {/* Expanded Actions */}
            {expandedIndex === index && (
              <div style={{ padding: 16, background: "#fafbfd", borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleView(index)}
                    disabled={isBusy || disabled}
                    style={{
                      padding: "10px 16px",
                      background: "#0f2159",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      cursor: disabled ? "not-allowed" : "pointer",
                      fontWeight: 500,
                      fontSize: 13,
                      opacity: disabled ? 0.6 : 1,
                    }}
                  >
                    👁 View / Open
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload(index)}
                    disabled={isBusy || disabled}
                    style={{
                      padding: "10px 16px",
                      background: "#fff",
                      color: "#0f2159",
                      border: "1px solid var(--line)",
                      borderRadius: 6,
                      cursor: disabled ? "not-allowed" : "pointer",
                      fontWeight: 500,
                      fontSize: 13,
                      opacity: disabled ? 0.6 : 1,
                    }}
                  >
                    ⬇ Download
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = ".pdf,.jpg,.jpeg,.png";
                      input.onchange = (e) => {
                        const target = e.target as HTMLInputElement;
                        const file = target.files?.[0];
                        if (file) handleFileSelect(index, file);
                      };
                      input.click();
                    }}
                    disabled={isBusy || disabled}
                    style={{
                      padding: "10px 16px",
                      background: "#fff",
                      color: "#0f2159",
                      border: "1px solid var(--saffron)",
                      borderRadius: 6,
                      cursor: disabled ? "not-allowed" : "pointer",
                      fontWeight: 500,
                      fontSize: 13,
                      opacity: disabled ? 0.6 : 1,
                    }}
                  >
                    🔄 Replace
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(index)}
                    disabled={isBusy || disabled}
                    style={{
                      padding: "10px 16px",
                      background: "#fff",
                      color: "var(--danger)",
                      border: "1px solid var(--danger)",
                      borderRadius: 6,
                      cursor: disabled ? "not-allowed" : "pointer",
                      fontWeight: 500,
                      fontSize: 13,
                      opacity: disabled ? 0.6 : 1,
                    }}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}