type D1Statement = {
  bind: (...values: unknown[]) => D1Statement;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  all: <T = Record<string, unknown>>() => Promise<{ results: T[] }>;
  run: () => Promise<{ success: boolean }>;
};

type D1DatabaseLike = {
  prepare: (query: string) => D1Statement;
  batch: (statements: D1Statement[]) => Promise<unknown[]>;
};

type Env = {
  DB?: D1DatabaseLike;
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  password_salt: string;
  role: string;
  created_at: string;
};

type SessionUserRow = {
  session_id: string;
  expires_at: string;
  id: string;
  name: string;
  email: string;
  role: string;
};

type ChurchApplicationRow = {
  id: string;
  user_id: string;
  church_name: string;
  website: string;
  country: string;
  representative_name: string;
  representative_email: string;
  representative_role: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type AdminChurchApplicationRow = ChurchApplicationRow & {
  applicant_name: string;
  applicant_email: string;
};

type StudioChurchRow = {
  id: string;
  name: string;
  slug: string;
  website: string;
  country: string;
  verification_status: string;
  member_role: string;
};

type StudioChannelRow = StudioChurchRow & {
  description: string;
  city: string;
  service_times: string;
  logo_url: string;
  banner_url: string;
};

type SermonDraftRow = {
  id: string;
  church_id: string;
  created_by_user_id: string;
  content_type: string;
  title: string;
  description: string;
  category: string;
  scripture_reference: string;
  status: string;
  visibility: string;
  video_provider: string;
  video_uid: string;
  thumbnail_url: string;
  duration_seconds: number;
  created_at: string;
  updated_at: string;
};

const SESSION_COOKIE = "sermonsky_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
// Development/MVP setting chosen to stay within Workers Free CPU limits.
 // Before public production launch, move password auth to a dedicated auth
 // provider or increase the work factor on an appropriate runtime/plan.
const PASSWORD_ITERATIONS = 20_000;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (!url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204 });
    }

    try {
      if (url.pathname === "/api/health" && request.method === "GET") {
        return json({
          ok: true,
          service: "sermonsky-api",
          database: Boolean(env.DB),
        });
      }

      if (!env.DB) {
        return json(
          {
            error: "database_not_configured",
            message:
              "SermonSky D1 is not connected yet. Bind a D1 database as DB and apply the migrations.",
          },
          503,
        );
      }

      if (
        ["POST", "PUT", "PATCH", "DELETE"].includes(request.method) &&
        !isSameOriginRequest(request)
      ) {
        return json(
          {
            error: "invalid_origin",
            message: "This request did not originate from SermonSky.",
          },
          403,
        );
      }

      if (url.pathname === "/api/auth/register" && request.method === "POST") {
        return register(request, env.DB);
      }

      if (url.pathname === "/api/auth/login" && request.method === "POST") {
        return login(request, env.DB);
      }

      if (url.pathname === "/api/auth/logout" && request.method === "POST") {
        return logout(request, env.DB);
      }

      if (url.pathname === "/api/auth/me" && request.method === "GET") {
        const auth = await getAuthenticatedUser(request, env.DB);
        if (!auth) {
          return json({ user: null });
        }
        return json({ user: publicUser(auth.user) });
      }

      if (
        url.pathname === "/api/church-applications" &&
        request.method === "POST"
      ) {
        return submitChurchApplication(request, env.DB);
      }

      if (
        url.pathname === "/api/church-applications/me" &&
        request.method === "GET"
      ) {
        return getMyChurchApplication(request, env.DB);
      }

      if (url.pathname === "/api/studio/me" && request.method === "GET") {
        return getStudioAccess(request, env.DB);
      }

      if (url.pathname === "/api/studio/channel" && request.method === "GET") {
        return getStudioChannel(request, env.DB);
      }

      if (url.pathname === "/api/studio/channel" && request.method === "PATCH") {
        return updateStudioChannel(request, env.DB);
      }

      if (url.pathname === "/api/studio/drafts" && request.method === "GET") {
        return listStudioDrafts(request, env.DB);
      }

      if (url.pathname === "/api/studio/drafts" && request.method === "POST") {
        return createStudioDraft(request, env.DB);
      }

      const studioDraftMatch = url.pathname.match(
        /^\/api\/studio\/drafts\/([^/]+)$/,
      );
      if (studioDraftMatch && request.method === "PATCH") {
        const draftId = studioDraftMatch[1];
        if (!draftId) {
          return json(
            { error: "invalid_draft_id", message: "Draft ID is missing." },
            400,
          );
        }

        return updateStudioDraft(
          request,
          env.DB,
          decodeURIComponent(draftId),
        );
      }

      if (
        url.pathname === "/api/admin/church-applications" &&
        request.method === "GET"
      ) {
        return listChurchApplications(request, env.DB);
      }

      const reviewMatch = url.pathname.match(
        /^\/api\/admin\/church-applications\/([^/]+)\/review$/,
      );
      if (reviewMatch && request.method === "POST") {
        const applicationId = reviewMatch[1];
        if (!applicationId) {
          return json(
            { error: "invalid_application_id", message: "Application ID is missing." },
            400,
          );
        }

        return reviewChurchApplication(
          request,
          env.DB,
          decodeURIComponent(applicationId),
        );
      }

      return json({ error: "not_found", message: "API route not found." }, 404);
    } catch (error) {
      console.error("SermonSky API error", error);
      return json(
        {
          error: "internal_error",
          message: "Something went wrong while processing the request.",
        },
        500,
      );
    }
  },
};

