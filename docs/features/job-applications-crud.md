# Feature: Job Applications CRUD

**Status**: Draft
**Created**: 2026-02-22
**Last Updated**: 2026-02-22
**Author**: Product Docs Manager

---

## Overview

The foundational feature of the app. The user can log a job application, see all their applications in a list, open one to review its details, edit it, and delete it. Every other feature depends on application records existing.

---

## Problem Statement

When actively job searching, applications pile up quickly. The user needs one place to log each application with the key details — company, role, where it stands — so nothing gets lost or forgotten.

---

## User Stories

- As a job seeker, I want to log a new job application so that I have a permanent record of where I applied.
- As a job seeker, I want to see all my applications in a list so that I can review my full pipeline at a glance.
- As a job seeker, I want to open a single application and see all its details.
- As a job seeker, I want to edit an application so that I can correct mistakes or add information that was missing.
- As a job seeker, I want to delete an application I no longer want to track.

---

## Detailed Requirements

### Functional Requirements

1. The user can create a new application by filling in a form with required and optional fields.
2. The system auto-assigns a unique ID and `created_at` / `updated_at` timestamps to every record.
3. The user can view all applications in a flat list, sorted by `date_applied` descending by default.
4. The user can assign an application to a user-defined section, or leave it unsectioned.
5. The user can click any application in the list to open its detail view.
6. The user can edit any field on an existing application and save changes explicitly.
7. The user can delete an application. Deletion is permanent and requires a confirmation step.
8. The `updated_at` timestamp is updated automatically whenever an application record is saved.

### UI/UX Requirements

- The list displays these columns: Section, Company Name, Position Title, Location, Status (badge), Date Applied.
- Each row is clickable and navigates to the detail view for that application.
- The "Add Application" button is visible and accessible from the list view.
- The create and edit forms are dedicated pages, not modals. Required fields are marked with an asterisk (*).
- Validation errors appear inline beneath the relevant field when the user attempts to submit.
- After creating an application, the user is redirected to its detail view.
- After saving an edit, the user remains on the detail view and sees a brief success confirmation.
- The delete button is on the detail view only, not the list. It uses destructive styling.
- After confirming deletion, the user is redirected to the applications list.

### Data Requirements

**`applications` table:**

| Column | Type | Required | Notes |
|---|---|---|---|
| `id` | `uuid` | Yes | Primary key, auto-generated |
| `user_id` | `uuid` | Yes | FK to `auth.users`, set from the authenticated session |
| `section_id` | `uuid` | No | FK to `sections.id`, nullable. Null means unsectioned. Set to null on section delete (no cascade delete of applications). |
| `company_name` | `text` | Yes | Max 200 characters |
| `position_title` | `text` | Yes | Max 200 characters |
| `job_posting_url` | `text` | No | Must be a valid URL if provided. Max 2000 characters |
| `location` | `text` | No | Free text, e.g. "Austin, TX" or "Remote". Max 200 characters |
| `work_type` | `text` | No | Enum: `remote`, `hybrid`, `on_site` |
| `salary_range_min` | `integer` | No | In USD. Must be >= 0 if provided |
| `salary_range_max` | `integer` | No | In USD. Must be >= `salary_range_min` if both are provided |
| `status` | `text` | Yes | See Status Tracking spec. Defaults to `applied` on creation |
| `date_applied` | `date` | Yes | Cannot be a future date |
| `created_at` | `timestamptz` | Yes | Auto-set on insert |
| `updated_at` | `timestamptz` | Yes | Auto-set on insert and update via DB trigger |

**TypeScript types:**

```typescript
type WorkType = 'remote' | 'hybrid' | 'on_site';

type ApplicationStatus =
  | 'applied'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offer_received'
  | 'rejected';

interface Application {
  id: string;
  user_id: string;
  section_id: string | null;
  company_name: string;
  position_title: string;
  job_posting_url: string | null;
  location: string | null;
  work_type: WorkType | null;
  salary_range_min: number | null;
  salary_range_max: number | null;
  status: ApplicationStatus;
  date_applied: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}
```

### List View Layout

The applications list has two display modes, toggled by the user:

- **All** (default): a flat list of all records sorted by `date_applied` descending.
- **By Section**: records are grouped under their section heading. Applications with no section are grouped under an "Unsectioned" heading at the bottom. Each section heading shows the section name and the count of applications in it. Empty sections (after deletions) are not shown — only sections that have at least one application appear.

The toggle between modes persists for the session (does not need to survive page reload).

### API/Integration Requirements

All data operations use the Supabase JS client from Server Components or Server Actions. No custom API routes are needed for basic CRUD.

- **Create**: `supabase.from('applications').insert({...})` — `user_id` set server-side from the session.
- **Read list**: `supabase.from('applications').select('*, sections(name)').order('date_applied', { ascending: false })`
- **Read single**: `supabase.from('applications').select('*, sections(name)').eq('id', id).single()`
- **Update**: `supabase.from('applications').update({...}).eq('id', id)`
- **Delete**: `supabase.from('applications').delete().eq('id', id)`

