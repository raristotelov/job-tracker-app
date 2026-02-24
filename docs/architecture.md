# Architecture Plan: Job Tracker App

**Status**: Approved for Development
**Created**: 2026-02-22
**Last Updated**: 2026-02-22
**Author**: Senior Architect

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Database Schema](#3-database-schema)
4. [TypeScript Types](#4-typescript-types)
5. [Folder Structure](#5-folder-structure)
6. [Task Breakdown](#6-task-breakdown)
7. [Technical Considerations](#7-technical-considerations)

---

## 1. Executive Summary

Job Tracker App is a single-user personal productivity tool for managing a job search pipeline. It is built with Next.js (App Router), TypeScript, SASS modules, and PostgreSQL via Supabase. The app has four features: CRUD for job applications, user-defined sections for grouping applications, a five-stage status tracking system with colored badges, and timestamped rich-text notes powered by Tiptap.

The architecture prioritizes simplicity, type safety, and fast iteration. Data flows through Supabase's JS client from Server Components and Server Actions -- no custom API routes are needed. Authentication is handled by Supabase Auth. Row Level Security policies protect all tables and are scoped to the authenticated user, which keeps the app secure now and extensible to multi-user later.

The initial route is a dashboard page that displays applications grouped by sections. Development is phased across five milestones: project setup, core CRUD, sections, status tracking, and notes.

---

## 2. Architecture Overview

### 2.1 System Architecture

```
+-------------------------------------------------------+
|                     Browser (Client)                    |
|                                                         |
|  Next.js App Router                                     |
|  +---------------------------------------------------+  |
|  | Server Components (RSC)       Client Components   |  |
|  |                                                    |  |
|  | - Page-level data fetching    - Forms (create/edit)|  |
|  | - Layout rendering            - Rich text editor   |  |
|  | - Initial HTML + streaming    - Status selector    |  |
|  |                               - Section rename     |  |
|  |                               - Delete confirms    |  |
|  |                               - View mode toggle   |  |
|  +---------------------------------------------------+  |
|           |                           |                  |
|     Server Actions              Client-side state        |
|     (form mutations)            (UI-only, no global      |
|                                  state management)       |
+-----------+-------------------------------------------+--+
            |
            v
+-------------------------------------------------------+
|                Supabase (Backend-as-a-Service)          |
|                                                         |
|  +------------------+  +----------------------------+   |
|  | Supabase Auth    |  | PostgreSQL Database         |  |
|  | - Email/password |  | - sections table            |  |
|  | - Session mgmt   |  | - applications table        |  |
|  | - JWT tokens     |  | - notes table               |  |
|  +------------------+  | - RLS policies on all       |  |
|                        | - Triggers for updated_at   |  |
|                        +----------------------------+   |
+-------------------------------------------------------+
```

### 2.2 Key Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Data fetching | Supabase JS client in Server Components | Eliminates custom API routes. Data is fetched server-side and streamed as HTML. |
| Mutations | Next.js Server Actions | Co-located with forms. Handles validation, auth checks, and DB writes in one place. Server-side `revalidatePath()` keeps the UI fresh. |
| Validation | Zod schemas shared between client and server | Single source of truth for validation rules. Client uses them for immediate feedback; Server Actions use them as the authoritative check. |
| Rich text | Tiptap (headless editor) | React-compatible, JSON storage format (no HTML in DB), extensible. |
| State management | Local React state only | No Redux, Zustand, or Context needed. Each interactive component owns its state. The only cross-component data flow is props from server-fetched data. |
| Styling | SASS modules | Scoped by default, no runtime overhead, full SASS features (variables, mixins, nesting). |
| Auth | Supabase Auth with middleware-based route protection | All routes except `/login` and `/signup` require authentication. Middleware checks the session and redirects unauthenticated users. |

### 2.3 Data Flow Patterns

**Read (Server Component):**
```
Browser request
  -> Next.js Server Component
    -> createServerComponentClient (Supabase)
      -> SELECT with RLS (user sees only their data)
    -> Render HTML with data
  -> Stream to browser
```

**Write (Server Action):**
```
User submits form (Client Component)
  -> Server Action invoked
    -> Validate with Zod
    -> createServerActionClient (Supabase)
      -> INSERT / UPDATE / DELETE with RLS
    -> revalidatePath('/') to refresh server data
    -> Return result to client (redirect or error)
```

### 2.4 Server vs. Client Component Boundaries

| Component Type | Server Component | Client Component |
|---|---|---|
| **Pages / Layouts** | Yes -- fetch data, render shell | -- |
| **Application list table** | Yes -- render from server-fetched data | -- |
| **View mode toggle (All / By Section)** | -- | Yes -- local state for toggle, receives full data as props |
| **Application form (create/edit)** | -- | Yes -- interactive form with validation |
| **Status badge (display)** | Yes -- pure render | -- |
| **Status selector (detail view)** | -- | Yes -- interactive dropdown + save |
| **Section management (rename/delete)** | -- | Yes -- inline editing, confirmations |
| **Rich text editor (notes)** | -- | Yes -- Tiptap requires DOM access |
| **Note card (read-only)** | Yes -- render from JSON | -- |
| **Note card (edit/delete controls)** | -- | Yes -- state for edit mode, delete confirm |
| **Delete confirmation dialogs** | -- | Yes -- local state toggle |

### 2.5 Authentication Flow

```
Unauthenticated user -> /login or /signup
  -> Supabase Auth (email/password)
  -> Session cookie set
  -> Redirect to / (dashboard)

Every subsequent request:
  -> Next.js middleware reads session cookie
  -> If no valid session -> redirect to /login
  -> If valid session -> allow request, user_id available in Server Components / Actions
```

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
+-------------------+       +------------------------+       +----------------+
|     sections      |       |     applications       |       |     notes      |
+-------------------+       +------------------------+       +----------------+
| id (PK)           |<------| section_id (FK, NULL)  |       | id (PK)        |
| user_id (FK)      |       | id (PK)                |------>| application_id |
| name              |       | user_id (FK)           |       |   (FK, CASCADE)|
| created_at        |       | company_name           |       | user_id (FK)   |
| updated_at        |       | position_title         |       | content (JSONB)|
+-------------------+       | job_posting_url        |       | created_at     |
                            | location               |       | updated_at     |
                            | work_type              |       +----------------+
                            | salary_range_min       |
                            | salary_range_max       |
                            | status                 |
                            | date_applied           |
                            | created_at             |
                            | updated_at             |
                            +------------------------+

Relationships:
  sections 1 --- 0..* applications  (section_id FK, ON DELETE SET NULL)
  applications 1 --- 0..* notes     (application_id FK, ON DELETE CASCADE)
  auth.users 1 --- 0..* sections    (user_id FK)
  auth.users 1 --- 0..* applications (user_id FK)
  auth.users 1 --- 0..* notes       (user_id FK)
```

### 3.2 SQL Schema

```sql
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
```

### 3.3 Schema Notes

- **UUID primary keys** follow Supabase conventions and avoid sequential ID enumeration.
- **`ON DELETE SET NULL`** on `applications.section_id` ensures deleting a section orphans applications into "Unsectioned" rather than deleting them.
- **`ON DELETE CASCADE`** on `notes.application_id` ensures deleting an application removes all its notes automatically.
- **`ON DELETE CASCADE`** on `user_id` FKs ensures account deletion cleans up all user data.
- **CHECK constraints** enforce valid enum values (`status`, `work_type`) and field length limits at the database level, complementing Zod validation at the application level.
- **The `update_updated_at_column()` trigger** is shared across all three tables so `updated_at` is always accurate without application-level code.
- **The unique index `sections_user_name_unique`** uses `lower(name)` for case-insensitive uniqueness. This means "LinkedIn" and "linkedin" cannot coexist for the same user.
- **RLS policies** use `auth.uid() = user_id` on all tables. This is the single-user pattern but works identically in a future multi-user scenario -- each user only sees their own data.
- **No separate status history table** in v1. The `applications.updated_at` timestamp reflects the last change but does not track individual status transitions. A `status_history` table can be added later without schema changes to existing tables.

### 3.4 Migration Strategy

Migrations are managed as sequential SQL files in the `supabase/migrations/` directory, executed via the Supabase CLI (`supabase db push` or `supabase migration up`). Each migration is timestamped and idempotent where possible.

Suggested migration order:
1. `001_create_trigger_function.sql` -- shared `update_updated_at_column()` function
2. `002_create_sections.sql` -- sections table, indexes, trigger, RLS
3. `003_create_applications.sql` -- applications table, indexes, trigger, RLS
4. `004_create_notes.sql` -- notes table, indexes, trigger, RLS

---

## 4. TypeScript Types

All types live in `src/types/` and are imported throughout the application. Types are split into domain models (matching DB rows), form input types (for create/edit), and display types (with joined data).

```typescript
// ===========================================
// src/types/application.ts
// ===========================================

/** Valid work arrangement types */
export type WorkType = 'remote' | 'hybrid' | 'on_site';

/** Valid application pipeline statuses */
export type ApplicationStatus =
  | 'applied'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offer_received'
  | 'rejected';

/** Database row shape for the applications table */
export interface Application {
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
  date_applied: string; // ISO 8601 date string (YYYY-MM-DD)
  created_at: string;   // ISO 8601 timestamptz
  updated_at: string;   // ISO 8601 timestamptz
}

/** Application with its section name joined. Used in list and detail views. */
export interface ApplicationWithSection extends Application {
  sections: { name: string } | null;
}

/** Input shape for creating a new application (fields the user provides). */
export interface ApplicationCreateInput {
  section_id: string | null;
  company_name: string;
  position_title: string;
  job_posting_url: string | null;
  location: string | null;
  work_type: WorkType | null;
  salary_range_min: number | null;
  salary_range_max: number | null;
  status: ApplicationStatus;
  date_applied: string;
}

/** Input shape for updating an existing application. Same fields as create. */
export type ApplicationUpdateInput = ApplicationCreateInput;


// ===========================================
// src/types/section.ts
// ===========================================

/** Database row shape for the sections table */
export interface Section {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

/** Section with the count of applications assigned to it. Used in management view. */
export interface SectionWithCount extends Section {
  application_count: number;
}

/** Input shape for creating or renaming a section. */
export interface SectionInput {
  name: string;
}


// ===========================================
// src/types/note.ts
// ===========================================

import type { JSONContent } from '@tiptap/core';

/** Database row shape for the notes table */
export interface Note {
  id: string;
  application_id: string;
  user_id: string;
  content: JSONContent; // Tiptap JSON document
  created_at: string;
  updated_at: string;
}

/** Input shape for creating or updating a note. */
export interface NoteInput {
  content: JSONContent;
}


// ===========================================
// src/types/index.ts
// ===========================================

export type {
  WorkType,
  ApplicationStatus,
  Application,
  ApplicationWithSection,
  ApplicationCreateInput,
  ApplicationUpdateInput,
} from './application';

export type {
  Section,
  SectionWithCount,
  SectionInput,
} from './section';

export type {
  Note,
  NoteInput,
} from './note';
```

---

## 5. Folder Structure

```
job-tracker-app/
|-- docs/                                # Product documentation (existing)
|   |-- README.md
|   |-- project-overview.md
|   |-- architecture.md                  # This document
|   +-- features/
|       |-- job-applications-crud.md
|       |-- sections.md
|       |-- status-tracking.md
|       +-- notes.md
|
|-- supabase/                            # Supabase project config and migrations
|   |-- config.toml
|   +-- migrations/
|       |-- 001_create_trigger_function.sql
|       |-- 002_create_sections.sql
|       |-- 003_create_applications.sql
|       +-- 004_create_notes.sql
|
|-- public/                              # Static assets
|   +-- favicon.ico
|
|-- src/
|   |-- app/                             # Next.js App Router
|   |   |-- layout.tsx                   # Root layout (HTML shell, global providers)
|   |   |-- page.tsx                     # Dashboard / home page (redirects to /applications)
|   |   |-- globals.scss                 # Global style imports
|   |   |
|   |   |-- (auth)/                      # Auth route group (public, no sidebar)
|   |   |   |-- layout.tsx              # Auth-specific layout (centered card)
|   |   |   |-- login/
|   |   |   |   +-- page.tsx
|   |   |   +-- signup/
|   |   |       +-- page.tsx
|   |   |
|   |   +-- (dashboard)/                # Dashboard route group (authenticated, with nav)
|   |       |-- layout.tsx              # Dashboard layout (sidebar/nav + main content area)
|   |       |
|   |       |-- applications/
|   |       |   |-- page.tsx            # Applications list view (default landing)
|   |       |   |-- new/
|   |       |   |   +-- page.tsx        # Create application form page
|   |       |   +-- [id]/
|   |       |       |-- page.tsx        # Application detail view
|   |       |       +-- edit/
|   |       |           +-- page.tsx    # Edit application form page
|   |       |
|   |       +-- sections/
|   |           +-- page.tsx            # Sections management page
|   |
|   |-- components/
|   |   |-- ui/                          # Shared / generic UI components
|   |   |   |-- Button/
|   |   |   |   |-- Button.tsx
|   |   |   |   |-- Button.module.scss
|   |   |   |   |-- Button.test.tsx
|   |   |   |   +-- index.ts
|   |   |   |
|   |   |   |-- Input/
|   |   |   |   |-- Input.tsx
|   |   |   |   |-- Input.module.scss
|   |   |   |   |-- Input.test.tsx
|   |   |   |   +-- index.ts
|   |   |   |
|   |   |   |-- Select/
|   |   |   |   |-- Select.tsx
|   |   |   |   |-- Select.module.scss
|   |   |   |   |-- Select.test.tsx
|   |   |   |   +-- index.ts
|   |   |   |
|   |   |   |-- StatusBadge/
|   |   |   |   |-- StatusBadge.tsx
|   |   |   |   |-- StatusBadge.module.scss
|   |   |   |   |-- StatusBadge.test.tsx
|   |   |   |   +-- index.ts
|   |   |   |
|   |   |   |-- EmptyState/
|   |   |   |   |-- EmptyState.tsx
|   |   |   |   |-- EmptyState.module.scss
|   |   |   |   |-- EmptyState.test.tsx
|   |   |   |   +-- index.ts
|   |   |   |
|   |   |   |-- ConfirmDialog/
|   |   |   |   |-- ConfirmDialog.tsx
|   |   |   |   |-- ConfirmDialog.module.scss
|   |   |   |   |-- ConfirmDialog.test.tsx
|   |   |   |   +-- index.ts
|   |   |   |
|   |   |   |-- ErrorBanner/
|   |   |   |   |-- ErrorBanner.tsx
|   |   |   |   |-- ErrorBanner.module.scss
|   |   |   |   |-- ErrorBanner.test.tsx
|   |   |   |   +-- index.ts
|   |   |   |
|   |   |   +-- SuccessMessage/
|   |   |       |-- SuccessMessage.tsx
|   |   |       |-- SuccessMessage.module.scss
|   |   |       |-- SuccessMessage.test.tsx
|   |   |       +-- index.ts
|   |   |
|   |   +-- features/                   # Feature-specific components
|   |       |-- applications/
|   |       |   |-- ApplicationList/
|   |       |   |   |-- ApplicationList.tsx       # Wraps table + view toggle
|   |       |   |   |-- ApplicationList.module.scss
|   |       |   |   |-- ApplicationList.test.tsx
|   |       |   |   |-- index.ts
|   |       |   |   |-- ApplicationTable/
|   |       |   |   |   |-- ApplicationTable.tsx  # Table rendering rows
|   |       |   |   |   |-- ApplicationTable.module.scss
|   |       |   |   |   |-- ApplicationTable.test.tsx
|   |       |   |   |   +-- index.ts
|   |       |   |   +-- ViewToggle/
|   |       |   |       |-- ViewToggle.tsx        # All / By Section toggle
|   |       |   |       |-- ViewToggle.module.scss
|   |       |   |       |-- ViewToggle.test.tsx
|   |       |   |       +-- index.ts
|   |       |   |
|   |       |   |-- ApplicationForm/
|   |       |   |   |-- ApplicationForm.tsx       # Shared create/edit form
|   |       |   |   |-- ApplicationForm.module.scss
|   |       |   |   |-- ApplicationForm.test.tsx
|   |       |   |   +-- index.ts
|   |       |   |
|   |       |   |-- ApplicationDetail/
|   |       |   |   |-- ApplicationDetail.tsx     # Detail view layout
|   |       |   |   |-- ApplicationDetail.module.scss
|   |       |   |   |-- ApplicationDetail.test.tsx
|   |       |   |   |-- index.ts
|   |       |   |   +-- StatusSelector/
|   |       |   |       |-- StatusSelector.tsx    # Interactive status change
|   |       |   |       |-- StatusSelector.module.scss
|   |       |   |       |-- StatusSelector.test.tsx
|   |       |   |       +-- index.ts
|   |       |   |
|   |       |   +-- DeleteApplicationDialog/
|   |       |       |-- DeleteApplicationDialog.tsx
|   |       |       |-- DeleteApplicationDialog.module.scss
|   |       |       |-- DeleteApplicationDialog.test.tsx
|   |       |       +-- index.ts
|   |       |
|   |       |-- sections/
|   |       |   |-- SectionList/
|   |       |   |   |-- SectionList.tsx           # List of sections with counts
|   |       |   |   |-- SectionList.module.scss
|   |       |   |   |-- SectionList.test.tsx
|   |       |   |   |-- index.ts
|   |       |   |   +-- SectionItem/
|   |       |   |       |-- SectionItem.tsx       # Single section row (rename/delete)
|   |       |   |       |-- SectionItem.module.scss
|   |       |   |       |-- SectionItem.test.tsx
|   |       |   |       +-- index.ts
|   |       |   |
|   |       |   +-- CreateSectionForm/
|   |       |       |-- CreateSectionForm.tsx     # Inline create form
|   |       |       |-- CreateSectionForm.module.scss
|   |       |       |-- CreateSectionForm.test.tsx
|   |       |       +-- index.ts
|   |       |
|   |       +-- notes/
|   |           |-- NotesList/
|   |           |   |-- NotesList.tsx             # Container for all notes
|   |           |   |-- NotesList.module.scss
|   |           |   |-- NotesList.test.tsx
|   |           |   |-- index.ts
|   |           |   +-- NoteCard/
|   |           |       |-- NoteCard.tsx          # Single note (view/edit/delete)
|   |           |       |-- NoteCard.module.scss
|   |           |       |-- NoteCard.test.tsx
|   |           |       +-- index.ts
|   |           |
|   |           +-- NoteEditor/
|   |               |-- NoteEditor.tsx            # Tiptap editor wrapper
|   |               |-- NoteEditor.module.scss
|   |               |-- NoteEditor.test.tsx
|   |               |-- index.ts
|   |               +-- EditorToolbar/
|   |                   |-- EditorToolbar.tsx     # Formatting buttons
|   |                   |-- EditorToolbar.module.scss
|   |                   |-- EditorToolbar.test.tsx
|   |                   +-- index.ts
|   |
|   |-- hooks/                           # Custom React hooks
|   |   |-- useSupabase.ts              # Hook for client-side Supabase instance
|   |   +-- useFormValidation.ts        # Hook for form error state management
|   |
|   |-- lib/                             # Utility libraries and clients
|   |   |-- supabase/
|   |   |   |-- client.ts              # Browser Supabase client (for Client Components)
|   |   |   |-- server.ts              # Server Supabase client (for Server Components)
|   |   |   +-- middleware.ts          # Supabase client for Next.js middleware
|   |   |-- validators/
|   |   |   |-- application.ts         # Zod schemas for application create/update
|   |   |   |-- section.ts            # Zod schemas for section create/rename
|   |   |   +-- note.ts               # Zod schema for note content validation
|   |   +-- utils/
|   |       |-- formatDate.ts          # Date formatting utilities
|   |       |-- formatSalary.ts        # Salary display formatting
|   |       +-- noteContent.ts         # Tiptap JSON content helpers (empty check, sanitize)
|   |
|   |-- services/                        # Server Actions (data mutation layer)
|   |   |-- applications.ts            # createApplication, updateApplication, deleteApplication
|   |   |-- sections.ts                # createSection, renameSection, deleteSection
|   |   |-- notes.ts                   # createNote, updateNote, deleteNote
|   |   +-- auth.ts                    # login, signup, logout actions
|   |
|   |-- types/                           # Shared TypeScript types and interfaces
|   |   |-- application.ts
|   |   |-- section.ts
|   |   |-- note.ts
|   |   +-- index.ts                   # Barrel re-export
|   |
|   |-- constants/                       # App-wide constants
|   |   |-- status.ts                  # Status enum values, display labels, colors
|   |   |-- workType.ts               # Work type enum values and display labels
|   |   +-- routes.ts                  # Route path constants
|   |
|   +-- styles/                          # Global SASS styles
|       |-- _variables.scss            # Colors, spacing, typography, breakpoints
|       |-- _mixins.scss               # Reusable SASS mixins
|       |-- _reset.scss                # CSS reset / normalize
|       +-- _globals.scss              # Global base styles
|
|-- .env.local                           # Supabase URL and anon key (not committed)
|-- .env.example                         # Template for required env vars
|-- .gitignore
|-- next.config.ts                       # Next.js configuration
|-- tsconfig.json                        # TypeScript configuration (strict mode)
|-- package.json
|-- middleware.ts                         # Next.js middleware (auth route protection)
+-- README.md                            # Project README
```

### 5.1 Folder Structure Rationale

- **Route groups `(auth)` and `(dashboard)`**: These Next.js route groups share different layouts. Auth pages get a centered card layout with no navigation. Dashboard pages get a sidebar/nav layout. Route groups do not affect the URL path.
- **`components/ui/`**: Generic, reusable components with no business logic. These can be used anywhere. Each follows the component folder convention.
- **`components/features/`**: Feature-specific components organized by domain. These contain business logic and are used by their corresponding pages.
- **`services/`**: Server Actions live here, separated from components. Each file groups all mutations for one domain (applications, sections, notes, auth). This keeps Server Action logic testable and avoids scattering `'use server'` directives across the codebase.
- **`lib/supabase/`**: Three Supabase client factories for the three contexts where Supabase is used (Server Components, Server Actions/Route Handlers, and Client Components). This follows the official `@supabase/ssr` pattern.
- **`lib/validators/`**: Zod schemas are colocated by domain. They are imported by both Client Components (for instant feedback) and Server Actions (for authoritative validation).
- **`types/`**: Pure TypeScript type definitions. No runtime code. Barrel-exported from `index.ts` for clean imports.
- **`constants/`**: Status labels/colors, work type labels, and route paths. Defined once, imported everywhere. No magic strings in components.

---

## 6. Task Breakdown

### Phase 1: Project Setup and Infrastructure

| ID | Title | Description | Dependencies | Acceptance Criteria | Complexity |
|---|---|---|---|---|---|
| T-001 | Initialize Next.js project | Run `create-next-app` with TypeScript, App Router, SASS. Configure `tsconfig.json` with strict mode. Set up `.gitignore`, `.env.example`. | None | Project runs with `npm run dev`. TypeScript strict mode enabled. SASS modules compile. | Low |
| T-002 | Set up SASS global styles | Create `_variables.scss` (colors, spacing, typography, breakpoints), `_mixins.scss`, `_reset.scss`, `_globals.scss`. Import in root layout. | T-001 | Global styles applied. Variables and mixins importable from any `.module.scss` file. Status badge colors defined as variables. | Low |
| T-003 | Set up Supabase project and local dev | Create Supabase project (or use `supabase init` for local dev). Configure `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Install `@supabase/supabase-js` and `@supabase/ssr`. | T-001 | Supabase CLI initialized. Environment variables set. Supabase client importable. | Low |
| T-004 | Create Supabase client utilities | Implement three client factories in `lib/supabase/`: `server.ts` (for Server Components), `client.ts` (for Client Components), `middleware.ts` (for middleware). Follow `@supabase/ssr` cookie-based pattern. | T-003 | Each client factory exports a function that returns a typed Supabase client. Server client reads cookies from Next.js `cookies()`. | Medium |
| T-005 | Run database migrations | Create migration files for trigger function, sections, applications, and notes tables. Run via Supabase CLI. Verify tables, indexes, constraints, triggers, and RLS policies exist. | T-003 | All four migration files execute without errors. Tables are queryable. RLS is enabled. `updated_at` trigger fires on updates. CHECK constraints reject invalid data. | Medium |
| T-006 | Set up Supabase Auth and middleware | Configure Supabase Auth for email/password. Implement Next.js middleware that checks for a valid session on all routes except `/login` and `/signup`. Redirect unauthenticated users to `/login`. | T-004 | Unauthenticated requests to `/applications` redirect to `/login`. Authenticated requests pass through. Session is accessible in Server Components. | Medium |
| T-007 | Create auth pages (login and signup) | Build `/login` and `/signup` pages with email/password forms. Create `services/auth.ts` with login, signup, and logout Server Actions. Apply `(auth)` route group layout (centered card, no nav). | T-006 | User can sign up, log in, and log out. Sessions persist across page reloads. Invalid credentials show error messages. | Medium |
| T-008 | Create dashboard layout and navigation | Build `(dashboard)/layout.tsx` with a sidebar navigation containing links to Applications and Sections. Include the user's email and a logout button. Style with SASS module. | T-007 | Authenticated user sees sidebar with nav links. Active route is highlighted. Logout works. Layout wraps all dashboard pages. | Medium |
| T-009 | Create shared UI components (Button, Input, Select) | Build `Button`, `Input`, and `Select` components in `components/ui/` with proper TypeScript props, SASS modules, and barrel exports. Button supports variants (primary, secondary, destructive). Input supports error state display. | T-001, T-002 | Components render correctly. Props are fully typed. SASS modules apply. Barrel exports work. | Low |
| T-010 | Create StatusBadge component | Build `StatusBadge` in `components/ui/` that accepts an `ApplicationStatus` prop and renders a colored badge with the display label. Colors: applied=gray, interview_scheduled=blue, interview_completed=purple, offer_received=green, rejected=red. | T-002, T-009 | Badge renders correct label and color for each of the five statuses. | Low |
| T-011 | Create EmptyState, ErrorBanner, SuccessMessage components | Build shared feedback UI components. `EmptyState` shows a message and optional CTA. `ErrorBanner` shows a dismissible error. `SuccessMessage` shows a brief success notification. | T-009 | Each component renders with correct styling. ErrorBanner is dismissible. SuccessMessage auto-fades or is dismissible. | Low |
| T-012 | Create constants files | Create `constants/status.ts` (status values, display labels, badge color class names), `constants/workType.ts` (work type values and labels), `constants/routes.ts` (route path strings). | T-001 | Constants are importable. No magic strings in components that reference statuses, work types, or routes. | Low |
| T-013 | Create TypeScript type definitions | Create `types/application.ts`, `types/section.ts`, `types/note.ts`, and `types/index.ts` with all interfaces and types defined in Section 4 of this document. | T-001 | All types compile. Barrel export works. Types match the database schema. | Low |
| T-014 | Create Zod validation schemas | Create `lib/validators/application.ts` (applicationCreateSchema, applicationUpdateSchema), `lib/validators/section.ts` (sectionNameSchema), `lib/validators/note.ts` (noteContentSchema). All constraints from feature specs encoded. | T-013 | Schemas validate correct data. Schemas reject: empty required fields, future dates, invalid URLs, salary min > max, names > 100 chars, invalid enum values. | Medium |
| T-015 | Create utility functions | Create `lib/utils/formatDate.ts` (format dates for display), `lib/utils/formatSalary.ts` (format salary as USD currency string), `lib/utils/noteContent.ts` (isEmpty check, sanitize allowed Tiptap nodes/marks). | T-001 | Utilities are importable and unit-testable. formatDate handles date strings. formatSalary handles null/undefined gracefully. noteContent isEmpty correctly identifies empty Tiptap documents. | Low |

### Phase 2: Job Applications CRUD

| ID | Title | Description | Dependencies | Acceptance Criteria | Complexity |
|---|---|---|---|---|---|
| T-016 | Create applications Server Actions | Implement `services/applications.ts` with `createApplication`, `updateApplication`, and `deleteApplication` Server Actions. Each validates input with Zod, gets the user session, calls Supabase, and calls `revalidatePath`. | T-004, T-005, T-006, T-014 | Server Actions create, update, and delete records in the database. Validation errors are returned to the caller. Unauthorized calls are rejected. `revalidatePath` is called after mutations. | High |
| T-017 | Build applications list page | Create `(dashboard)/applications/page.tsx` as a Server Component. Fetch all applications with section names joined. Pass data to `ApplicationList` Client Component. Handle empty state. | T-008, T-010, T-011, T-013, T-016 | Page renders all applications in a table with columns: Section, Company Name, Position Title, Location, Status (badge), Date Applied. Empty state shown when no applications. Rows are clickable links to detail view. | High |
| T-018 | Build ApplicationList and ApplicationTable components | Create `ApplicationList` (Client Component managing view mode state) and `ApplicationTable` (renders table rows). `ApplicationList` contains `ViewToggle` and renders `ApplicationTable` with appropriate data grouping. | T-009, T-010, T-012 | List renders in "All" mode by default (flat, sorted by date desc). Toggle switches to "By Section" mode (grouped under section headings with counts, Unsectioned at bottom). Toggle state is session-only. | High |
| T-019 | Build ApplicationForm component | Create `ApplicationForm` Client Component used by both create and edit pages. Accepts optional initial data (for editing). Uses Zod for client-side validation. Calls Server Actions on submit. Section dropdown populated from props. | T-009, T-010, T-012, T-014, T-016 | Form renders all fields. Required fields marked with asterisk. Validation errors appear inline. Salary range cross-validated. URL validated. Future dates rejected. Status defaults to "applied" on create. | High |
| T-020 | Build create application page | Create `(dashboard)/applications/new/page.tsx`. Fetch sections server-side for the dropdown. Render `ApplicationForm` in create mode. Redirect to detail view on success. | T-017, T-019 | User can fill form and create an application. On success, redirected to `/applications/[id]`. On validation error, form stays with errors. | Medium |
| T-021 | Build application detail page | Create `(dashboard)/applications/[id]/page.tsx` as a Server Component. Fetch the application with section name. Display all fields. Show StatusBadge. Include "Edit" and "Delete" buttons. Handle not-found case. | T-010, T-011, T-016, T-017 | Detail page displays all application fields. Optional null fields show "--". Status shows as colored badge. "Edit" links to edit page. "Delete" triggers confirmation. 404 handled. | Medium |
| T-022 | Build edit application page | Create `(dashboard)/applications/[id]/edit/page.tsx`. Fetch application data and sections server-side. Render `ApplicationForm` in edit mode pre-filled with current values. Redirect to detail view on save. | T-019, T-021 | Form loads with current values. User edits and saves. Redirected to detail view with updated data. Cancel returns to detail view without saving. | Medium |
| T-023 | Build DeleteApplicationDialog component | Create `DeleteApplicationDialog` Client Component. Shows a confirmation message with company name and position title. Calls `deleteApplication` Server Action on confirm. Redirects to applications list on success. | T-009, T-011, T-016 | Clicking "Delete" shows confirmation with correct application details. Confirming deletes the record and redirects to list. Cancelling closes the dialog. | Medium |

### Phase 3: Sections

| ID | Title | Description | Dependencies | Acceptance Criteria | Complexity |
|---|---|---|---|---|---|
| T-024 | Create sections Server Actions | Implement `services/sections.ts` with `createSection`, `renameSection`, and `deleteSection` Server Actions. Validate with Zod. Enforce unique name per user (case-insensitive). Handle DB unique constraint errors gracefully. | T-004, T-005, T-006, T-014 | Server Actions create, rename, and delete sections. Duplicate names return a user-friendly error. Empty/whitespace names rejected. `revalidatePath` called after mutations. | Medium |
| T-025 | Build sections management page | Create `(dashboard)/sections/page.tsx` as a Server Component. Fetch all sections with application counts. Render `CreateSectionForm` at top and `SectionList` below. Handle empty state. | T-008, T-011, T-024 | Page shows all sections alphabetically with application counts. Empty state shown when no sections. | Medium |
| T-026 | Build CreateSectionForm component | Create `CreateSectionForm` Client Component. Inline text input + "Create" button. Validates name (not empty, <= 100 chars). Calls `createSection` Server Action. Clears input on success. Shows errors inline. | T-009, T-014, T-024 | User can type a name and create a section. Input clears on success. Empty names, too-long names, and duplicate names show inline errors. | Medium |
| T-027 | Build SectionList and SectionItem components | Create `SectionList` (renders list of sections) and `SectionItem` (single section row with name, count, rename, delete controls). Inline rename with Enter/Escape. Inline delete confirmation with application count message. | T-009, T-011, T-024 | Sections listed alphabetically with counts. Rename: click to edit, Enter saves, Escape cancels. Delete: shows correct confirmation message based on application count. Delete removes section, applications become unsectioned. | High |
| T-028 | Integrate section dropdown into ApplicationForm | Update `ApplicationForm` to include a `Select` dropdown for sections. Populate from sections data passed as props. "No section" option included. Section assignment persisted on create/update. | T-019, T-024, T-025 | Application form shows section dropdown with all user sections + blank option. Creating/editing an application correctly saves section_id. | Low |

### Phase 4: Status Tracking

| ID | Title | Description | Dependencies | Acceptance Criteria | Complexity |
|---|---|---|---|---|---|
| T-029 | Build StatusSelector component | Create `StatusSelector` Client Component for the application detail view. Dropdown or segmented control showing all five statuses. "Save Status" button. Calls `updateApplication` Server Action with just the status field. Handles same-value no-op. | T-010, T-012, T-016 | Status selector shows all five options with correct labels. Saving a different status updates the record and the badge. Saving the same status is a no-op (no DB write). Network errors revert the selector and show an error message. | Medium |
| T-030 | Integrate StatusSelector into detail page | Add `StatusSelector` to the application detail page below the status badge. Wire it to the existing `updateApplication` Server Action. | T-021, T-029 | Status can be changed from the detail view. Badge updates to reflect new status. `updated_at` timestamp updates. Free transitions (any status to any status) work without restriction. | Low |

### Phase 5: Notes

| ID | Title | Description | Dependencies | Acceptance Criteria | Complexity |
|---|---|---|---|---|---|
| T-031 | Install and configure Tiptap | Install `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, and `@tiptap/pm`. No additional configuration files needed -- Tiptap is configured per-instance in the editor component. | T-001 | Tiptap packages install without errors. Importable in components. | Low |
| T-032 | Create notes Server Actions | Implement `services/notes.ts` with `createNote`, `updateNote`, and `deleteNote` Server Actions. Validate content: must be valid JSON, must contain at least one non-empty text node, only allowed node types/marks. Sanitize before persisting. | T-004, T-005, T-006, T-014, T-015 | Server Actions create, update, and delete notes. Empty content rejected. Disallowed node types/marks stripped. `revalidatePath` called after mutations. | Medium |
| T-033 | Build NoteEditor component | Create `NoteEditor` Client Component wrapping a Tiptap editor instance. Configure with `StarterKit` (headings, lists, bold, italic) and `Link` extension. Build `EditorToolbar` with formatting buttons. Support collapsed/expanded state. Support pre-filled content for editing. Expose `isEmpty` state and `getJSON()` method. | T-031 | Editor renders with toolbar. All formatting options work (H1, H2, paragraph, bold, italic, bullet list, numbered list, link). Editor can be collapsed/expanded. isEmpty correctly reports empty state. Content can be pre-filled for editing. | High |
| T-034 | Build NotesList component | Create `NotesList` Client Component that renders the "Add Note" area (NoteEditor in create mode) at the top and a list of `NoteCard` components below. Handle empty state ("No notes yet."). | T-033 | Notes section renders on detail page. Add Note area at top. Existing notes listed below in reverse-chronological order. Empty state shown when no notes. | Medium |
| T-035 | Build NoteCard component | Create `NoteCard` Client Component. Renders formatted note content using Tiptap's `generateHTML()` or a read-only Tiptap instance. Shows creation timestamp. Shows "edited" indicator if `updated_at` differs from `created_at`. Edit/Delete controls on hover. Edit mode opens NoteEditor pre-filled. Delete shows inline confirmation. | T-032, T-033 | Note card renders rich text correctly. Links are clickable and open in new tab. Timestamps shown. Edit mode works with full formatting preservation. Delete confirmation inline (no modal). Edited indicator shown when appropriate. | High |
| T-036 | Integrate NotesList into application detail page | Add `NotesList` to the application detail page below the application fields. Pass the application ID. Fetch notes server-side and pass as props. | T-021, T-034, T-035 | Notes section appears on application detail page. Notes load correctly. Adding, editing, and deleting notes works end-to-end. Notes list refreshes after mutations. | Medium |

### Phase 6: Polish and Testing

| ID | Title | Description | Dependencies | Acceptance Criteria | Complexity |
|---|---|---|---|---|---|
| T-037 | Write unit tests for utility functions | Test `formatDate`, `formatSalary`, `noteContent` utilities. Test all Zod validation schemas with valid and invalid inputs. | T-014, T-015 | All utility functions have test coverage. Zod schemas tested for all validation rules (required fields, length limits, enum values, cross-field constraints). Tests pass. | Medium |
| T-038 | Write unit tests for UI components | Test `StatusBadge` (all five statuses), `Button` (variants, disabled), `Input` (error state), `EmptyState`, `ConfirmDialog`. Use React Testing Library. | T-009, T-010, T-011 | Each component has a test file. Tests verify rendering, prop handling, and user interactions. Tests pass. | Medium |
| T-039 | Write integration tests for Server Actions | Test `createApplication`, `updateApplication`, `deleteApplication`, `createSection`, `renameSection`, `deleteSection`, `createNote`, `updateNote`, `deleteNote`. Mock Supabase client. Verify validation, error handling, and `revalidatePath` calls. | T-016, T-024, T-032 | All Server Actions have test coverage. Tests verify: valid input succeeds, invalid input returns errors, unauthorized calls rejected, revalidation called. | High |
| T-040 | End-to-end smoke test | Manually test the full user journey: sign up, create sections, create applications with sections and statuses, view list in both modes, edit an application, change status, add/edit/delete notes, delete a section (verify applications become unsectioned), delete an application (verify notes cascade). | All | All acceptance criteria from feature specs verified. No console errors. No broken navigation. All edge cases handled. | Medium |
| T-041 | Set up root page redirect | Configure `src/app/page.tsx` to redirect authenticated users to `/applications` (the main dashboard view). Unauthenticated users are caught by middleware and sent to `/login`. | T-008, T-017 | Visiting `/` as an authenticated user redirects to `/applications`. Visiting `/` as an unauthenticated user redirects to `/login`. | Low |

### Task Dependency Graph

```
Phase 1 (Setup):
T-001 -> T-002, T-003, T-012, T-013, T-015
T-001 + T-002 -> T-009
T-003 -> T-004 -> T-005, T-006
T-006 -> T-007 -> T-008
T-009 -> T-010, T-011
T-013 -> T-014

Phase 2 (Applications):
T-004 + T-005 + T-006 + T-014 -> T-016
T-008 + T-010 + T-011 + T-013 + T-016 -> T-017
T-009 + T-010 + T-012 -> T-018
T-009 + T-010 + T-012 + T-014 + T-016 -> T-019
T-017 + T-019 -> T-020
T-010 + T-011 + T-016 + T-017 -> T-021
T-019 + T-021 -> T-022
T-009 + T-011 + T-016 -> T-023

Phase 3 (Sections):
T-004 + T-005 + T-006 + T-014 -> T-024
T-008 + T-011 + T-024 -> T-025
T-009 + T-014 + T-024 -> T-026
T-009 + T-011 + T-024 -> T-027
T-019 + T-024 + T-025 -> T-028

Phase 4 (Status):
T-010 + T-012 + T-016 -> T-029
T-021 + T-029 -> T-030

Phase 5 (Notes):
T-001 -> T-031
T-004 + T-005 + T-006 + T-014 + T-015 -> T-032
T-031 -> T-033
T-033 -> T-034
T-032 + T-033 -> T-035
T-021 + T-034 + T-035 -> T-036

Phase 6 (Polish):
T-014 + T-015 -> T-037
T-009 + T-010 + T-011 -> T-038
T-016 + T-024 + T-032 -> T-039
All -> T-040
T-008 + T-017 -> T-041
```

### Parallelization Opportunities

Within each phase, several tasks can be worked on simultaneously:

- **Phase 1**: After T-001 completes, T-002/T-003/T-012/T-013/T-015 can all proceed in parallel. T-009 waits for T-002 only. T-010/T-011 wait for T-009.
- **Phase 2**: T-017 and T-018 can be built in parallel once their dependencies are met. T-019 can start as soon as T-009/T-014/T-016 are done (does not depend on T-017).
- **Phase 3**: T-024 can start as soon as Phase 1 infrastructure is done -- it does not depend on Phase 2. T-025, T-026, T-027 can be parallelized once T-024 is done.
- **Phase 4**: T-029 can start as soon as T-010/T-012/T-016 are done -- it does not need to wait for all of Phase 2 or Phase 3.
- **Phase 5**: T-031 can start immediately after T-001. T-032 and T-033 can proceed in parallel once their dependencies are met.
- **Phase 6**: T-037 and T-038 can be done as soon as the components/utilities they test are built. They do not need to wait for the full application to be assembled.

---

## 7. Technical Considerations

### 7.1 Performance

- **Server Components by default**: Pages are Server Components that fetch data and render HTML on the server. This minimizes client-side JavaScript. Only interactive components (forms, editors, toggles) are Client Components.
- **Supabase query efficiency**: The `select('*, sections(name)')` pattern uses Supabase's PostgREST join syntax to fetch related data in a single query. No N+1 problems.
- **Indexes**: All common query patterns have dedicated indexes (`applications_user_date_idx` for the list view, `notes_application_created_idx` for notes on a detail page, `sections_user_id_name_idx` for the sections dropdown and management page).
- **Client bundle**: Tiptap is the largest client dependency. It is only loaded on the application detail page (where notes are edited), not on the list view. Code splitting via Next.js dynamic imports can defer its loading if needed.

### 7.2 Security

- **Row Level Security**: Every table has RLS enabled with policies scoped to `auth.uid() = user_id`. Even if a bug in the application layer leaks a query, the database will not return another user's data.
- **Server-side validation**: All Server Actions validate input with Zod before writing to the database. The database also enforces constraints (CHECK, NOT NULL, FK, unique index) as a second line of defense.
- **Content sanitization**: Note content (Tiptap JSON) is sanitized server-side to strip disallowed node types and marks before storage. Only `doc`, `paragraph`, `heading`, `bulletList`, `orderedList`, `listItem`, `text`, and `hardBreak` nodes are allowed. Only `bold`, `italic`, and `link` marks are allowed.
- **Link safety**: All links rendered from notes use `target="_blank"` with `rel="noopener noreferrer"`.
- **No HTML storage**: Rich text is stored as JSON, not HTML. HTML is generated only at render time by Tiptap, eliminating persistent XSS vectors.
- **Auth middleware**: Route-level protection ensures no unauthenticated access to any dashboard page or Server Action.
- **Environment variables**: Supabase keys are stored in `.env.local` and never committed. `.env.example` documents the required variables without values.

### 7.3 Scalability

- **Multi-user readiness**: Although this is a single-user app, the architecture is fully multi-user ready. All tables include `user_id`. RLS policies are user-scoped. No code assumes a single user. Adding multi-user support would require only UI changes (e.g., a user settings page), not architectural changes.
- **Feature extensibility**: The folder structure is organized by feature (`components/features/applications/`, `components/features/sections/`, `components/features/notes/`). New features (e.g., contacts, reminders, analytics) follow the same pattern and add a new directory without touching existing ones.
- **Status history**: The schema can be extended with a `status_history` table that records every transition. This requires no changes to the existing `applications` table -- just a new table and a trigger or application-level insert on status change.

### 7.4 Developer Experience

- **TypeScript strict mode**: No `any` types. All data shapes are defined as interfaces. Supabase client is typed against the database schema.
- **Zod + TypeScript**: Zod schemas infer TypeScript types, ensuring validation logic and type definitions stay in sync.
- **Component colocation**: Every component's styles, tests, and exports live in the same folder. Finding related files is trivial.
- **Barrel exports**: Every component folder has an `index.ts` that re-exports the component. Imports are clean: `import { Button } from '@/components/ui/Button'`.
- **Constants as single source of truth**: Status labels, colors, work type labels, and route paths are defined once in `constants/`. Changes propagate everywhere automatically.
- **SASS variables and mixins**: Design tokens (colors, spacing, breakpoints) are defined once in `_variables.scss` and used in all `.module.scss` files. Changing a color updates the entire app.

### 7.5 Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Tiptap bundle size bloats the client | Medium | Medium | Use dynamic imports to load Tiptap only on the detail page. Monitor bundle size with `next/bundle-analyzer`. |
| Supabase cold starts slow down first page load | Low | Low | Supabase's hosted service has minimal cold start. If latency is a concern, use connection pooling (Supavisor). |
| Tiptap JSON format changes between versions | Low | High | Pin Tiptap version in `package.json`. Test content round-trips (save and re-edit) after any upgrade. |
| RLS policies misconfigured, leaking data | Low | Critical | Write integration tests that attempt cross-user access and verify denial. Review policies in every migration. |
| Zod schema and DB constraints drift out of sync | Medium | Medium | Document all constraints in this architecture doc. Review both Zod schemas and SQL constraints together during any schema change. |

---

## Appendix: Key Library Versions (Recommended)

| Library | Purpose | Recommended Version |
|---|---|---|
| `next` | Framework | 15.x (latest stable) |
| `react` / `react-dom` | UI library | 19.x (latest stable) |
| `typescript` | Language | 5.x (latest stable) |
| `sass` | Stylesheet preprocessor | 1.x (latest stable) |
| `@supabase/supabase-js` | Supabase client | 2.x (latest stable) |
| `@supabase/ssr` | Supabase SSR helpers | 0.5.x (latest stable) |
| `zod` | Schema validation | 3.x (latest stable) |
| `@tiptap/react` | Rich text editor | 2.x (latest stable) |
| `@tiptap/starter-kit` | Tiptap base extensions | 2.x (latest stable) |
| `@tiptap/extension-link` | Tiptap link extension | 2.x (latest stable) |
| `@testing-library/react` | Component testing | 16.x (latest stable) |
| `vitest` or `jest` | Test runner | Latest stable |