async function register(request: Request, db: D1DatabaseLike) {
  const body = await readJson(request);
  const name = cleanString(body.name, 80);
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";

  if (name.length < 2) {
    return json(
      { error: "invalid_name", message: "Enter your full name." },
      400,
    );
  }

  if (!isValidEmail(email)) {
    return json(
      { error: "invalid_email", message: "Enter a valid email address." },
      400,
    );
  }

  if (password.length < 8 || password.length > 128) {
    return json(
      {
        error: "invalid_password",
        message: "Password must be between 8 and 128 characters.",
      },
      400,
    );
  }

  const existing = await db
    .prepare("SELECT id FROM users WHERE email = ? LIMIT 1")
    .bind(email)
    .first<{ id: string }>();

  if (existing) {
    return json(
      {
        error: "email_in_use",
        message: "An account with this email already exists.",
      },
      409,
    );
  }

  const userId = crypto.randomUUID();
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = bytesToBase64Url(saltBytes);
  const passwordHash = await derivePasswordHash(password, saltBytes);
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO users
       (id, name, email, password_hash, password_salt, role, created_at)
       VALUES (?, ?, ?, ?, ?, 'viewer', ?)`,
    )
    .bind(userId, name, email, passwordHash, salt, now)
    .run();

  const user = {
    id: userId,
    name,
    email,
    role: "viewer",
  };

  return createSessionResponse(request, db, user, 201);
}

async function login(request: Request, db: D1DatabaseLike) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";

  if (!isValidEmail(email) || !password) {
    return json(
      {
        error: "invalid_credentials",
        message: "Email or password is incorrect.",
      },
      401,
    );
  }

  const user = await db
    .prepare(
      `SELECT id, name, email, password_hash, password_salt, role, created_at
       FROM users WHERE email = ? LIMIT 1`,
    )
    .bind(email)
    .first<UserRow>();

  if (!user) {
    return json(
      {
        error: "invalid_credentials",
        message: "Email or password is incorrect.",
      },
      401,
    );
  }

  const saltBytes = base64UrlToBytes(user.password_salt);
  const candidateHash = await derivePasswordHash(password, saltBytes);

  if (!constantTimeEqual(candidateHash, user.password_hash)) {
    return json(
      {
        error: "invalid_credentials",
        message: "Email or password is incorrect.",
      },
      401,
    );
  }

  return createSessionResponse(
    request,
    db,
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    200,
  );
}

async function logout(request: Request, db: D1DatabaseLike) {
  const token = getCookie(request, SESSION_COOKIE);

  if (token) {
    const tokenHash = await hashSessionToken(token);
    await db
      .prepare("DELETE FROM sessions WHERE token_hash = ?")
      .bind(tokenHash)
      .run();
  }

  return json(
    { ok: true },
    200,
    {
      "Set-Cookie": serializeSessionCookie("", 0, request),
    },
  );
}

async function submitChurchApplication(
  request: Request,
  db: D1DatabaseLike,
) {
  const auth = await getAuthenticatedUser(request, db);
  if (!auth) {
    return json(
      {
        error: "authentication_required",
        message: "Sign in before applying for a Church Account.",
      },
      401,
    );
  }

  const body = await readJson(request);
  const churchName = cleanString(body.churchName, 120);
  const website = cleanString(body.website, 300);
  const country = cleanString(body.country, 80);
  const representativeName = cleanString(body.representativeName, 100);
  const representativeEmail = normalizeEmail(body.representativeEmail);
  const representativeRole = cleanString(body.role, 100);

  if (
    churchName.length < 2 ||
    website.length < 4 ||
    country.length < 2 ||
    representativeName.length < 2 ||
    representativeRole.length < 2 ||
    !isValidEmail(representativeEmail)
  ) {
    return json(
      {
        error: "invalid_application",
        message: "Complete all church and representative details.",
      },
      400,
    );
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO church_applications (
        id,
        user_id,
        church_name,
        website,
        country,
        representative_name,
        representative_email,
        representative_role,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        church_name = excluded.church_name,
        website = excluded.website,
        country = excluded.country,
        representative_name = excluded.representative_name,
        representative_email = excluded.representative_email,
        representative_role = excluded.representative_role,
        status = 'pending',
        updated_at = excluded.updated_at`,
    )
    .bind(
      id,
      auth.user.id,
      churchName,
      website,
      country,
      representativeName,
      representativeEmail,
      representativeRole,
      now,
      now,
    )
    .run();

  const application = await db
    .prepare(
      `SELECT id, user_id, church_name, website, country,
              representative_name, representative_email, representative_role,
              status, created_at, updated_at
       FROM church_applications WHERE user_id = ? LIMIT 1`,
    )
    .bind(auth.user.id)
    .first<ChurchApplicationRow>();

  return json({ application: serializeApplication(application!) }, 201);
}

