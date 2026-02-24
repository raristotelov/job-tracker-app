# Feature: Sections

**Status**: Draft
**Created**: 2026-02-22
**Last Updated**: 2026-02-22
**Author**: Product Docs Manager

---

## Overview

Sections are user-defined labels that the user creates to organize their job applications however makes sense to them — by job platform, by company tier, by industry, or any other scheme they choose. An application can belong to exactly one section, or none (unsectioned). Sections are managed independently of applications and can be created, renamed, and deleted at any time.

---

## Problem Statement

Different job seekers organize their search differently. One person might separate applications by platform (LinkedIn, company site, referral). Another might group by job type or geography. Predefined categories would not fit everyone's mental model. User-defined sections give the user full control over how their pipeline is organized without constraining them to a fixed taxonomy.

---

## User Stories

- As a job seeker, I want to create a section so that I can group related applications together.
- As a job seeker, I want to rename a section so that I can change how I've labeled a group.
- As a job seeker, I want to delete a section I no longer need without losing the applications inside it.
- As a job seeker, I want to assign an application to a section when I create or edit it.
- As a job seeker, I want to see my applications grouped by section so that I can scan my pipeline by category.

---

## Detailed Requirements

### Functional Requirements

1. The user can create a new section by providing a name.
2. Section names must be unique for the user — no two sections can share the same name (case-insensitive comparison).
3. The user can rename any existing section at any time.
4. The user can delete a section. Deleting a section does not delete any applications — those applications become unsectioned (their `section_id` is set to null).
5. Sections are managed from a dedicated Sections management page, separate from the applications list.
6. The user can see all their sections in a list on the management page, with the count of applications in each.
7. There is no enforced limit on the number of sections a user can create.

### UI/UX Requirements

- The Sections management page is accessible from the main navigation.
- Each section in the management list shows its name and the number of applications assigned to it.
- Creating a section is done via a simple inline form on the management page: a text input and a "Create" button. No separate page is needed.
- Renaming is done inline: clicking a section name (or a rename control) makes it editable. The user confirms by pressing Enter or clicking "Save", and cancels by pressing Escape or clicking "Cancel".
- Deleting a section shows an inline confirmation: "Deleting '[Section Name]' will move [N] applications to Unsectioned. Continue?" with "Delete" and "Cancel" options.
- If a section has 0 applications, the delete confirmation message reads: "Delete '[Section Name]'? This cannot be undone."
- After a section is deleted, any applications that were in it continue to appear in the applications list under "Unsectioned".
- Sections are listed alphabetically on the management page.

### Data Requirements

**`sections` table:**

| Column | Type | Required | Notes |
|---|---|---|---|
| `id` | `uuid` | Yes | Primary key, auto-generated |
| `user_id` | `uuid` | Yes | FK to `auth.users`, set from session |
| `name` | `text` | Yes | Max 100 characters. Unique per user (case-insensitive) |
| `created_at` | `timestamptz` | Yes | Auto-set on insert |
| `updated_at` | `timestamptz` | Yes | Auto-set on insert and update via DB trigger |

The `applications.section_id` column is a nullable FK to `sections.id` with `ON DELETE SET NULL`. Deleting a section row sets `section_id` to null on all related application rows automatically at the database level.

**TypeScript types:**

```typescript
interface Section {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// Used in the management list view
interface SectionWithCount extends Section {
  application_count: number;
}
```

### API/Integration Requirements

- **Create**: `supabase.from('sections').insert({ user_id, name: name.trim() })`
- **Read all**: `supabase.from('sections').select('*, applications(count)').order('name', { ascending: true })`
- **Rename**: `supabase.from('sections').update({ name: name.trim() }).eq('id', id)`
- **Delete**: `supabase.from('sections').delete().eq('id', id)` — the `ON DELETE SET NULL` FK constraint on `applications.section_id` handles nullifying related records automatically.

