# Feature: Inline Application Detail Popup

**Status**: Draft
**Created**: 2026-02-27
**Last Updated**: 2026-02-27
**Author**: Product Docs Manager

---

## Overview

Clicking a row in the applications list opens a modal popup displaying all of that application's detail data. The user stays on the list page — no navigation to `/applications/[id]` occurs. The existing detail page remains fully functional as a direct-URL fallback.

---

## Problem Statement

Every time the user wants to review an application's details, they are navigated away from the list page. Getting back requires hitting the browser back button or the breadcrumb link. For a user who is scanning through multiple applications, this round-trip is repetitive friction. A popup keeps them anchored to the list while still giving full access to the application's data.

---

## User Stories

- As a job seeker, I want to click an application row and immediately see all its details so that I can review it without leaving the list.
- As a job seeker, I want to dismiss the popup and return to the list in the same scroll position so that I can continue scanning my pipeline.
- As a job seeker, I want to navigate to the full detail page from the popup so that I have access to the detail page's additional actions (edit, delete).

---

## Detailed Requirements

### Functional Requirements

1. Clicking anywhere on an application row in the list (both "All" view and "By Section" view) opens the detail popup for that application. The click does not navigate the page.
2. The popup displays all application fields: Position Title, Company Name, Status, Section, Location, Work Type, Salary Range, Date Applied, Job Posting URL, and the Created / Updated timestamps.
3. The popup includes a "View Full Details" link that navigates to `/applications/[id]` for the displayed application.
4. The popup can be dismissed by: clicking the close button, pressing the Escape key, or clicking the backdrop overlay.
5. On dismiss, the list page remains in place with no navigation change.
6. The `/applications/[id]` detail page is not removed or modified. It remains fully functional as a standalone route.
7. Only one popup can be open at a time. Opening a row while the popup is already open replaces the displayed application with the newly clicked one.

### UI/UX Requirements

- The popup renders as a centered modal overlay, not a side drawer. A semi-transparent backdrop covers the list beneath it.
- The popup panel has a maximum width of 600px and a maximum height of 80vh. Content that overflows the height is scrollable within the panel.
- The popup renders via `createPortal` to `document.body` to avoid z-index stacking context issues.
- Z-index values: backdrop at 1000, popup panel at 1001 (consistent with the existing `SideDrawer` values).
- Body scroll is locked while the popup is open.
- The popup has a header containing the Position Title, Company Name, and a close button (X icon).
- Below the header, application fields are rendered in the same layout and display format as `ApplicationDetail` (using `<dl>` / `<dt>` / `<dd>` field grid, `StatusBadge`, `formatDate`, `formatSalary`, `WORK_TYPE_LABELS`). Optional fields with no value show the `—` placeholder.
- The "View Full Details" link is rendered at the bottom of the popup content area.
- Application rows in the table gain a pointer cursor and a visible focus ring to communicate their clickability.
- Rows do not change their existing layout — no new columns or icons are added to indicate the click behavior. The entire row cell area is the click target.
- The popup respects `prefers-reduced-motion`: the backdrop fade and any open/close animation are disabled when reduced motion is preferred; the popup appears and disappears instantly.

### Data Requirements

- No new database queries are needed. The application data displayed in the popup is the same `ApplicationWithSection` object that is already in the list. The popup receives the object as a prop — no client-side fetch is triggered when a row is clicked.
- No new database tables or columns are required.

### API/Integration Requirements

- None. All data required by the popup is already fetched by `ApplicationsPage` and available in the `applications` array.

---

## Component Architecture

### New Components

#### `ApplicationDetailModal` — Feature popup component

**Location**: `src/components/features/applications/ApplicationDetailModal/`

Files:
- `ApplicationDetailModal.tsx` — Component implementation
- `ApplicationDetailModal.module.scss` — Modal-specific layout styles
- `ApplicationDetailModal.test.tsx` — Unit tests
- `index.ts` — Barrel export

Props:
```typescript
interface ApplicationDetailModalProps {
  application: ApplicationWithSection | null;
  isOpen: boolean;
  onClose: () => void;
}
```