async function getMyChurchApplication(
  request: Request,
  db: D1DatabaseLike,
) {
  const auth = await getAuthenticatedUser(request, db);
  if (!auth) {
    return json({ application: null }, 401);
  }

  const application = await db
    .prepare(
      `SELECT id, user_id, church_name, website, country,
              representative_name, representative_email, representative_role,
              status, created_at, updated_at
       FROM church_applications WHERE user_id = ? LIMIT 1`,
    )
    .bind(auth.user.id)
    .first<ChurchApplicationRow>();

  return json({
    application: application ? serializeApplication(application) : null,
  });
}

async function getStudioAccess(
  request: Request,
  db: D1DatabaseLike,
) {
  const auth = await getAuthenticatedUser(request, db);
  if (!auth) {
    return json({ hasAccess: false, church: null }, 401);
  }

  const church = await db
    .prepare(
      `SELECT
         c.id,
         c.name,
         c.slug,
         c.website,
         c.country,
         c.verification_status,
         cm.member_role
       FROM church_members cm
       JOIN churches c ON c.id = cm.church_id
       WHERE cm.user_id = ?
         AND c.verification_status = 'verified'
       LIMIT 1`,
    )
    .bind(auth.user.id)
    .first<StudioChurchRow>();

  return json({
    hasAccess: Boolean(church),
    church: church
      ? {
          id: church.id,
          name: church.name,
          slug: church.slug,
          website: church.website,
          country: church.country,
          verificationStatus: church.verification_status,
          memberRole: church.member_role,
        }
      : null,
  });
}

async function getStudioChannel(
  request: Request,
  db: D1DatabaseLike,
) {
  const studio = await requireStudioMember(request, db);
  if (studio instanceof Response) return studio;

  return json({ channel: serializeStudioChannel(studio.church) });
}

