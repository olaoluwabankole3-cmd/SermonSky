PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS churches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  website TEXT NOT NULL,
  country TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'verified'
    CHECK (verification_status IN ('verified', 'suspended')),
  created_from_application_id TEXT UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (created_from_application_id)
    REFERENCES church_applications(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS church_members (
  id TEXT PRIMARY KEY,
  church_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  member_role TEXT NOT NULL DEFAULT 'owner'
    CHECK (member_role IN ('owner', 'admin', 'editor')),
  created_at TEXT NOT NULL,
  UNIQUE(church_id, user_id),
  FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_church_members_user_id
  ON church_members(user_id);

CREATE INDEX IF NOT EXISTS idx_church_members_church_id
  ON church_members(church_id);

CREATE INDEX IF NOT EXISTS idx_churches_verification_status
  ON churches(verification_status);