RLS policy:
```sql
CREATE POLICY "Users manage own sections"
ON sections FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

For the application form's section dropdown, all sections are fetched with:
`supabase.from('sections').select('id, name').order('name', { ascending: true })`

---

## Acceptance Criteria

### AC-1: Create a Section — Happy Path
- **Given** the user is on the Sections management page
- **When** the user types a name into the section input and clicks "Create"
- **Then** a new section is created in the database, it appears in the sections list alphabetically, and the input is cleared

### AC-2: Create a Section — Empty Name Prevented
- **Given** the user is on the Sections management page
- **When** the user submits the create form with an empty name or whitespace only
- **Then** no section is created and the input shows the error "Section name cannot be empty"

### AC-3: Create a Section — Duplicate Name Prevented
- **Given** the user already has a section named "LinkedIn"
- **When** the user attempts to create another section named "linkedin" (different case)
- **Then** no section is created and the input shows the error "A section with this name already exists"

### AC-4: Create a Section — Name Too Long
- **Given** the user types a name longer than 100 characters into the section input
- **When** the user submits the form
- **Then** no section is created and the input shows the error "Section name must be 100 characters or fewer"

### AC-5: Sections List — Shows All Sections with Counts
- **Given** the user has created sections with varying numbers of applications
- **When** the user views the Sections management page
- **Then** all sections are listed alphabetically, each showing its name and the count of applications assigned to it

### AC-6: Sections List — Empty State
- **Given** the user has no sections
- **When** the user views the Sections management page
- **Then** an empty state message is shown: "No sections yet. Create one above."

### AC-7: Rename a Section — Happy Path
- **Given** the user is on the Sections management page and clicks the rename control for a section named "LinkedIn"
- **When** the user changes the name to "LinkedIn Jobs" and confirms
- **Then** the section record is updated in the database, the new name appears in the list, and all applications previously assigned to this section now reflect the new name when viewed

### AC-8: Rename a Section — Duplicate Name Prevented
- **Given** the user already has sections named "LinkedIn" and "Indeed"
- **When** the user renames "LinkedIn" to "Indeed"
- **Then** the rename is rejected and an error is shown: "A section with this name already exists"

### AC-9: Rename a Section — Cancel
- **Given** a section is in rename (edit) mode
- **When** the user presses Escape or clicks "Cancel"
- **Then** the original name is restored and no database write occurs

### AC-10: Delete a Section — Confirmation with Application Count
- **Given** the user clicks delete on a section that has 3 applications
- **When** the confirmation appears
- **Then** the message reads "Deleting '[Section Name]' will move 3 applications to Unsectioned. Continue?"

### AC-11: Delete a Section — Confirmation with No Applications
- **Given** the user clicks delete on a section that has 0 applications
- **When** the confirmation appears
- **Then** the message reads "Delete '[Section Name]'? This cannot be undone."

### AC-12: Delete a Section — Confirmed
- **Given** the delete confirmation is visible for a section with applications
- **When** the user confirms the deletion
- **Then** the section record is removed from the database, applications that were in it now have `section_id` = null, and those applications appear under "Unsectioned" in the By Section view

### AC-13: Delete a Section — Cancelled
- **Given** the delete confirmation is visible
- **When** the user clicks "Cancel"
- **Then** nothing is deleted and the section remains unchanged in the list

### AC-14: Section Dropdown in Application Form
- **Given** the user has one or more sections and is on the Add Application or Edit Application form
- **When** the section dropdown is opened
- **Then** all of the user's sections are listed alphabetically, plus a blank/empty option representing "No section"

### AC-15: Unsectioned Applications Remain Accessible
- **Given** a section is deleted and its applications become unsectioned
- **When** the user views the applications list in "All" mode
- **Then** the formerly-sectioned applications still appear in the list with no section label

---

## Edge Cases & Error Handling

- **Network failure on create**: If the insert fails, the section does not appear in the list and an error is shown: "Failed to create section. Please try again."
- **Network failure on rename**: If the update fails, the section name reverts to the original and an error is shown: "Failed to rename section. Please try again."
- **Network failure on delete**: If the delete fails, the section remains in the list and an error is shown: "Failed to delete section. Please try again."
- **Section name with only whitespace**: Trimmed before validation. A name of spaces only is treated as empty and rejected.
- **Concurrent rename/delete across tabs**: Since this is a single-user app, true concurrency is not expected. No special handling is required beyond standard error responses from Supabase.

---

## Out of Scope (v1)

- Reordering sections (drag and drop or manual ordering)
- Nesting sections (sub-sections or hierarchies)
- Section-level notes or descriptions
- Moving all applications from one section to another in bulk
- Color-coding sections

---

## Dependencies

- Supabase Auth — `user_id` is set from the authenticated session
- `applications` table with a nullable `section_id` FK column using `ON DELETE SET NULL`
- [Job Applications CRUD](./job-applications-crud.md) — sections are assigned to applications via the application form

---

## Open Questions

1. Should sections be reorderable by the user (e.g., drag to change their display order in the By Section list)? Assumed no for v1 — alphabetical order is used. This is a natural iteration if users want to prioritize certain sections visually.
2. Should creating a section be possible directly from the application form (inline create in the dropdown)? Assumed no for v1 — the user must go to the Sections page first. This reduces form complexity and can be added later.

---

## Technical Notes

- The unique name constraint should be enforced both client-side (for immediate feedback) and at the database level via a unique index: `CREATE UNIQUE INDEX sections_user_name_unique ON sections (user_id, lower(name));`
- The application count per section can be fetched using Supabase's embedded count: `select('*, applications(count)')`. This avoids a separate aggregation query.
- Section rename uses optimistic UI: update the name in local state immediately, then persist to the DB. On failure, revert.
- The section dropdown in the application form should be populated on page load as part of the server-side data fetch for the form page.