async function updateStudioChannel(
  request: Request,
  db: D1DatabaseLike,
) {
  const studio = await requireStudioMember(request, db);
  if (studio instanceof Response) return studio;

  if (!["owner", "admin"].includes(studio.church.member_role)) {
    return json(
      {
        error: "channel_admin_required",
        message: "Only church owners and admins can edit channel details.",
      },
      403,
    );
  }

  const body = await readJson(request);
  const name = cleanString(body.name, 120);
  const website = cleanString(body.website, 300);
  const country = cleanString(body.country, 80);
  const city = cleanString(body.city, 100);
  const description = cleanString(body.description, 1200);
  const serviceTimes = cleanString(body.serviceTimes, 500);
  const logoUrl = cleanString(body.logoUrl, 500);
  const bannerUrl = cleanString(body.bannerUrl, 500);

  if (name.length < 2 || website.length < 4 || country.length < 2) {
    return json(
      {
        error: "invalid_channel",
        message: "Church name, website, and country are required.",
      },
      400,
    );
  }

  const now = new Date().toISOString();

  await db
    .prepare(
      `UPDATE churches
       SET name = ?, website = ?, country = ?, city = ?,
           description = ?, service_times = ?, logo_url = ?,
           banner_url = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(
      name,
      website,
      country,
      city,
      description,
      serviceTimes,
      logoUrl,
      bannerUrl,
      now,
      studio.church.id,
    )
    .run();

  const channel = await getStudioChannelRow(
    db,
    studio.user.id,
    studio.church.id,
  );

  return json({ channel: serializeStudioChannel(channel!) });
}

async function listStudioDrafts(
  request: Request,
  db: D1DatabaseLike,
) {
  const studio = await requireStudioMember(request, db);
  if (studio instanceof Response) return studio;

  const result = await db
    .prepare(
      `SELECT id, church_id, created_by_user_id, content_type, title,
              description, category, scripture_reference, status, visibility,
              video_provider, video_uid, thumbnail_url, duration_seconds,
              created_at, updated_at
       FROM sermon_drafts
       WHERE church_id = ?
       ORDER BY updated_at DESC`,
    )
    .bind(studio.church.id)
    .all<SermonDraftRow>();

  return json({
    drafts: result.results.map(serializeDraft),
  });
}

async function createStudioDraft(
  request: Request,
  db: D1DatabaseLike,
) {
  const studio = await requireStudioMember(request, db);
  if (studio instanceof Response) return studio;

  const body = await readJson(request);
  const title = cleanString(body.title, 180);
  const description = cleanString(body.description, 5000);
  const category = cleanString(body.category, 80) || "Sermon";
  const scriptureReference = cleanString(body.scriptureReference, 180);
  const contentType =
    body.contentType === "short" ? "short" : "sermon";
  const visibility = ["public", "unlisted", "private"].includes(
    String(body.visibility),
  )
    ? String(body.visibility)
    : "public";

  if (title.length < 2) {
    return json(
      { error: "invalid_title", message: "Add a title for this draft." },
      400,
    );
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO sermon_drafts (
         id, church_id, created_by_user_id, content_type, title,
         description, category, scripture_reference, status, visibility,
         created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?)`,
    )
    .bind(
      id,
      studio.church.id,
      studio.user.id,
      contentType,
      title,
      description,
      category,
      scriptureReference,
      visibility,
      now,
      now,
    )
    .run();

  const draft = await getDraftById(db, studio.church.id, id);
  return json({ draft: serializeDraft(draft!) }, 201);
}

