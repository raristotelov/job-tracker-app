-- ============================================================
-- TABLE: applications
-- One record per job application. Core entity of the app.
-- ============================================================
CREATE TABLE applications (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id       uuid        REFERENCES sections(id) ON DELETE SET NULL,
  company_name     text        NOT NULL
                               CONSTRAINT applications_company_name_length
                                 CHECK (char_length(company_name) <= 200),
  position_title   text        NOT NULL
                               CONSTRAINT applications_position_title_length
                                 CHECK (char_length(position_title) <= 200),
  job_posting_url  text        CONSTRAINT applications_url_length
                                 CHECK (job_posting_url IS NULL OR char_length(job_posting_url) <= 2000),
  location         text        CONSTRAINT applications_location_length
                                 CHECK (location IS NULL OR char_length(location) <= 200),
  work_type        text        CONSTRAINT applications_work_type_check
                                 CHECK (work_type IS NULL OR work_type IN ('remote', 'hybrid', 'on_site')),
  salary_range_min integer     CONSTRAINT applications_salary_min_check
                                 CHECK (salary_range_min IS NULL OR salary_range_min >= 0),
  salary_range_max integer     CONSTRAINT applications_salary_max_check
                                 CHECK (salary_range_max IS NULL OR salary_range_max >= 0),
  status           text        NOT NULL DEFAULT 'applied'
                               CONSTRAINT applications_status_check
                                 CHECK (status IN (
                                   'applied',
                                   'interview_scheduled',
                                   'interview_completed',
                                   'offer_received',
                                   'rejected'
                                 )),
  date_applied     date        NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  -- Cross-column constraint: max >= min when both are provided.
  CONSTRAINT applications_salary_range_check
    CHECK (
      salary_range_min IS NULL
      OR salary_range_max IS NULL
      OR salary_range_max >= salary_range_min
    )
);

-- Index for the default list query: all applications for a user ordered by date_applied desc.
CREATE INDEX applications_user_date_idx
  ON applications (user_id, date_applied DESC);

-- Index for fetching applications by section (used in By Section grouping and section counts).
CREATE INDEX applications_section_id_idx
  ON applications (section_id)
  WHERE section_id IS NOT NULL;

-- Auto-update updated_at on modification.
CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: Users can only access their own applications.
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own applications"
  ON applications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
