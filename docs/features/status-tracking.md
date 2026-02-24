# Feature: Status Tracking

**Status**: Draft
**Created**: 2026-02-22
**Last Updated**: 2026-02-22
**Author**: Product Docs Manager

---

## Overview

Every application has a status that tells the user where it stands in the hiring process. The user sets the initial status when logging an application and updates it manually as things progress. Status is displayed as a colored badge throughout the app and can be changed from the application detail view.

---

## Problem Statement

Without a status, every application looks the same — a name and a company. Status turns the list into a meaningful pipeline. The user can see at a glance which applications are new, which have moved to interviews, and which are closed.

---

## User Stories

- As a job seeker, I want each application to have a status so that I know where it stands in the process.
- As a job seeker, I want to update an application's status when something changes so that my records stay accurate.
- As a job seeker, I want to see status as a colored badge so that I can scan the list quickly.

---

## Status Definitions

There are exactly five valid statuses:

| Value | Display Label | Meaning |
|---|---|---|
| `applied` | Applied | Submitted. No response yet. |
| `interview_scheduled` | Interview Scheduled | An interview has been arranged. |
| `interview_completed` | Interview Completed | At least one interview round is done. Awaiting next steps. |
| `offer_received` | Offer Received | A formal offer has been extended. |
| `rejected` | Rejected | The application is closed — either explicitly rejected, or the user is treating it as dead. |

---

## Status Workflow

The expected natural progression is:

```
applied -> interview_scheduled -> interview_completed -> offer_received
                                                     -> rejected
                              -> rejected
       -> rejected
```

**All transitions are free.** The user may set any status at any time — including moving backward — to accommodate reality: hiring processes are non-linear, and mistakes need correcting. No transition is blocked by the system.

---

## Detailed Requirements

### Functional Requirements

1. Every application has exactly one status at any given time.
2. The status defaults to `applied` when a new application is created without an explicit selection.
3. The user can select any of the five statuses when creating a new application.
4. The user can change an application's status from the application detail view.
5. Only the five defined status values are accepted. Any other value is rejected.

### UI/UX Requirements

- Status is displayed as a colored badge everywhere it appears (list view, detail view). The color mapping is:
  - `applied`: neutral gray
  - `interview_scheduled`: blue
  - `interview_completed`: purple
  - `offer_received`: green
  - `rejected`: red
- On the detail view, a status selector (dropdown or segmented control) allows the user to pick a new status. Changing the selection and clicking "Save Status" persists the change. The badge updates to reflect the new value.
- On the list view, the status badge is display-only. Changing status requires opening the detail view.
- The status field on the create/edit form shows all five options with their display labels.

### Data Requirements

Status is stored in the `status` column on the `applications` table (see [job-applications-crud.md](./job-applications-crud.md)). No separate history table is maintained in v1.

```typescript
type ApplicationStatus =
  | 'applied'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offer_received'
  | 'rejected';
```

The `status` column uses a PostgreSQL `CHECK` constraint:
```sql
CHECK (status IN ('applied', 'interview_scheduled', 'interview_completed', 'offer_received', 'rejected'))
```

### API/Integration Requirements

Status is updated as part of the standard application update — no dedicated endpoint is needed:

```
supabase.from('applications').update({ status: newStatus }).eq('id', id)
```

The `updated_at` trigger on the `applications` table fires on any update, including a status-only change.

---

## Acceptance Criteria

### AC-1: Default Status on Create
- **Given** the user submits the "Add Application" form without selecting a status
- **When** the record is created
- **Then** the `status` field is `applied` and the badge displays in gray with the label "Applied"

### AC-2: Status Selected on Create
- **Given** the user selects "Interview Scheduled" from the status field on the Add Application form
- **When** the form is submitted
- **Then** the application is created with `status` = `interview_scheduled`

### AC-3: Status Badge in List View
- **Given** the user has applications with different statuses
- **When** the user views the applications list
- **Then** each row shows a status badge with the correct label and color for that application's status

### AC-4: Change Status from Detail View — Happy Path
- **Given** the user is on the detail view for an application with status `applied`
- **When** the user selects `interview_scheduled` from the status selector and clicks "Save Status"
- **Then** the application's `status` is updated in the database and the badge updates to blue with the label "Interview Scheduled"

### AC-5: Change Status — Free Transition
- **Given** an application has `rejected` status
- **When** the user changes the status to `applied` from the detail view and saves
- **Then** the status is updated without any blocking warning or error

### AC-6: Change Status — Same Value Is a No-op
- **Given** an application has `applied` status
- **When** the user selects `applied` again from the status selector and clicks "Save Status"
- **Then** no database write occurs and no error is shown

### AC-7: Invalid Status Value Rejected
- **Given** a status value not in the five defined values is submitted via any form or API call
- **When** the request is processed
- **Then** the request fails with a validation error and no database write occurs

### AC-8: Status Change Updates Timestamp
- **Given** an application has a known `updated_at` value
- **When** the user changes the status and saves
- **Then** the `updated_at` timestamp on the record is updated to the current time

---

## Edge Cases & Error Handling

- **Network failure on status save**: The status selector reverts to the previous value and an error is shown: "Failed to update status. Please try again."
- **Consistent display**: The `StatusBadge` component is shared between the list and detail views. Its output is determined solely by the status value, so there is no risk of the badge showing different text or colors in different contexts.

---

## Out of Scope (v1)

- Status change history log
- Changing status directly from the list view without opening the detail view
- Custom user-defined statuses
- Reminders or alerts based on time spent in a status

---

## Dependencies

- [Job Applications CRUD](./job-applications-crud.md) — status lives as a column on the `applications` table

---

## Open Questions

1. Should status history be tracked in a future iteration? A `status_history` table could record every transition with timestamps, giving the user a full timeline per application. Explicitly deferred from v1 — the current schema can be extended later without changes to the `applications` table.

---

## Technical Notes

- The `StatusBadge` component accepts a single `status: ApplicationStatus` prop and renders the correct label and SASS module color class. It contains no logic beyond that mapping.
- Status values and their display labels should be defined in a single shared location (e.g., `lib/constants.ts`) so they are never duplicated across the codebase.