async function updateStudioDraft(
  request: Request,
  db: D1DatabaseLike,
  draftId: string,
) {
  const studio = await requireStudioMember(request, db);
  if (studio instanceof Response) return studio;

  const existing = await getDraftById(db, studio.church.id, draftId);
  if (!existing) {
    return json(
      { error: "draft_not_found", message: "Draft not found." },
      404,
    );
  }

  const body = await readJson(request);
  const title =
    body.title === undefined
      ? existing.title
      : cleanString(body.title, 180);
  const description =
    body.description === undefined
      ? existing.description
      : cleanString(body.description, 5000);
  const category =
    body.category === undefined
      ? existing.category
      : cleanString(body.category, 80) || "Sermon";
  const scriptureReference =
    body.scriptureReference === undefined
      ? existing.scripture_reference
      : cleanString(body.scriptureReference, 180);
  const contentType =
    body.contentType === undefined
      ? existing.content_type
      : body.contentType === "short"
        ? "short"
        : "sermon";
  const visibility =
    body.visibility === undefined
      ? existing.visibility
      : ["public", "unlisted", "private"].includes(String(body.visibility))
        ? String(body.visibility)
        : existing.visibility;

  if (title.length < 2) {
    return json(
      { error: "invalid_title", message: "Draft title is required." },
      400,
    );
  }

  const now = new Date().toISOString();

  await db
    .prepare(
      `UPDATE sermon_drafts
       SET content_type = ?, title = ?, description = ?, category = ?,
           scripture_reference = ?, visibility = ?, updated_at = ?
       WHERE id = ? AND church_id = ?`,
    )
    .bind(
      contentType,
      title,
      description,
      category,
      scriptureReference,
      visibility,
      now,
      draftId,
      studio.church.id,
    )
    .run();

  const draft = await getDraftById(db, studio.church.id, draftId);
  return json({ draft: serializeDraft(draft!) });
}

async function requireStudioMember(
  request: Request,
  db: D1DatabaseLike,
): Promise<
  | {
      user: { id: string; name: string; email: string; role: string };
      church: StudioChannelRow;
    }
  | Response
> {
  const auth = await getAuthenticatedUser(request, db);
  if (!auth) {
    return json(
      { error: "authentication_required", message: "Sign in first." },
      401,
    );
  }

  const church = await getStudioChannelRow(db, auth.user.id);
  if (!church) {
    return json(
      {
        error: "studio_access_required",
        message: "Verified church membership is required for SermonSky Studio.",
      },
      403,
    );
  }

  return { user: auth.user, church };
}

async function getStudioChannelRow(
  db: D1DatabaseLike,
  userId: string,
  churchId?: string,
): Promise<StudioChannelRow | null> {
  const query = churchId
    ? `SELECT c.id, c.name, c.slug, c.website, c.country,
              c.verification_status, c.description, c.city,
              c.service_times, c.logo_url, c.banner_url, cm.member_role
       FROM church_members cm
       JOIN churches c ON c.id = cm.church_id
       WHERE cm.user_id = ? AND c.id = ?
         AND c.verification_status = 'verified'
       LIMIT 1`
    : `SELECT c.id, c.name, c.slug, c.website, c.country,
              c.verification_status, c.description, c.city,
              c.service_times, c.logo_url, c.banner_url, cm.member_role
       FROM church_members cm
       JOIN churches c ON c.id = cm.church_id
       WHERE cm.user_id = ?
         AND c.verification_status = 'verified'
       LIMIT 1`;

  const statement = db.prepare(query);
  return churchId
    ? statement.bind(userId, churchId).first<StudioChannelRow>()
    : statement.bind(userId).first<StudioChannelRow>();
}

async function getDraftById(
  db: D1DatabaseLike,
  churchId: string,
  draftId: string,
): Promise<SermonDraftRow | null> {
  return db
    .prepare(
      `SELECT id, church_id, created_by_user_id, content_type, title,
              description, category, scripture_reference, status, visibility,
              video_provider, video_uid, thumbnail_url, duration_seconds,
              created_at, updated_at
       FROM sermon_drafts
       WHERE church_id = ? AND id = ?
       LIMIT 1`,
    )
    .bind(churchId, draftId)
    .first<SermonDraftRow>();
}

async function listChurchApplications(
  request: Request,
  db: D1DatabaseLike,
) {
  const admin = await requireAdmin(request, db);
  if (admin instanceof Response) return admin;

  const result = await db
    .prepare(
      `SELECT
         ca.id,
         ca.user_id,
         ca.church_name,
         ca.website,
         ca.country,
         ca.representative_name,
         ca.representative_email,
         ca.representative_role,
         ca.status,
         ca.created_at,
         ca.updated_at,
         u.name AS applicant_name,
         u.email AS applicant_email
       FROM church_applications ca
       JOIN users u ON u.id = ca.user_id
       ORDER BY
         CASE ca.status WHEN 'pending' THEN 0 ELSE 1 END,
         ca.created_at ASC`,
    )
    .all<AdminChurchApplicationRow>();

  return json({
    applications: result.results.map((row) => ({
      ...serializeApplication(row),
      applicantName: row.applicant_name,
      applicantEmail: row.applicant_email,
    })),
  });
}

