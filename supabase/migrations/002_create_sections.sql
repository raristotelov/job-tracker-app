-- ============================================================
-- TABLE: sections
-- User-defined groups for organizing applications.
-- ============================================================
CREATE TABLE sections (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL
                          CONSTRAINT sections_name_length CHECK (char_length(name) <= 100),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Enforce unique section names per user (case-insensitive).
CREATE UNIQUE INDEX sections_user_name_unique
  ON sections (user_id, lower(name));

-- Index for fetching all sections for a user, ordered by name.
CREATE INDEX sections_user_id_name_idx
  ON sections (user_id, name);

-- Auto-update updated_at on modification.
CREATE TRIGGER sections_updated_at
  BEFORE UPDATE ON sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: Users can only access their own sections.
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sections"
  ON sections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
