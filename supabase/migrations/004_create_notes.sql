-- ============================================================
-- TABLE: notes
-- Rich-text notes attached to applications. Content stored as
-- Tiptap JSONContent in a JSONB column.
-- ============================================================
CREATE TABLE notes (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid        NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content         jsonb       NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Index for fetching all notes for an application in reverse-chronological order.
CREATE INDEX notes_application_created_idx
  ON notes (application_id, created_at DESC);

-- Index for RLS policy evaluation (user_id lookups).
CREATE INDEX notes_user_id_idx
  ON notes (user_id);

-- Auto-update updated_at on modification.
CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: Users can only access their own notes.
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notes"
  ON notes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