async function reviewChurchApplication(
  request: Request,
  db: D1DatabaseLike,
  applicationId: string,
) {
  const admin = await requireAdmin(request, db);
  if (admin instanceof Response) return admin;

  const body = await readJson(request);
  const action = cleanString(body.action, 16);

  if (action !== "approve" && action !== "reject") {
    return json(
      {
        error: "invalid_review_action",
        message: "Review action must be approve or reject.",
      },
      400,
    );
  }

  const application = await db
    .prepare(
      `SELECT id, user_id, church_name, website, country,
              representative_name, representative_email, representative_role,
              status, created_at, updated_at
       FROM church_applications WHERE id = ? LIMIT 1`,
    )
    .bind(applicationId)
    .first<ChurchApplicationRow>();

  if (!application) {
    return json(
      { error: "application_not_found", message: "Application not found." },
      404,
    );
  }

  const now = new Date().toISOString();

  if (action === "reject") {
    await db
      .prepare(
        `UPDATE church_applications
         SET status = 'rejected', updated_at = ?
         WHERE id = ?`,
      )
      .bind(now, application.id)
      .run();

    return json({
      application: {
        ...serializeApplication(application),
        status: "rejected",
        updatedAt: now,
      },
    });
  }

  const existingChurch = await db
    .prepare(
      `SELECT id, name, slug, website, country,
              verification_status, 'owner' AS member_role
       FROM churches
       WHERE created_from_application_id = ?
       LIMIT 1`,
    )
    .bind(application.id)
    .first<StudioChurchRow>();

  const churchId = existingChurch?.id || crypto.randomUUID();
  const churchSlug =
    existingChurch?.slug ||
    makeChurchSlug(application.church_name, churchId);

  const statements: D1Statement[] = [];

  if (!existingChurch) {
    statements.push(
      db
        .prepare(
          `INSERT INTO churches (
             id, name, slug, website, country, verification_status,
             created_from_application_id, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, 'verified', ?, ?, ?)`,
        )
        .bind(
          churchId,
          application.church_name,
          churchSlug,
          application.website,
          application.country,
          application.id,
          now,
          now,
        ),
    );
  }

  statements.push(
    db
      .prepare(
        `INSERT INTO church_members
         (id, church_id, user_id, member_role, created_at)
         VALUES (?, ?, ?, 'owner', ?)
         ON CONFLICT(church_id, user_id) DO UPDATE SET
           member_role = 'owner'`,
      )
      .bind(
        crypto.randomUUID(),
        churchId,
        application.user_id,
        now,
      ),
  );

  statements.push(
    db
      .prepare(
        `UPDATE church_applications
         SET status = 'approved', updated_at = ?
         WHERE id = ?`,
      )
      .bind(now, application.id),
  );

  await db.batch(statements);

  return json({
    application: {
      ...serializeApplication(application),
      status: "approved",
      updatedAt: now,
    },
    church: {
      id: churchId,
      name: application.church_name,
      slug: churchSlug,
      website: application.website,
      country: application.country,
      verificationStatus: "verified",
      memberRole: "owner",
    },
  });
}

async function requireAdmin(
  request: Request,
  db: D1DatabaseLike,
): Promise<
  | {
      user: { id: string; name: string; email: string; role: string };
      sessionId: string;
    }
  | Response
> {
  const auth = await getAuthenticatedUser(request, db);

  if (!auth) {
    return json(
      { error: "authentication_required", message: "Sign in first." },
      401,
    );
  }

  if (auth.user.role !== "admin") {
    return json(
      {
        error: "admin_required",
        message: "SermonSky administrator access is required.",
      },
      403,
    );
  }

  return auth;
}

