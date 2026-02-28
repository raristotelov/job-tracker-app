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
| Job Applications CRUD | Complete | [features/job-applications-crud.md](./features/job-applications-crud.md) |
| Sections | Complete | [features/sections.md](./features/sections.md) |
| Status Tracking | Complete | [features/status-tracking.md](./features/status-tracking.md) |
| Notes | Draft | [features/notes.md](./features/notes.md) |
| Inline Application Creation Drawer | Complete | [features/inline-application-creation-drawer.md](./features/inline-application-creation-drawer.md) |
| Inline Application Detail Popup | Complete | [features/inline-application-detail-popup.md](./features/inline-application-detail-popup.md) |

---

## Feature Summary

**Job Applications CRUD** — The core of the app. Log a job application with company name, position, location, salary range, work type, and date applied. View all applications in a list or grouped by section. Open a detail view, edit any field, or delete a record.

**Sections** — User-defined groups for organizing applications. Create sections with any name (e.g., "LinkedIn", "Dream Companies", "Referrals"). Assign applications to a section or leave them unsectioned. Rename or delete sections at any time — deleting a section moves its applications to Unsectioned rather than deleting them.

**Status Tracking** — Every application has one of five statuses: Applied, Interview Scheduled, Interview Completed, Offer Received, or Rejected. Status is displayed as a colored badge in the list and detail views. The user can update status from the detail view at any time. All transitions are free — no enforced order.

**Notes** — Attach timestamped rich-text notes to any application. The editor supports headings (H1, H2), bullet lists, numbered lists, bold, italic, and clickable URLs. Notes are stored as JSON (Tiptap format) and rendered on the application detail view in reverse-chronological order. Notes can be edited and deleted inline.

**Inline Application Creation Drawer** — Converts the "Add Application" flow from a separate page to a slide-in side panel on the applications list. The user clicks "Add Application", a 480px drawer slides in from the right with the full creation form, and on successful submit the drawer closes and the new row appears in the table — no page navigation required. The `/applications/new` page is kept as a functional fallback. Introduces a reusable `SideDrawer` UI component with CSS animation, portal rendering, and accessibility (focus trap, Escape to close, aria-modal).

**Inline Application Detail Popup** — Clicking a row in the applications list opens a centered modal popup showing all of that application's data — position title, company name, status badge, section, location, work type, salary range, date applied, job posting URL, and timestamps. No navigation occurs. A "View Full Details" link inside the popup goes to the full `/applications/[id]` page. The popup uses the already-fetched list data (no extra network request). The full detail page is unchanged.

---

## Document Status Key

| Status | Meaning |
|---|---|
| Draft | Written, not yet reviewed or approved |
| In Review | Under active review with stakeholders |
| Approved | Signed off, ready for development |
| In Development | Currently being built |
| Complete | Built and shipped |
