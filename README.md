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