function makeChurchSlug(name: string, id: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${base || "church"}-${id.replace(/-/g, "").slice(0, 6)}`;
}

async function createSessionResponse(
  request: Request,
  db: D1DatabaseLike,
  user: { id: string; name: string; email: string; role: string },
  status: number,
) {
  const rawToken = randomToken(32);
  const tokenHash = await hashSessionToken(rawToken);
  const sessionId = crypto.randomUUID();
  const createdAt = new Date();
  const expiresAt = new Date(
    createdAt.getTime() + SESSION_TTL_SECONDS * 1000,
  );

  await db
    .prepare(
      `INSERT INTO sessions
       (id, user_id, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(
      sessionId,
      user.id,
      tokenHash,
      expiresAt.toISOString(),
      createdAt.toISOString(),
    )
    .run();

  return json(
    { user: publicUser(user) },
    status,
    {
      "Set-Cookie": serializeSessionCookie(
        rawToken,
        SESSION_TTL_SECONDS,
        request,
      ),
    },
  );
}

async function getAuthenticatedUser(
  request: Request,
  db: D1DatabaseLike,
): Promise<{
  user: { id: string; name: string; email: string; role: string };
  sessionId: string;
} | null> {
  const rawToken = getCookie(request, SESSION_COOKIE);
  if (!rawToken) return null;

  const tokenHash = await hashSessionToken(rawToken);
  const row = await db
    .prepare(
      `SELECT
         s.id AS session_id,
         s.expires_at AS expires_at,
         u.id AS id,
         u.name AS name,
         u.email AS email,
         u.role AS role
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?
       LIMIT 1`,
    )
    .bind(tokenHash)
    .first<SessionUserRow>();

  if (!row) return null;

  if (Date.parse(row.expires_at) <= Date.now()) {
    await db.prepare("DELETE FROM sessions WHERE id = ?").bind(row.session_id).run();
    return null;
  }

  return {
    sessionId: row.session_id,
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
    },
  };
}

async function derivePasswordHash(
  password: string,
  salt: Uint8Array,
): Promise<string> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: Uint8Array.from(salt),
      iterations: PASSWORD_ITERATIONS,
    },
    material,
    256,
  );

  return bytesToBase64Url(new Uint8Array(bits));
}

async function hashSessionToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return bytesToBase64Url(new Uint8Array(digest));
}

function randomToken(length: number): string {
  return bytesToBase64Url(
    crypto.getRandomValues(new Uint8Array(length)),
  );
}

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function serializeApplication(row: ChurchApplicationRow) {
  return {
    id: row.id,
    userId: row.user_id,
    churchName: row.church_name,
    website: row.website,
    country: row.country,
    representativeName: row.representative_name,
    representativeEmail: row.representative_email,
    role: row.representative_role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function serializeStudioChannel(row: StudioChannelRow) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    website: row.website,
    country: row.country,
    city: row.city,
    description: row.description,
    serviceTimes: row.service_times,
    logoUrl: row.logo_url,
    bannerUrl: row.banner_url,
    verificationStatus: row.verification_status,
    memberRole: row.member_role,
  };
}

function serializeDraft(row: SermonDraftRow) {
  return {
    id: row.id,
    churchId: row.church_id,
    createdByUserId: row.created_by_user_id,
    contentType: row.content_type,
    title: row.title,
    description: row.description,
    category: row.category,
    scriptureReference: row.scripture_reference,
    status: row.status,
    visibility: row.visibility,
    videoProvider: row.video_provider,
    videoUid: row.video_uid,
    thumbnailUrl: row.thumbnail_url,
    durationSeconds: row.duration_seconds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 16_384) {
    throw new Error("Request body too large");
  }

  const body = await request.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {};
  }
  return body as Record<string, unknown>;
}

function cleanString(value: unknown, maxLength: number): string {
  return typeof value === "string"
    ? value.trim().slice(0, maxLength)
    : "";
}

function normalizeEmail(value: unknown): string {
  return cleanString(value, 254).toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return mismatch === 0;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function getCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get("Cookie");
  if (!cookie) return null;

  for (const part of cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }

  return null;
}

function serializeSessionCookie(
  value: string,
  maxAge: number,
  request: Request,
): string {
  const isHttps = new URL(request.url).protocol === "https:";
  const secure = isHttps ? "; Secure" : "";

  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return true;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function json(
  data: unknown,
  status = 200,
  extraHeaders?: Record<string, string>,
): Response {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extraHeaders,
  });

  return new Response(JSON.stringify(data), { status, headers });
}
