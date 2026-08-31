import { ProofsyTemplate } from "@/types/designer/template";

export interface ProofsyExportResult {
  success: boolean;
  message?: string;
  templateId?: string;
  error?: string;
}

/**
 * Direct 1-Click Export to Proofsy Platform API (http://localhost:5000/api/templates/import).
 */
export async function exportDirectlyToProofsy(
  template: ProofsyTemplate
): Promise<ProofsyExportResult> {
  const token = typeof window !== "undefined" ? localStorage.getItem("proofsy_admin_token") : null;
  const workspaceId = typeof window !== "undefined" ? localStorage.getItem("proofsy_workspace_id") : null;

  // Convert to Schema v2.0 export payload
  const payload = {
    templateJson: template,
    schemaVersion: "2.0",
    name: template.name || "Imported Certificate Template",
    background: template.background,
    page: template.page,
    elements: template.elements,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (workspaceId) {
    headers["x-workspace-id"] = workspaceId;
  }

  try {
    const res = await fetch("/api/templates/import", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        templateId: data.data?._id || data.data?.id,
        message: "Template successfully saved to Proofsy Platform!",
      };
    } else {
      return {
        success: false,
        error: data.error || `Export failed with status ${res.status}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Network error connecting to Proofsy Backend",
    };
  }
}
