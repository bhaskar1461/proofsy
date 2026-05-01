const isProd = process.env.NODE_ENV === "production";
const defaultApiUrl = isProd ? "https://proofsy-backend.onrender.com/api" : "http://localhost:5000/api";
const defaultBackendUrl = isProd ? "https://proofsy-backend.onrender.com" : "http://localhost:5000";

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function toBackendUrl(value: string) {
  return stripTrailingSlash(value).replace(/\/api$/, "");
}

function toApiUrl(value: string) {
  const normalized = stripTrailingSlash(value);
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
}

const backendEnv = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
const apiEnv = process.env.NEXT_PUBLIC_API_URL?.trim();

export const BACKEND_URL = backendEnv ? toBackendUrl(backendEnv) : apiEnv ? toBackendUrl(apiEnv) : defaultBackendUrl;
const API_BASE = apiEnv ? toApiUrl(apiEnv) : backendEnv ? toApiUrl(backendEnv) : defaultApiUrl;

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...options?.headers },
      ...options,
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return json;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// Events
export interface EventData {
  id: string;
  name: string;
  date: string;
  organizerName: string;
  createdAt: string;
  templateId?: string;
  duration?: string;
}

export interface EventDetailData extends EventData {
  certificates: Array<{
    id: string;
    recipientName: string;
    recipientEmail: string;
    verificationCode: string;
    status: "pending" | "generated" | "failed";
    pdfUrl: string | null;
    issuedAt: string;
  }>;
}

export interface CertificateData {
  id: string;
  verificationCode: string;
  recipientName: string;
  recipientEmail: string;
  eventName: string;
  eventDate: string | null;
  templateId: string;
  pdfUrl: string | null;
  status: "pending" | "generated" | "failed";
  issuedAt: string;
}

export interface CertificateDetailData extends CertificateData {
  organizerName: string;
  verificationUrl?: string;
}

export interface RecipientPortalData {
  user: { name: string; email: string };
  totalEventsAttended: number;
  certificates: Array<{
    id: string;
    eventId: string;
    eventName: string;
    eventDate: string | null;
    verificationCode: string;
    pdfUrl: string | null;
    issuedAt: string;
  }>;
}

export interface StatsData {
  totalCertificates: number;
  generated: number;
  pending: number;
  failed: number;
  totalEvents: number;
  totalUsers: number;
  verificationRate: number;
  recentEvents: Array<{
    id: string;
    name: string;
    date: string;
    organizerName: string;
    totalCertificates: number;
    generatedCertificates: number;
    createdAt: string;
  }>;
  topRecipients: Array<{
    name: string;
    email: string;
    certificateCount: number;
  }>;
}

export interface UserLookupData {
  id: string;
  name: string;
  email: string;
  totalCertificates: number;
  totalEventsAttended: number;
}

export const api = {
  // Events
  createEvent: (body: { name: string; date: string; organizerName: string; templateId?: string; duration?: string }) =>
    request<EventData>("/events", { method: "POST", body: JSON.stringify(body) }),

  listEvents: () => request<EventData[]>("/events"),

  getEvent: (id: string) =>
    request<EventDetailData>(`/events/${encodeURIComponent(id)}`),

  deleteEvent: (id: string) =>
    request<{ id: string; deletedCertificates: number }>(`/events/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  createUser: (body: { name: string; email: string }) =>
    request<{ id: string; name: string; email: string }>("/users", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // Certificates
  generateCertificates: async (eventId: string, file: File) => {
    const formData = new FormData();
    formData.append("eventId", eventId);
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/certificates/generate`, { method: "POST", body: formData });
      return await res.json();
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Network error" };
    }
  },

  listCertificates: () =>
    request<CertificateData[]>("/certificates"),

  getCertificate: (id: string) =>
    request<CertificateDetailData>(`/certificates/${encodeURIComponent(id)}`),

  getStats: () =>
    request<StatsData>("/certificates/stats"),

  // Users
  listUsers: () =>
    request<UserLookupData[]>("/users"),

  getUserByEmail: (email: string) =>
    request<UserLookupData>(`/users/${encodeURIComponent(email)}`),

  getUserCertificates: (email: string) =>
    request<RecipientPortalData>(`/users/${encodeURIComponent(email)}/certificates`),

  // Verify
  verifyCertificate: (code: string) =>
    request<{
      isValid: boolean;
      certificate: {
        recipientName: string;
        eventName: string;
        eventDate: string | null;
        issuedAt: string;
        pdfUrl: string | null;
      };
    }>(`/verify/${encodeURIComponent(code)}`),

  // Health
  health: () => request<{ status: string; timestamp: string }>("/health"),
};
