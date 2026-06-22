// Thin fetch wrapper with JWT auth.

const TOKEN_KEY = "recruitai_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body, formData } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(path, {
    method,
    headers,
    body: formData ? formData : body ? JSON.stringify(body) : undefined,
  });

  // Only treat 401 as session expiry on authenticated endpoints — not login.
  const isLogin = path.endsWith("/login");
  if (res.status === 401 && !isLogin) {
    setToken(null);
    window.dispatchEvent(new Event("recruitai:logout"));
    throw new Error("Session expired. Please sign in again.");
  }
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (typeof data.detail === "string") detail = data.detail;
    } catch {
      /* keep default message */
    }
    throw new Error(detail);
  }
  return res.json();
}

export const api = {
  dashboard: () => request("/api/dashboard"),
  ranking: (jobId) => request(`/api/ranking${jobId ? `?job_id=${jobId}` : ""}`),

  listJobs: () => request("/api/jobs"),
  getJob: (id) => request(`/api/jobs/${id}`),
  createJob: (description) => request("/api/jobs", { method: "POST", body: { description } }),
  deleteJob: (id) => request(`/api/jobs/${id}`, { method: "DELETE" }),

  uploadCVs: (jobId, files) => {
    const formData = new FormData();
    for (const file of files) formData.append("files", file);
    return request(`/api/jobs/${jobId}/candidates/upload`, { method: "POST", formData });
  },

  listCandidates: (jobId, status) => {
    const params = new URLSearchParams();
    if (jobId) params.set("job_id", jobId);
    if (status) params.set("status", status);
    const qs = params.toString();
    return request(`/api/candidates${qs ? `?${qs}` : ""}`);
  },
  getCandidate: (id) => request(`/api/candidates/${id}`),
  updateStatus: (id, status) =>
    request(`/api/candidates/${id}/status`, { method: "PATCH", body: { status } }),
  deleteCandidate: (id) => request(`/api/candidates/${id}`, { method: "DELETE" }),

  analyze: (id) => request(`/api/candidates/${id}/analyze`, { method: "POST" }),
  generateQuestions: (id) => request(`/api/candidates/${id}/questions`, { method: "POST" }),
  submitEvaluation: (id, ratings, interviewer_notes) =>
    request(`/api/candidates/${id}/evaluation`, {
      method: "POST",
      body: { ratings, interviewer_notes },
    }),
  generateReport: (id) => request(`/api/candidates/${id}/report`, { method: "POST" }),

  createInterviewLink: (id) =>
    request(`/api/candidates/${id}/interview-link`, { method: "POST" }),
  rerunAssessment: (id) =>
    request(`/api/candidates/${id}/interview-session/assess`, { method: "POST" }),

  // Public (candidate-facing, token-based — no login required)
  getPublicInterview: (token) => request(`/api/interview/${token}`),
  startPublicInterview: (token) => request(`/api/interview/${token}/start`, { method: "POST" }),
  sendPublicInterviewMessage: (token, text) =>
    request(`/api/interview/${token}/message`, { method: "POST", body: { text } }),

  updateReport: (id, fields) =>
    request(`/api/candidates/${id}/report`, { method: "PATCH", body: fields }),

  resolveUsername: (username) => request("/api/auth/resolve", { method: "POST", body: { username } }),

  // Recruiter Tasks
  listRecruiterTasks: (status) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const qs = params.toString();
    return request(`/api/recruiter-tasks${qs ? `?${qs}` : ""}`);
  },
  getRecruiterTask: (id) => request(`/api/recruiter-tasks/${id}`),
  createRecruiterTask: (data) => request("/api/recruiter-tasks", { method: "POST", body: data }),
  updateRecruiterTask: (id, data) => request(`/api/recruiter-tasks/${id}`, { method: "PATCH", body: data }),
  deleteRecruiterTask: (id) => request(`/api/recruiter-tasks/${id}`, { method: "DELETE" }),
};

export async function downloadReportPdf(candidateId, candidateName) {
  const res = await fetch(`/api/candidates/${candidateId}/report/pdf`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("PDF export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report_${candidateName.replace(/\W+/g, "_")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export const STATUSES = [
  "New",
  "Shortlisted",
  "Interview Scheduled",
  "Interviewed",
  "Recommended",
  "Rejected",
  "Hired",
];

export const HUMAN_REVIEW_REMINDER =
  "Final hiring decisions must be reviewed and approved by a human recruiter or hiring manager.";