Responsibilities:
- Renders via `createPortal` to `document.body`
- Manages body scroll lock while open
- Closes on Escape keydown
- Closes when backdrop is clicked
- Traps focus within the panel while open
- Applies `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the title element (position title)
- Renders all application fields using the same display utilities as `ApplicationDetail`: `StatusBadge`, `formatDate`, `formatSalary`, `WORK_TYPE_LABELS`
- Renders a "View Full Details" link to `ROUTES.APPLICATION_DETAIL(application.id)` at the bottom of the content

When `application` is `null`, the modal renders nothing (returns `null`) regardless of `isOpen`. This keeps the component safe during the initial render before a row has ever been clicked.

### Reuse Opportunity

The `SideDrawer` component already implements portal rendering, body scroll lock, Escape-key dismiss, backdrop dismiss, and focus trapping. `ApplicationDetailModal` should extract and reuse the generic behavior from `SideDrawer` where possible — either by accepting a shared `Modal` primitive if one is introduced, or by following the same internal implementation pattern. Do not duplicate the focus-trap and scroll-lock logic independently if the `SideDrawer` implementation can be factored into a shared utility or base component.

### Modified Components

#### `ApplicationTable`

**File**: `src/components/features/applications/ApplicationList/ApplicationTable/ApplicationTable.tsx`

Changes:
- Add `onRowClick: (application: ApplicationWithSection) => void` prop to `ApplicationTableProps`.
- Each `<tr>` element receives `onClick={() => onRowClick(app)}`, `style={{ cursor: 'pointer' }}` (or a SASS module class), `tabIndex={0}`, and an `onKeyDown` handler that calls `onRowClick(app)` when Enter or Space is pressed — making the row keyboard-accessible as a clickable element.
- Add `role="button"` or `role="link"` to each `<tr>` so screen readers announce the row's purpose. Use `aria-label={`View details for ${app.position_title} at ${app.company_name}`}` on each `<tr>`.
- Rows already navigate implicitly; the existing row `<a>` link behavior (if any) is replaced by the `onRowClick` callback. If the current implementation uses `<Link>` wrappers inside cells, those are removed from the row cells and the row itself becomes the interactive element. The "View Full Details" link inside the popup serves as the path to the full page.

#### `ApplicationList`

**File**: `src/components/features/applications/ApplicationList/ApplicationList.tsx`

Changes:
- Add `selectedApplication: ApplicationWithSection | null` state (default `null`).
- Add `isDetailOpen: boolean` state (default `false`).
- Add `openDetail(app: ApplicationWithSection)` handler: sets `selectedApplication = app` and `isDetailOpen = true`.
- Add `closeDetail()` handler: sets `isDetailOpen = false`. `selectedApplication` is kept in state (not cleared to `null`) until after the close animation completes, to prevent the popup content from disappearing before the fade-out finishes. Clear `selectedApplication` after a suitable delay (e.g., 300ms) or on the animation end event.
- Pass `onRowClick={openDetail}` to every `<ApplicationTable>` instance (both in the "All" view and in each group of the `BySectionView`).
- Render `<ApplicationDetailModal>` at the bottom of the component's JSX, passing `application={selectedApplication}`, `isOpen={isDetailOpen}`, and `onClose={closeDetail}`.
- The `BySectionView` sub-component receives a new `onRowClick` prop and passes it through to each `<ApplicationTable>` it renders.

---

## Acceptance Criteria

### AC-1: Row Click Opens Popup
- **Given** the user is on the applications list page with at least one application
- **When** the user clicks anywhere on an application row
- **Then** the detail popup opens over the list, the backdrop appears, and no page navigation occurs

### AC-2: Popup Displays All Application Fields
- **Given** the popup is open for a specific application
- **When** the user inspects the popup content
- **Then** all of the following are visible: Position Title, Company Name, Status (as a badge), Section, Location, Work Type, Salary Range, Date Applied, Job Posting URL, and Created / Updated timestamps. Optional fields with no value display "—".

### AC-3: Popup Displays Correct Data
- **Given** the user clicks a specific row
- **When** the popup opens
- **Then** every field in the popup matches the data of the application in that row — not any other application

### AC-4: View Full Details Link Navigates to Detail Page
- **Given** the popup is open
- **When** the user clicks "View Full Details"
- **Then** the browser navigates to `/applications/[id]` for the displayed application

### AC-5: Close Button Dismisses Popup
- **Given** the popup is open
- **When** the user clicks the X close button in the popup header
- **Then** the popup closes and the list is visible; no navigation occurs

### AC-6: Escape Key Dismisses Popup
- **Given** the popup is open
- **When** the user presses the Escape key
- **Then** the popup closes

### AC-7: Backdrop Click Dismisses Popup
- **Given** the popup is open
- **When** the user clicks on the backdrop area outside the popup panel
- **Then** the popup closes

### AC-8: Body Scroll Locked While Popup Open
- **Given** the applications list is long enough to scroll
- **When** the popup is open
- **Then** the page body does not scroll behind the backdrop

### AC-9: Popup is Accessible
- **Given** the popup is open
- **When** a screen reader user interacts with the page
- **Then** the popup has `role="dialog"`, `aria-modal="true"`, and its title element is referenced by `aria-labelledby`; focus is trapped within the popup and does not reach the content behind the backdrop

### AC-10: Keyboard-Accessible Rows
- **Given** the user is navigating the list with a keyboard
- **When** the user tabs to an application row and presses Enter or Space
- **Then** the detail popup opens for that application

### AC-11: Opening a Second Row Replaces Popup Content
- **Given** the popup is open showing Application A
- **When** the user closes the popup and clicks a different row (Application B)
- **Then** the popup opens and displays Application B's data

### AC-12: Popup Content Scrollable When Tall
- **Given** the popup is open for an application with data in all fields
- **When** the popup content exceeds 80vh
- **Then** the popup panel does not grow beyond 80vh; the content area scrolls internally while the header remains fixed

### AC-13: Fallback Detail Page Unaffected
- **Given** the user navigates directly to `/applications/[id]`
- **When** the page loads
- **Then** the full detail page displays correctly — the popup feature has no effect on this route

### AC-14: By Section View Rows Are Also Clickable
- **Given** the user has switched to the "By Section" view
- **When** the user clicks a row in any section group
- **Then** the detail popup opens for that application

---

## Edge Cases & Error Handling

- **Stale data in popup**: The popup displays data from the already-fetched list array. If the application was updated in another tab since the list last loaded, the popup shows the stale snapshot. This is acceptable; the user can navigate to the full detail page via the "View Full Details" link for fresh data. A full solution would require real-time subscriptions and is out of scope.
- **Row click while popup already open**: Clicking another row while the popup is open replaces the popup's content with the newly clicked application's data immediately. The popup does not close and reopen — the content swaps in place.
- **Animation with reduced motion**: When `prefers-reduced-motion: reduce` is set, the popup and backdrop appear/disappear instantly with no transition.
- **Very long field values**: Long URLs and free-text fields (location, etc.) wrap within their `<dd>` cells rather than overflowing the popup panel. URLs are rendered as `<a>` tags and may truncate with `overflow-wrap: break-word` applied.
- **No applications**: When the list is empty, the empty state is shown and there are no rows to click — the popup is never triggered. No special handling required.

---

## Out of Scope

- Editing an application from within the popup. The edit flow remains in the drawer (per `inline-application-creation-drawer.md`) and the full edit page.
- Deleting an application from within the popup. Delete remains on the full detail page only.
- Adding or viewing notes from within the popup.
- Fetching fresh application data when the popup opens — the popup uses the list's already-fetched data only.
- Real-time updates to popup content while it is open.
- Showing the popup when navigating directly to `/applications/[id]` (the full page is always used for direct URL access).

---

## Dependencies

- `Job Applications CRUD` — the applications list and `ApplicationWithSection` type this feature reads from. See [job-applications-crud.md](./job-applications-crud.md).
- `Inline Application Creation Drawer` — already modified `ApplicationTable` and `ApplicationList`. The row-click changes in this spec layer on top of those changes. See [inline-application-creation-drawer.md](./inline-application-creation-drawer.md).
- `SideDrawer` component (`src/components/ui/SideDrawer/`) — the existing portal/scroll-lock/focus-trap implementation to reference or factor into a shared primitive.
- `ApplicationDetail` component — the field rendering logic, display utilities (`formatDate`, `formatSalary`, `WORK_TYPE_LABELS`), and `StatusBadge` to reuse inside the popup.

---

## Open Questions

1. Should the row click behavior and the detail page link coexist — i.e., should individual cells (e.g., company name) remain as `<Link>` elements navigating to the full detail page, while the rest of the row triggers the popup? Currently specified as: no — the entire row triggers the popup; the "View Full Details" link inside the popup is the path to the detail page.
2. Should focus return to the clicked row when the popup is closed? Not specified in the current discussion. If accessibility testing reveals this is expected behavior, store a `triggerRef` (same pattern as the drawer) and restore focus on close.

---

## Technical Notes

- The popup is a Client Component (`'use client'`). It must guard `document.body` access with a `hasMounted` state or ref — same pattern as `SideDrawer`.
- `ApplicationTable` currently uses cell-level links or plain cells. If cells contain `<Link>` or `<a>` elements, clicking them would both trigger the row's `onClick` and follow the link (event bubbling). Before adding `onRowClick` to `<tr>`, audit existing cell contents and remove any navigation-producing elements from the cells. The "View Full Details" link moves exclusively into the popup.
- The `<tr>` element is not natively interactive. Adding `tabIndex={0}`, `role="button"`, and keyboard handlers (`onKeyDown` for Enter/Space) is required for full keyboard and screen reader support.
- Row click and the existing "Edit" button (from the creation drawer spec) must not conflict. The Edit button's `onClick` should call `e.stopPropagation()` to prevent the row's `onRowClick` from also firing when the Edit button is clicked.
- TypeScript: `selectedApplication` is typed as `ApplicationWithSection | null`. The `ApplicationDetailModal` component returns `null` when `application` is `null`, so the popup is safe to render unconditionally in `ApplicationList`'s JSX.
- Do not use `replace_all: true` on any Edit tool call when implementing — use targeted individual edits to avoid corrupting unrelated identifiers.
