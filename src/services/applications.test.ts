/**
 * Tests for the createApplication, updateApplication, and deleteApplication
 * server actions.
 *
 * Strategy:
 * - Mock `@/lib/supabase/server` to return a fully controllable fake Supabase client.
 * - Mock `next/cache` (revalidatePath) and `next/navigation` (redirect) to intercept
 *   side-effects without needing a real Next.js server.
 * - Feed the actions FormData objects built inline in each test.
 */

// ---------------------------------------------------------------------------
// Module-level mocks  (must be before imports that use them)
// ---------------------------------------------------------------------------

const mockRevalidatePath = jest.fn();
const mockRedirect = jest.fn();

jest.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

// Supabase mock factory — rebuilt fresh inside each test via `buildSupabaseMock`
let supabaseMock: ReturnType<typeof buildSupabaseMock>;

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(supabaseMock),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks are declared)
// ---------------------------------------------------------------------------

import { createApplication, updateApplication, deleteApplication } from './applications';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns today's date as YYYY-MM-DD in local time. */
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Build a FormData for creating/updating applications. */
function buildFormData(fields: Record<string, string | undefined>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      fd.append(key, value);
    }
  }
  return fd;
}

/** Minimal valid form data for a new application. */
function validCreateFormData(overrides: Record<string, string> = {}): FormData {
  return buildFormData({
    company_name: 'Acme Corp',
    position_title: 'Software Engineer',
    date_applied: today(),
    status: 'applied',
    ...overrides,
  });
}

/**
 * Builds a chainable Supabase mock where every method (from, insert, update,
 * delete, select, eq, single) returns `this` so tests can configure the
 * terminal result via `mockResolvedValue` on `single` / `eq`.
 */
function buildSupabaseMock({
  user = { id: 'user-abc' } as { id: string } | null,
  insertResult = { data: { id: 'new-app-id' }, error: null },
  updateResult = { data: null, error: null },
  deleteResult = { data: null, error: null },
} = {}) {
  const singleFn = jest.fn().mockResolvedValue(insertResult);
  const selectFn = jest.fn().mockReturnValue({ single: singleFn });

  // For update/delete: the chain ends at .eq('user_id', ...) returning a promise
  const eqUserIdFn = jest.fn().mockResolvedValue(updateResult);
  const eqIdFn = jest.fn().mockReturnValue({ eq: eqUserIdFn });

  // For delete: similar chain
  const eqUserIdDeleteFn = jest.fn().mockResolvedValue(deleteResult);
  const eqIdDeleteFn = jest.fn().mockReturnValue({ eq: eqUserIdDeleteFn });

  const updateFn = jest.fn().mockReturnValue({ eq: eqIdFn });
  const deleteFn = jest.fn().mockReturnValue({ eq: eqIdDeleteFn });

  const insertFn = jest.fn().mockReturnValue({ select: selectFn });

  const fromFn = jest.fn().mockReturnValue({
    insert: insertFn,
    update: updateFn,
    delete: deleteFn,
  });

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user } }),
    },
    from: fromFn,
    // Expose internals for assertions
    _insertFn: insertFn,
    _updateFn: updateFn,
    _deleteFn: deleteFn,
    _fromFn: fromFn,
    _singleFn: singleFn,
    _eqIdFn: eqIdFn,
    _eqUserIdFn: eqUserIdFn,
    _eqIdDeleteFn: eqIdDeleteFn,
    _eqUserIdDeleteFn: eqUserIdDeleteFn,
    _selectFn: selectFn,
  };
}

// ---------------------------------------------------------------------------
// Reset mocks before each test
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockRevalidatePath.mockReset();
  mockRedirect.mockReset();
  supabaseMock = buildSupabaseMock();
});

// ---------------------------------------------------------------------------
// createApplication
// ---------------------------------------------------------------------------

