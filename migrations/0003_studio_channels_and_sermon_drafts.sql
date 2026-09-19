PRAGMA foreign_keys = ON;

ALTER TABLE churches ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE churches ADD COLUMN city TEXT NOT NULL DEFAULT '';
ALTER TABLE churches ADD COLUMN service_times TEXT NOT NULL DEFAULT '';
ALTER TABLE churches ADD COLUMN logo_url TEXT NOT NULL DEFAULT '';
ALTER TABLE churches ADD COLUMN banner_url TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS sermon_drafts (
  id TEXT PRIMARY KEY,
  church_id TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'sermon'
    CHECK (content_type IN ('sermon', 'short')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Sermon',
  scripture_reference TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'ready', 'published', 'archived')),
  visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'unlisted', 'private')),
  video_provider TEXT NOT NULL DEFAULT '',
  video_uid TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sermon_drafts_church_id
  ON sermon_drafts(church_id);

CREATE INDEX IF NOT EXISTS idx_sermon_drafts_status
  ON sermon_drafts(church_id, status);

CREATE INDEX IF NOT EXISTS idx_sermon_drafts_updated_at
  ON sermon_drafts(church_id, updated_at);
