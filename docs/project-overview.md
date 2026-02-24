# Project Overview: Job Tracker App

**Status**: Active Development
**Created**: 2026-02-22
**Last Updated**: 2026-02-22
**Author**: Product Docs Manager

---

## Summary

Job Tracker App is a personal productivity tool that helps a single user manage and monitor their job search from first application through final decision. It provides a central place to record every company applied to, organize applications into user-defined sections, track where each application stands in the hiring process, and attach rich-text notes to capture context along the way.

---

## Problem Statement

Job searching is an inherently scattered process. Applications are submitted across LinkedIn, company career pages, referrals, and job boards. Follow-up emails live in inboxes. Interview prep notes are scattered across notebooks or documents. Recruiter contact information gets lost. Without a central system, it is easy to miss follow-ups, forget where things stand, or lose track of key details from a conversation.

Job Tracker App solves this by giving the user one authoritative place to record every application, organize them into sections that match their own mental model, move each one through a defined status workflow, and capture rich-text notes so nothing is forgotten.

---

## Goals

1. Eliminate the mental overhead of tracking multiple open applications simultaneously
2. Provide a clear picture of the job search pipeline at any moment
3. Ensure no application or follow-up falls through the cracks
4. Be fast and low-friction to update — the tool must not become a chore

---

## Non-Goals (v1)

- Multi-user collaboration or sharing
- Email integration or automatic status updates
- Resume management or storage
- Calendar integration for interview scheduling
- AI-assisted writing (cover letters, follow-up emails)
- Dashboard or analytics view
- Searching or filtering the applications list

---

## User

This is a single-user application. There is one person — the job seeker — who creates, reads, updates, and deletes all data. Authentication via Supabase Auth is included to protect personal data, but there is no concept of different roles or permissions within the application.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js (App Router) |
| UI Library | React.js |
| Language | TypeScript |
| Styling | SASS Modules |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth |
| Hosting | TBD |

---

## Core Features (v1)

| Feature | Description | Spec |
|---|---|---|
| Job Applications CRUD | Create, view, edit, and delete job application records | [job-applications-crud.md](./features/job-applications-crud.md) |
| Sections | User-defined groups for organizing applications | [sections.md](./features/sections.md) |
| Status Tracking | Track each application through five hiring pipeline stages | [status-tracking.md](./features/status-tracking.md) |
| Notes | Attach timestamped rich-text notes to any application | [notes.md](./features/notes.md) |

---

## Data Model Overview

Three tables power the application:

**`sections`** — One record per user-defined section. Stores the section name. Applications reference sections via a nullable FK.

**`applications`** — One record per job application. Stores all structured data about the company, role, salary, location, status, and which section it belongs to.

**`notes`** — One record per note. Each note belongs to one application. Stores rich-text content as JSON with timestamps.

All tables are protected by Supabase Row Level Security (RLS), scoped to the authenticated user's `user_id`. See individual feature specs for full schema details.

---

## Status Workflow

Applications move through the following statuses:

```
applied
  |-- interview_scheduled
  |     |-- interview_completed
  |     |     |-- offer_received
  |     |     |-- interview_scheduled  (additional rounds)
  |     |     |-- rejected
  |     |-- rejected
  |-- rejected
```

Any application can be marked `rejected` from any status. The status can also be moved backward (e.g., from `rejected` back to `applied`) to handle data corrections.

---

## Key Assumptions

- The user is always authenticated. There is no public-facing content.
- A single Supabase project handles both auth and the database.
- The application is built using the Next.js App Router.
- All monetary values (salary ranges) are stored in USD as integers.
- Dates are stored in UTC; display formatting is handled on the client.

---

## Document Index

See [docs/README.md](./README.md) for the full documentation index.
