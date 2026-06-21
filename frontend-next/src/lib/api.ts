import type { WorkItem, WorkItemComment, Release, ScoreSummary } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

// ─── Token helpers ────────────────────────────────────────────────────────────

export type LoginResponse = {
  accessToken: string;
  user: { id: string; name: string; email: string; role: string };
};

export function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('spoton_challenge_token');
}

export function saveToken(token: string) {
  window.localStorage.setItem('spoton_challenge_token', token);
}

export function clearToken() {
  window.localStorage.removeItem('spoton_challenge_token');
}

// ─── Base request ─────────────────────────────────────────────────────────────

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res  = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data?.message ?? 'Request failed');
  return data as T;
}

// ─── API surface ──────────────────────────────────────────────────────────────

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<LoginResponse['user']>('/auth/me'),

  // Score
  score: () => request<ScoreSummary>('/score/me'),

  awardScore: (action: string, points: number) =>
    request('/score/events', {
      method: 'POST',
      body: JSON.stringify({ action, points }),
    }),

  // Workspace summary
  workspaceSummary: () =>
    request<{ workItems: Record<string, number>; qaChecks: number; releases: number }>(
      '/it-workspace/summary',
    ),

  // Work items
  workItems: (params?: {
    status?: string;
    priority?: string;
    assignee?: string;
    search?: string;
    mine?: boolean;
  }) => {
    const qs = new URLSearchParams();
    if (params?.status)   qs.set('status',   params.status);
    if (params?.priority) qs.set('priority', params.priority);
    if (params?.assignee) qs.set('assignee', params.assignee);
    if (params?.search)   qs.set('search',   params.search);
    if (params?.mine)     qs.set('mine',     'true');
    const query = qs.toString();
    return request<WorkItem[]>(`/it-workspace/work-items${query ? `?${query}` : ''}`);
  },

  workItem: (id: string) =>
    request<WorkItem>(`/it-workspace/work-items/${id}`),

  workItemComments: (id: string) =>
    request<WorkItemComment[]>(`/it-workspace/work-items/${id}/comments`),

  addWorkItemComment: (id: string, message: string) =>
    request<WorkItemComment>(`/it-workspace/work-items/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  createWorkItem: (body: Partial<WorkItem>) =>
    request<WorkItem>('/it-workspace/work-items', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateWorkItem: (id: string, body: Partial<WorkItem>) =>
    request<WorkItem>(`/it-workspace/work-items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  transitionWorkItem: (id: string, status: string) =>
    request<WorkItem>(`/it-workspace/work-items/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteWorkItem: (id: string) =>
    request<{ deleted: boolean }>(`/it-workspace/work-items/${id}`, {
      method: 'DELETE',
    }),

  // Releases (stub — filled in Step 7)
  releases: () => request<Release[]>('/it-workspace/releases'),
};
