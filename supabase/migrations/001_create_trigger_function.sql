-- ============================================================
-- TRIGGER FUNCTION: Auto-update updated_at on row modification
-- Shared by all tables that have an updated_at column.
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
