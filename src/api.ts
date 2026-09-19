export type ViewerSession = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type ChurchApplicationRecord = {
  id: string;
  userId: string;
  churchName: string;
  website: string;
  country: string;
  representativeName: string;
  representativeEmail: string;
  role: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
};

export type ChurchApplicationInput = {
  churchName: string;
  website: string;
  country: string;
  representativeName: string;
  representativeEmail: string;
  role: string;
};

const API_BASE =
  typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL
    ? process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "")
    : "";

export async function registerViewer(input: {
  name: string;
  email: string;
  password: string;
}): Promise<ViewerSession> {
  const result = await apiRequest<{ user: ViewerSession }>(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return result.user;
}

export async function loginViewer(input: {
  email: string;
  password: string;
}): Promise<ViewerSession> {
  const result = await apiRequest<{ user: ViewerSession }>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return result.user;
}

export async function logoutViewer(): Promise<void> {
  await apiRequest<{ ok: boolean }>("/api/auth/logout", {
    method: "POST",
  });
}

export async function getCurrentViewer(): Promise<ViewerSession | null> {
  const result = await apiRequest<{ user: ViewerSession | null }>(
    "/api/auth/me",
  );
  return result.user;
}

export async function submitChurchApplication(
  input: ChurchApplicationInput,
): Promise<ChurchApplicationRecord> {
  const result = await apiRequest<{
    application: ChurchApplicationRecord;
  }>("/api/church-applications", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return result.application;
}

export async function getMyChurchApplication(): Promise<ChurchApplicationRecord | null> {
  try {
    const result = await apiRequest<{
      application: ChurchApplicationRecord | null;
    }>("/api/church-applications/me");
    return result.application;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = "api_error") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        message?: string;
        error?: string;
      }
    | T
    | null;

  if (!response.ok) {
    const errorPayload = payload as
      | { message?: string; error?: string }
      | null;

    throw new ApiError(
      errorPayload?.message || "SermonSky could not complete that request.",
      response.status,
      errorPayload?.error,
    );
  }

  return payload as T;
}