RLS policy:
```sql
CREATE POLICY "Users manage own applications"
ON applications FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## Acceptance Criteria

### AC-1: Create — Happy Path
- **Given** the user is on the "Add Application" form
- **When** the user fills in all required fields (company name, position title, date applied) with valid data and submits
- **Then** a new application record is created in the database, the user is redirected to the detail view for the new record, and all submitted field values are displayed correctly

### AC-2: Create — Section Is Optional
- **Given** the user is on the "Add Application" form
- **When** the user submits the form without selecting a section
- **Then** the application is created with `section_id` set to null and appears under "Unsectioned" in the By Section view

### AC-3: Create — Section Assignment
- **Given** the user has at least one section and is on the "Add Application" form
- **When** the user selects a section from the section dropdown and submits the form
- **Then** the application is created with the correct `section_id` and appears under that section in the By Section view

### AC-4: Create — Required Field Validation
- **Given** the user is on the "Add Application" form
- **When** the user submits the form with one or more required fields left empty
- **Then** the form is not submitted, inline error messages appear beneath each missing required field, and focus moves to the first invalid field

### AC-5: Create — URL Validation
- **Given** the user enters a value in the Job Posting URL field that is not a valid URL
- **When** the user submits the form
- **Then** the form is not submitted and the URL field shows the error "Please enter a valid URL"

### AC-6: Create — Salary Range Validation
- **Given** the user enters a minimum salary greater than the maximum salary
- **When** the user submits the form
- **Then** the form is not submitted and the maximum salary field shows "Maximum must be greater than or equal to minimum"

### AC-7: Create — Future Date Validation
- **Given** the user enters a date applied that is in the future
- **When** the user submits the form
- **Then** the form is not submitted and the date field shows "Date applied cannot be in the future"

### AC-8: Create — Default Status
- **Given** the user submits the form without selecting a status
- **When** the record is created
- **Then** the `status` field is set to `applied`

### AC-9: List — All View Shows All Applications
- **Given** the user has one or more application records
- **When** the user visits the applications list in "All" mode
- **Then** all applications appear in a table sorted by Date Applied descending with columns: Section, Company Name, Position Title, Location, Status, Date Applied

### AC-10: List — Empty State
- **Given** the user has no application records
- **When** the user visits the applications list
- **Then** an empty state message is shown with a prompt to add their first application

### AC-11: List — By Section Grouping
- **Given** the user has applications assigned to different sections and some with no section
- **When** the user switches to "By Section" mode
- **Then** applications are grouped under their respective section headings, each heading shows the count, and unsectioned applications appear under an "Unsectioned" group at the bottom

### AC-12: List — Unsectioned Group Hidden When Empty
- **Given** all of the user's applications are assigned to a section (none are unsectioned)
- **When** the user views the By Section layout
- **Then** no "Unsectioned" group appears

### AC-13: Detail View — Shows All Fields
- **Given** an application exists with data in multiple fields
- **When** the user opens its detail view
- **Then** all populated fields are displayed and optional fields with no value show a neutral placeholder such as "—"

### AC-14: Edit — Happy Path
- **Given** the user is on the detail view for an application
- **When** the user clicks "Edit", updates one or more fields, and clicks "Save"
- **Then** the record is updated in the database, the user is returned to the detail view showing the new values, and a brief success message is displayed

### AC-15: Edit — Cancel Discards Changes
- **Given** the user has made changes on the edit form that have not been saved
- **When** the user clicks "Cancel"
- **Then** no changes are written to the database and the user is returned to the detail view showing the original values

### AC-16: Edit — Reassign Section
- **Given** the user is editing an application currently assigned to Section A
- **When** the user changes the section to Section B and saves
- **Then** the application's `section_id` is updated to Section B's ID and it appears under Section B in the By Section view

### AC-17: Delete — Confirmation Required
- **Given** the user is on the detail view for an application
- **When** the user clicks "Delete"
- **Then** a confirmation dialog appears with the message "Are you sure you want to delete your application to [Company Name] for [Position Title]? This cannot be undone."

### AC-18: Delete — Confirmed
- **Given** the delete confirmation dialog is open
- **When** the user confirms the deletion
- **Then** the application record is permanently deleted and the user is redirected to the applications list

### AC-19: Delete — Cancelled
- **Given** the delete confirmation dialog is open
- **When** the user clicks "Cancel"
- **Then** no data is deleted and the dialog closes, returning the user to the detail view

---

## Edge Cases & Error Handling

- **Network failure on submit**: The form shows a top-level error banner: "Something went wrong. Your changes were not saved. Please try again." The form stays populated so the user does not lose their input.
- **Application not found**: If the user navigates to a detail view URL for an ID that does not exist or does not belong to them, a "Not found" message is shown with a link back to the list.
- **Long text in list**: Text that exceeds its column width truncates with an ellipsis. Full values are always visible on the detail view.
- **Section deleted while application is open**: If the user's current section is deleted by another tab/session (edge case in single-user context), the application's `section_id` becomes null and it moves to Unsectioned. The detail view continues to display correctly with no section shown.

---

## Out of Scope (v1)

- Searching or filtering the applications list
- Sorting the list by columns other than Date Applied
- Bulk create or CSV import
- Bulk delete
- Archiving / soft delete
- Contact or recruiter fields on an application

---

## Dependencies

- Sections feature must exist before section assignment is available (see [sections.md](./sections.md))
- Status Tracking feature defines valid `status` enum values (see [status-tracking.md](./status-tracking.md))
- Supabase project configured with Auth, the `applications` table, and the `sections` table

---

## Open Questions

1. Should the section dropdown in the form allow the user to create a new section inline (without leaving the form)? Assumed no for v1 — the user creates sections separately before filling out the application form.
2. Should the list remember the last-used display mode (All vs. By Section) across page loads? Assumed session-only for v1.

---

## Technical Notes

- Use Next.js Server Actions for create and update form submissions.
- The `updated_at` column is managed by a PostgreSQL trigger, not at the application level.
- Use `zod` for validation — shared between client-side (immediate feedback) and the Server Action (authoritative validation).
- The `status` and `work_type` columns should have PostgreSQL `CHECK` constraints enforcing valid enum values at the DB level.
- `section_id` uses `ON DELETE SET NULL` as the FK constraint behavior — deleting a section nullifies the FK on related applications rather than deleting them.
- By Section grouping is computed client-side by grouping the fetched array; no separate DB query is needed.
