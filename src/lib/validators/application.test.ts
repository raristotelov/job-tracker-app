import { applicationCreateSchema, applicationUpdateSchema } from './application';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns today's date as YYYY-MM-DD in local time. */
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Returns a date N days in the future as YYYY-MM-DD. */
function futureDate(daysAhead = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Minimal valid payload — only required fields. */
const validBase = {
  company_name: 'Acme Corp',
  position_title: 'Software Engineer',
  date_applied: today(),
};

/** Full valid payload with all optional fields populated. */
const validFull = {
  ...validBase,
  job_posting_url: 'https://acme.com/jobs/123',
  location: 'Austin, TX',
  work_type: 'remote' as const,
  salary_range_min: 80000,
  salary_range_max: 120000,
  status: 'applied' as const,
  section_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
};

// ---------------------------------------------------------------------------
// applicationCreateSchema
// ---------------------------------------------------------------------------

describe('applicationCreateSchema', () => {
  describe('valid inputs', () => {
    it('accepts a minimal payload with only required fields', () => {
      const result = applicationCreateSchema.safeParse(validBase);
      expect(result.success).toBe(true);
    });

    it('accepts a fully populated payload', () => {
      const result = applicationCreateSchema.safeParse(validFull);
      expect(result.success).toBe(true);
    });

    it('defaults status to "applied" when not provided', () => {
      const result = applicationCreateSchema.safeParse(validBase);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('applied');
      }
    });

    it('accepts status "interview_scheduled"', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        status: 'interview_scheduled',
      });
      expect(result.success).toBe(true);
    });

    it('accepts all valid work_type values', () => {
      const workTypes = ['remote', 'hybrid', 'on_site'] as const;
      for (const wt of workTypes) {
        const result = applicationCreateSchema.safeParse({ ...validBase, work_type: wt });
        expect(result.success).toBe(true);
      }
    });

    it('coerces null section_id to null in output', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        section_id: null,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.section_id).toBeNull();
      }
    });

    it('coerces undefined optional fields to null in output', () => {
      const result = applicationCreateSchema.safeParse(validBase);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.job_posting_url).toBeNull();
        expect(result.data.location).toBeNull();
        expect(result.data.work_type).toBeNull();
        expect(result.data.salary_range_min).toBeNull();
        expect(result.data.salary_range_max).toBeNull();
        expect(result.data.section_id).toBeNull();
      }
    });

    it('accepts today as date_applied', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        date_applied: today(),
      });
      expect(result.success).toBe(true);
    });

    it('accepts a past date as date_applied', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        date_applied: '2024-01-01',
      });
      expect(result.success).toBe(true);
    });

    it('accepts salary_range_min of 0', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        salary_range_min: 0,
      });
      expect(result.success).toBe(true);
    });

    it('accepts equal min and max salary values', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        salary_range_min: 100000,
        salary_range_max: 100000,
      });
      expect(result.success).toBe(true);
    });

    it('trims whitespace from company_name', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        company_name: '  Acme Corp  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.company_name).toBe('Acme Corp');
      }
    });

    it('trims whitespace from position_title', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        position_title: '  Senior Dev  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.position_title).toBe('Senior Dev');
      }
    });
  });

  describe('AC-4: required field validation', () => {
    it('fails when company_name is empty string', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        company_name: '',
      });
      expect(result.success).toBe(false);
    });

    it('fails when company_name is null', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        company_name: null,
      });
      expect(result.success).toBe(false);
    });

    it('fails when position_title is empty string', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        position_title: '',
      });
      expect(result.success).toBe(false);
    });

    it('fails when date_applied is missing', () => {
      const { date_applied: _ignored, ...withoutDate } = validBase;
      const result = applicationCreateSchema.safeParse(withoutDate);
      expect(result.success).toBe(false);
    });

    it('returns "Company name is required" error for empty company_name', () => {
      const result = applicationCreateSchema.safeParse({ ...validBase, company_name: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const msg = result.error.issues.find(i => i.path[0] === 'company_name')?.message;
        expect(msg).toBe('Company name is required');
      }
    });

    it('returns "Position title is required" error for empty position_title', () => {
      const result = applicationCreateSchema.safeParse({ ...validBase, position_title: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const msg = result.error.issues.find(i => i.path[0] === 'position_title')?.message;
        expect(msg).toBe('Position title is required');
      }
    });
  });

  describe('AC-5: URL validation', () => {
    it('fails when job_posting_url is not a valid URL', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        job_posting_url: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('returns "Please enter a valid URL" for an invalid URL', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        job_posting_url: 'not-a-url',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const msg = result.error.issues.find(i => i.path[0] === 'job_posting_url')?.message;
        expect(msg).toBe('Please enter a valid URL');
      }
    });

    it('accepts a valid https URL', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        job_posting_url: 'https://example.com/jobs/123',
      });
      expect(result.success).toBe(true);
    });

    it('accepts a valid http URL', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        job_posting_url: 'http://example.com/jobs/123',
      });
      expect(result.success).toBe(true);
    });

    it('accepts null job_posting_url', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        job_posting_url: null,
      });
      expect(result.success).toBe(true);
    });

    it('accepts undefined job_posting_url (treated as null)', () => {
      const result = applicationCreateSchema.safeParse(validBase);
      expect(result.success).toBe(true);
    });

    it('fails for a URL exceeding 2000 characters', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(1990);
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        job_posting_url: longUrl,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('AC-6: salary range cross-field validation', () => {
    it('fails when max is less than min', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        salary_range_min: 100000,
        salary_range_max: 80000,
      });
      expect(result.success).toBe(false);
    });

    it('returns "Maximum must be greater than or equal to minimum" when max < min', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        salary_range_min: 100000,
        salary_range_max: 80000,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const msg = result.error.issues.find(i => i.path[0] === 'salary_range_max')?.message;
        expect(msg).toBe('Maximum must be greater than or equal to minimum');
      }
    });

    it('passes when max equals min', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        salary_range_min: 80000,
        salary_range_max: 80000,
      });
      expect(result.success).toBe(true);
    });

    it('passes when only min is provided (no max to compare)', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        salary_range_min: 80000,
        salary_range_max: null,
      });
      expect(result.success).toBe(true);
    });

    it('passes when only max is provided (no min to compare)', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        salary_range_min: null,
        salary_range_max: 120000,
      });
      expect(result.success).toBe(true);
    });

    it('fails when salary_range_min is negative', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        salary_range_min: -1,
      });
      expect(result.success).toBe(false);
    });

    it('fails when salary_range_max is negative', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        salary_range_max: -1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('AC-7: future date validation', () => {
    it('fails when date_applied is in the future', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        date_applied: futureDate(1),
      });
      expect(result.success).toBe(false);
    });

    it('returns "Date applied cannot be in the future" for a future date', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        date_applied: futureDate(7),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const msg = result.error.issues.find(i => i.path[0] === 'date_applied')?.message;
        expect(msg).toBe('Date applied cannot be in the future');
      }
    });

    it('fails for a non-date string in date_applied', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        date_applied: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('field length constraints', () => {
    it('fails when company_name exceeds 200 characters', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        company_name: 'a'.repeat(201),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const msg = result.error.issues.find(i => i.path[0] === 'company_name')?.message;
        expect(msg).toBe('Company name must be 200 characters or fewer');
      }
    });

    it('accepts company_name of exactly 200 characters', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        company_name: 'a'.repeat(200),
      });
      expect(result.success).toBe(true);
    });

    it('fails when position_title exceeds 200 characters', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        position_title: 'b'.repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it('fails when location exceeds 200 characters', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        location: 'x'.repeat(201),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('status validation', () => {
    it('accepts all valid status values', () => {
      const statuses = [
        'applied',
        'interview_scheduled',
        'interview_completed',
        'offer_received',
        'rejected',
      ] as const;
      for (const status of statuses) {
        const result = applicationCreateSchema.safeParse({ ...validBase, status });
        expect(result.success).toBe(true);
      }
    });

    it('fails for an invalid status value', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        status: 'pending',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('section_id validation', () => {
    it('accepts a valid UUID for section_id', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        section_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
      expect(result.success).toBe(true);
    });

    it('fails for a non-UUID string in section_id', () => {
      const result = applicationCreateSchema.safeParse({
        ...validBase,
        section_id: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// applicationUpdateSchema
// ---------------------------------------------------------------------------

describe('applicationUpdateSchema', () => {
  it('has identical validation rules to applicationCreateSchema', () => {
    // Both schemas should accept the same valid payload
    const createResult = applicationCreateSchema.safeParse(validFull);
    const updateResult = applicationUpdateSchema.safeParse(validFull);
    expect(createResult.success).toBe(true);
    expect(updateResult.success).toBe(true);
  });

  it('enforces the same future date rule as createSchema', () => {
    const result = applicationUpdateSchema.safeParse({
      ...validBase,
      date_applied: futureDate(3),
    });
    expect(result.success).toBe(false);
  });

  it('enforces the same salary cross-field rule as createSchema', () => {
    const result = applicationUpdateSchema.safeParse({
      ...validBase,
      salary_range_min: 200000,
      salary_range_max: 100000,
    });
    expect(result.success).toBe(false);
  });
});
