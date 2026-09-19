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

export type StudioChurch = {
  id: string;
  name: string;
  slug: string;
  website: string;
  country: string;
  verificationStatus: "verified" | "suspended";
  memberRole: "owner" | "admin" | "editor";
};

export type StudioAccess = {
  hasAccess: boolean;
  church: StudioChurch | null;
};

export type AdminChurchApplication = ChurchApplicationRecord & {
  applicantName: string;
  applicantEmail: string;
};

export type StudioChannel = {
  id: string;
  name: string;
  slug: string;
  website: string;
  country: string;
  city: string;
  description: string;
  serviceTimes: string;
  logoUrl: string;
  bannerUrl: string;
  verificationStatus: "verified" | "suspended";
  memberRole: "owner" | "admin" | "editor";
};

export type StudioDraft = {
  id: string;
  churchId: string;
  createdByUserId: string;
  contentType: "sermon" | "short";
  title: string;
  description: string;
  category: string;
  scriptureReference: string;
  status: "draft" | "ready" | "published" | "archived";
  visibility: "public" | "unlisted" | "private";
  videoProvider: string;
  videoUid: string;
  thumbnailUrl: string;
  durationSeconds: number;
  createdAt: string;
  updatedAt: string;
};

export type StudioDraftInput = {
  contentType?: "sermon" | "short";
  title: string;
  description?: string;
  category?: string;
  scriptureReference?: string;
  visibility?: "public" | "unlisted" | "private";
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

export async function getStudioAccess(): Promise<StudioAccess> {
  try {
    return await apiRequest<StudioAccess>("/api/studio/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return { hasAccess: false, church: null };
    }
    throw error;
  }
}

export async function getStudioChannel(): Promise<StudioChannel> {
  const result = await apiRequest<{ channel: StudioChannel }>(
    "/api/studio/channel",
  );
  return result.channel;
}

export async function updateStudioChannel(
  input: Pick<
    StudioChannel,
    | "name"
    | "website"
    | "country"
    | "city"
    | "description"
    | "serviceTimes"
    | "logoUrl"
    | "bannerUrl"
  >,
): Promise<StudioChannel> {
  const result = await apiRequest<{ channel: StudioChannel }>(
    "/api/studio/channel",
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
  return result.channel;
}

export async function listStudioDrafts(): Promise<StudioDraft[]> {
  const result = await apiRequest<{ drafts: StudioDraft[] }>(
    "/api/studio/drafts",
  );
  return result.drafts;
}

export async function createStudioDraft(
  input: StudioDraftInput,
): Promise<StudioDraft> {
  const result = await apiRequest<{ draft: StudioDraft }>(
    "/api/studio/drafts",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return result.draft;
}

export async function updateStudioDraft(
  draftId: string,
  input: Partial<StudioDraftInput>,
): Promise<StudioDraft> {
  const result = await apiRequest<{ draft: StudioDraft }>(
    `/api/studio/drafts/${encodeURIComponent(draftId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
  return result.draft;
}

export async function listAdminChurchApplications(): Promise<AdminChurchApplication[]> {
  const result = await apiRequest<{
    applications: AdminChurchApplication[];
  }>("/api/admin/church-applications");
  return result.applications;
}

export async function reviewChurchApplication(
  applicationId: string,
  action: "approve" | "reject",
): Promise<{
  application: ChurchApplicationRecord;
  church?: StudioChurch;
}> {
  return apiRequest(
    `/api/admin/church-applications/${encodeURIComponent(applicationId)}/review`,
    {
      method: "POST",
      body: JSON.stringify({ action }),
    },
  );
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

  const rawBody = await response.text();
  let payload: unknown = null;

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const errorPayload =
      payload && typeof payload === "object"
        ? (payload as { message?: string; error?: string })
        : null;

    const platformMessage =
      response.status >= 500 && !errorPayload?.message
        ? `SermonSky backend returned HTTP ${response.status}. This usually means the Cloudflare Worker hit a runtime or resource error.`
        : `SermonSky request failed (HTTP ${response.status}).`;

    throw new ApiError(
      errorPayload?.message || platformMessage,
      response.status,
      errorPayload?.error || "platform_error",
    );
  }

  return payload as T;
}
