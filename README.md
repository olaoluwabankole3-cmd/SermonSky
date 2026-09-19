# SermonSky

SermonSky is a mobile-first Christian video platform built around one core trust rule:

> **Only verified churches and approved Christian ministries can publish content.**

Viewers can discover sermons, watch Shorts, follow churches, save messages, and build a faith-focused feed without an open public upload system.

## Current milestone

This repository currently contains the first navigable mobile UI prototype:

- Sky-blue and white cloud-themed SermonSky design system
- Home feed with featured sermon
- Sermon detail / player screen
- Shorts experience
- Discover and local search UI
- Verified church discovery cards
- Library / saved content screen
- Viewer profile
- SermonSky Studio entry point for verified churches
- Reusable video card and brand components

The content is mock data for now. Authentication, church verification, uploads, video storage, feeds, and analytics will be connected in later milestones.

## Stack

- Expo SDK 57
- React Native 0.86
- React 19.2
- TypeScript

Expo SDK 57 requires Node.js 22.13 or newer.

## Run locally

```bash
npm install
npm start
```

Then open the project with Expo Go / a development build, or run:

```bash
npm run android
npm run ios
```


## Cloudflare Workers preview

SermonSky is configured for **Cloudflare Workers Static Assets**.

Use these settings in **Workers & Pages → SermonSky → Settings → Builds**:

- **Production branch:** `main`
- **Build command:** `npm run build:web`
- **Deploy command:** `npx wrangler deploy`
- **Root directory:** `/`
- **Node.js:** 22.13 or newer

The Expo web export is written to `dist/`, and `wrangler.jsonc` serves that directory as a single-page application.

To run the same flow locally:

```bash
npm install
npm run build:web
npx wrangler dev
```

To deploy manually:

```bash
npm run deploy
```

Every push to `main` can trigger a fresh Cloudflare Worker build and deployment once Git integration is enabled.

## D1 database and authentication

SermonSky now contains a Worker API and D1 migration for real viewer accounts,
server-side sessions, and persistent Church Account applications.

### Create the database

From a Cloudflare-authenticated terminal:

```bash
npm install
npm run db:create
```

That command creates `sermonsky-db` and asks Wrangler to add a D1 binding named
`DB` to `wrangler.jsonc`.

Alternatively, create a D1 database named `sermonsky-db` in the Cloudflare
dashboard, copy its database ID, and add this block to `wrangler.jsonc`:

```json
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "sermonsky-db",
    "database_id": "YOUR_DATABASE_ID"
  }
]
```

### Apply the schema

After the `DB` binding exists:

```bash
npm run db:migrate:remote
```

The migration creates:

- `users`
- `sessions`
- `church_applications`

For local development, use:

```bash
npm run db:migrate:local
npm run preview:cf
```

### API routes

The Worker currently exposes:

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/church-applications`
- `GET /api/church-applications/me`

Passwords are derived with PBKDF2-SHA-256 plus a per-user random salt. Session
tokens are stored as SHA-256 hashes in D1 and delivered to the browser through
HttpOnly, SameSite cookies.

Until the `DB` binding is connected, `GET /api/health` remains available and
reports `database: false`; database-backed endpoints return a setup message
instead of breaking the static SermonSky app.

## SermonSky Studio

Verified church members now have a dedicated Studio surface with:

- Studio overview and channel-readiness checks
- Editable verified church profile
- Persistent sermon and Short drafts
- Church-member permission checks on every Studio API route

Studio API routes:

- `GET /api/studio/me`
- `GET /api/studio/channel`
- `PATCH /api/studio/channel`
- `GET /api/studio/drafts`
- `POST /api/studio/drafts`
- `PATCH /api/studio/drafts/:id`

The Studio database migration is:

```text
migrations/0003_studio_channels_and_sermon_drafts.sql
```

Apply it to the remote D1 database before using the Studio UI:

```bash
npm run db:migrate:remote
```

The next publishing milestone will connect direct media uploads and video
processing after draft records and church permissions are established.

## Product architecture

SermonSky will eventually have three surfaces:

1. **SermonSky** — viewer app for sermons, Shorts, following, search, and saved content.
2. **SermonSky Studio** — church publishing, content management, and analytics.
3. **SermonSky Admin** — church verification, moderation, reports, and platform operations.

## Planned next milestones

- Authentication and viewer profiles
- Church application + verification workflow
- Backend database and API
- Video upload and processing pipeline
- Real church/channel pages
- Follows, likes, saves, watch history
- Recommendation feed
- Shorts upload/playback
- Push notifications
- Moderation and reporting
- Livestreaming (later release)

## Brand

Primary palette:

- Sky blue: `#59B8F6`
- Strong sky: `#2A9DEE`
- Navy: `#0B3B75`
- Cloud white: `#F7FCFF`

Brand direction: **clean, uplifting, premium, cloud-inspired, content-first**.