describe('createApplication', () => {
  describe('AC-1: happy path — valid data', () => {
    it('calls supabase.from("applications").insert() with the correct fields', async () => {
      await createApplication(validCreateFormData());
      expect(supabaseMock._fromFn).toHaveBeenCalledWith('applications');
      expect(supabaseMock._insertFn).toHaveBeenCalledWith(
        expect.objectContaining({
          company_name: 'Acme Corp',
          position_title: 'Software Engineer',
          user_id: 'user-abc',
        }),
      );
    });

    it('sets user_id from the authenticated session, not from form data', async () => {
      await createApplication(validCreateFormData());
      const insertCall = supabaseMock._insertFn.mock.calls[0][0];
      expect(insertCall.user_id).toBe('user-abc');
    });

    it('revalidates the applications list path after successful creation', async () => {
      await createApplication(validCreateFormData());
      expect(mockRevalidatePath).toHaveBeenCalledWith('/applications');
    });

    it('redirects to the new application detail page after successful creation', async () => {
      await createApplication(validCreateFormData());
      expect(mockRedirect).toHaveBeenCalledWith('/applications/new-app-id');
    });
  });

  describe('AC-8: default status', () => {
    it('inserts status as "applied" when status field is omitted from form', async () => {
      const fd = buildFormData({
        company_name: 'Acme Corp',
        position_title: 'Software Engineer',
        date_applied: today(),
        // status deliberately omitted — extractFormData falls back to 'applied'
      });
      await createApplication(fd);
      const insertCall = supabaseMock._insertFn.mock.calls[0][0];
      expect(insertCall.status).toBe('applied');
    });
  });

  describe('AC-2: section_id is null when not provided', () => {
    it('inserts with section_id null when section field is absent', async () => {
      await createApplication(validCreateFormData());
      const insertCall = supabaseMock._insertFn.mock.calls[0][0];
      expect(insertCall.section_id).toBeNull();
    });
  });

  describe('AC-4: required field validation', () => {
    it('returns an error object when company_name is missing', async () => {
      const fd = buildFormData({
        position_title: 'Dev',
        date_applied: today(),
      });
      const result = await createApplication(fd);
      expect(result).toMatchObject({ error: 'Please fix the errors below.' });
    });

    it('returns fieldErrors.company_name when company_name is empty', async () => {
      const fd = buildFormData({
        company_name: '',
        position_title: 'Dev',
        date_applied: today(),
      });
      const result = await createApplication(fd);
      expect(result).toMatchObject({
        fieldErrors: expect.objectContaining({ company_name: expect.any(String) }),
      });
    });

    it('returns fieldErrors.position_title when position_title is missing', async () => {
      const fd = buildFormData({
        company_name: 'Acme',
        date_applied: today(),
      });
      const result = await createApplication(fd);
      expect(result).toMatchObject({
        fieldErrors: expect.objectContaining({ position_title: expect.any(String) }),
      });
    });

    it('returns fieldErrors.date_applied when date_applied is missing', async () => {
      const fd = buildFormData({
        company_name: 'Acme',
        position_title: 'Dev',
      });
      const result = await createApplication(fd);
      expect(result).toMatchObject({
        fieldErrors: expect.objectContaining({ date_applied: expect.any(String) }),
      });
    });

    it('does not call supabase.insert() when validation fails', async () => {
      const fd = buildFormData({
        company_name: '',
        position_title: 'Dev',
        date_applied: today(),
      });
      await createApplication(fd);
      expect(supabaseMock._insertFn).not.toHaveBeenCalled();
    });
  });

  describe('AC-5: URL validation', () => {
    it('returns a URL error when job_posting_url is not a valid URL', async () => {
      const fd = validCreateFormData({ job_posting_url: 'not-a-url' });
      const result = await createApplication(fd);
      expect(result).toMatchObject({
        fieldErrors: expect.objectContaining({
          job_posting_url: 'Please enter a valid URL',
        }),
      });
    });

    it('accepts a valid URL in job_posting_url', async () => {
      const fd = validCreateFormData({
        job_posting_url: 'https://example.com/jobs/123',
      });
      await createApplication(fd);
      expect(supabaseMock._insertFn).toHaveBeenCalled();
    });
  });

  describe('AC-6: salary range validation', () => {
    it('returns salary_range_max error when max < min', async () => {
      const fd = validCreateFormData({
        salary_range_min: '100000',
        salary_range_max: '50000',
      });
      const result = await createApplication(fd);
      expect(result).toMatchObject({
        fieldErrors: expect.objectContaining({
          salary_range_max: 'Maximum must be greater than or equal to minimum',
        }),
      });
    });
  });

  describe('AC-7: future date validation', () => {
    it('returns date_applied error when date is in the future', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureStr = tomorrow.toISOString().split('T')[0];
      const fd = validCreateFormData({ date_applied: futureStr });
      const result = await createApplication(fd);
      expect(result).toMatchObject({
        fieldErrors: expect.objectContaining({
          date_applied: 'Date applied cannot be in the future',
        }),
      });
    });
  });

  describe('authentication', () => {
    it('returns an error when no user is authenticated', async () => {
      supabaseMock = buildSupabaseMock({ user: null });
      const result = await createApplication(validCreateFormData());
      expect(result).toMatchObject({
        error: 'You must be logged in to create an application.',
      });
    });

    it('does not call insert when no user is authenticated', async () => {
      supabaseMock = buildSupabaseMock({ user: null });
      await createApplication(validCreateFormData());
      expect(supabaseMock._insertFn).not.toHaveBeenCalled();
    });
  });

  describe('database error handling', () => {
    it('returns a generic error message when Supabase returns an error', async () => {
      supabaseMock = buildSupabaseMock({
        insertResult: { data: null, error: { message: 'DB error' } },
      });
      const result = await createApplication(validCreateFormData());
      expect(result).toMatchObject({
        error: 'Something went wrong. Your changes were not saved. Please try again.',
      });
    });

    it('does not redirect when Supabase returns an error', async () => {
      supabaseMock = buildSupabaseMock({
        insertResult: { data: null, error: { message: 'DB error' } },
      });
      await createApplication(validCreateFormData());
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// updateApplication
// ---------------------------------------------------------------------------

describe('updateApplication', () => {
  const APP_ID = 'existing-app-id';

  describe('AC-14: happy path — valid data', () => {
    it('calls supabase.from("applications").update() with parsed field values', async () => {
      await updateApplication(APP_ID, validCreateFormData({ company_name: 'Updated Corp' }));
      expect(supabaseMock._fromFn).toHaveBeenCalledWith('applications');
      expect(supabaseMock._updateFn).toHaveBeenCalledWith(
        expect.objectContaining({ company_name: 'Updated Corp' }),
      );
    });

    it('filters update by the application ID', async () => {
      await updateApplication(APP_ID, validCreateFormData());
      expect(supabaseMock._eqIdFn).toHaveBeenCalledWith('id', APP_ID);
    });

    it('filters update by user_id to enforce ownership', async () => {
      await updateApplication(APP_ID, validCreateFormData());
      expect(supabaseMock._eqUserIdFn).toHaveBeenCalledWith('user_id', 'user-abc');
    });

    it('revalidates the detail, edit, and list paths after successful update', async () => {
      await updateApplication(APP_ID, validCreateFormData());
      expect(mockRevalidatePath).toHaveBeenCalledWith(`/applications/${APP_ID}`);
      expect(mockRevalidatePath).toHaveBeenCalledWith(`/applications/${APP_ID}/edit`);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/applications');
    });

    it('redirects to the detail page with ?updated=1 query string after saving', async () => {
      await updateApplication(APP_ID, validCreateFormData());
      expect(mockRedirect).toHaveBeenCalledWith(`/applications/${APP_ID}?updated=1`);
    });
  });

  describe('validation — same rules as create', () => {
    it('returns an error when company_name is missing', async () => {
      const fd = buildFormData({
        position_title: 'Dev',
        date_applied: today(),
      });
      const result = await updateApplication(APP_ID, fd);
      expect(result).toMatchObject({ error: 'Please fix the errors below.' });
    });

    it('returns salary cross-field error when max < min', async () => {
      const fd = validCreateFormData({
        salary_range_min: '90000',
        salary_range_max: '80000',
      });
      const result = await updateApplication(APP_ID, fd);
      expect(result).toMatchObject({
        fieldErrors: expect.objectContaining({
          salary_range_max: 'Maximum must be greater than or equal to minimum',
        }),
      });
    });
  });

  describe('authentication', () => {
    it('returns an error when no user is authenticated', async () => {
      supabaseMock = buildSupabaseMock({ user: null });
      const result = await updateApplication(APP_ID, validCreateFormData());
      expect(result).toMatchObject({
        error: 'You must be logged in to update an application.',
      });
    });

    it('does not call update when no user is authenticated', async () => {
      supabaseMock = buildSupabaseMock({ user: null });
      await updateApplication(APP_ID, validCreateFormData());
      expect(supabaseMock._updateFn).not.toHaveBeenCalled();
    });
  });

  describe('database error handling', () => {
    it('returns a generic error message when Supabase returns an error on update', async () => {
      supabaseMock = buildSupabaseMock({
        updateResult: { data: null, error: { message: 'DB error' } },
      });
      const result = await updateApplication(APP_ID, validCreateFormData());
      expect(result).toMatchObject({
        error: 'Something went wrong. Your changes were not saved. Please try again.',
      });
    });

    it('does not redirect when Supabase returns an error on update', async () => {
      supabaseMock = buildSupabaseMock({
        updateResult: { data: null, error: { message: 'DB error' } },
      });
      await updateApplication(APP_ID, validCreateFormData());
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// deleteApplication
// ---------------------------------------------------------------------------

describe('deleteApplication', () => {
  const APP_ID = 'app-to-delete';

  describe('AC-18: happy path', () => {
    it('calls supabase.from("applications").delete()', async () => {
      await deleteApplication(APP_ID);
      expect(supabaseMock._fromFn).toHaveBeenCalledWith('applications');
      expect(supabaseMock._deleteFn).toHaveBeenCalled();
    });

    it('filters delete by application ID', async () => {
      await deleteApplication(APP_ID);
      expect(supabaseMock._eqIdDeleteFn).toHaveBeenCalledWith('id', APP_ID);
    });

    it('filters delete by user_id to enforce ownership', async () => {
      await deleteApplication(APP_ID);
      expect(supabaseMock._eqUserIdDeleteFn).toHaveBeenCalledWith('user_id', 'user-abc');
    });

    it('revalidates the applications list path after deletion', async () => {
      await deleteApplication(APP_ID);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/applications');
    });

    it('redirects to the applications list after deletion', async () => {
      await deleteApplication(APP_ID);
      expect(mockRedirect).toHaveBeenCalledWith('/applications');
    });
  });

  describe('authentication', () => {
    it('returns an error when no user is authenticated', async () => {
      supabaseMock = buildSupabaseMock({ user: null });
      const result = await deleteApplication(APP_ID);
      expect(result).toMatchObject({
        error: 'You must be logged in to delete an application.',
      });
    });

    it('does not call delete when no user is authenticated', async () => {
      supabaseMock = buildSupabaseMock({ user: null });
      await deleteApplication(APP_ID);
      expect(supabaseMock._deleteFn).not.toHaveBeenCalled();
    });
  });

  describe('database error handling', () => {
    it('returns a generic error message when Supabase returns an error on delete', async () => {
      supabaseMock = buildSupabaseMock({
        deleteResult: { data: null, error: { message: 'DB error' } },
      });
      const result = await deleteApplication(APP_ID);
      expect(result).toMatchObject({
        error: 'Something went wrong. The application could not be deleted. Please try again.',
      });
    });

    it('does not redirect when Supabase returns an error on delete', async () => {
      supabaseMock = buildSupabaseMock({
        deleteResult: { data: null, error: { message: 'DB error' } },
      });
      await deleteApplication(APP_ID);
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });
});
