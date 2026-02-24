# Job Tracker App — Documentation Index

This folder contains all product documentation for the Job Tracker App. Start here to find any spec or decision document.

---

## Project

| Document | Description |
|---|---|
| [project-overview.md](./project-overview.md) | High-level summary, goals, tech stack, data model overview, and non-goals |
| [architecture.md](./architecture.md) | Full architecture plan: system design, database schema, folder structure, task breakdown, TypeScript types |

---

## Feature Specifications

| Feature | Status | Document |
|---|---|---|
| Job Applications CRUD | Draft | [features/job-applications-crud.md](./features/job-applications-crud.md) |
| Sections | Draft | [features/sections.md](./features/sections.md) |
| Status Tracking | Draft | [features/status-tracking.md](./features/status-tracking.md) |
| Notes | Draft | [features/notes.md](./features/notes.md) |

---

## Feature Summary

**Job Applications CRUD** — The core of the app. Log a job application with company name, position, location, salary range, work type, and date applied. View all applications in a list or grouped by section. Open a detail view, edit any field, or delete a record.

**Sections** — User-defined groups for organizing applications. Create sections with any name (e.g., "LinkedIn", "Dream Companies", "Referrals"). Assign applications to a section or leave them unsectioned. Rename or delete sections at any time — deleting a section moves its applications to Unsectioned rather than deleting them.

**Status Tracking** — Every application has one of five statuses: Applied, Interview Scheduled, Interview Completed, Offer Received, or Rejected. Status is displayed as a colored badge in the list and detail views. The user can update status from the detail view at any time. All transitions are free — no enforced order.

**Notes** — Attach timestamped rich-text notes to any application. The editor supports headings (H1, H2), bullet lists, numbered lists, bold, italic, and clickable URLs. Notes are stored as JSON (Tiptap format) and rendered on the application detail view in reverse-chronological order. Notes can be edited and deleted inline.

---

## Document Status Key

| Status | Meaning |
|---|---|
| Draft | Written, not yet reviewed or approved |
| In Review | Under active review with stakeholders |
| Approved | Signed off, ready for development |
| In Development | Currently being built |
| Complete | Built and shipped |
