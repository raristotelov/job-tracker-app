# Feature: Inline Application Creation and Editing Drawer

**Status**: Complete
**Created**: 2026-02-24
**Last Updated**: 2026-02-28
**Author**: Product Docs Manager

---

## Overview

Instead of navigating away to a separate page to create or edit an application, the user opens a slide-in side panel directly from the applications list. The panel contains the same application form, in either create or edit mode. On successful submit, the drawer closes and the list updates to reflect the change without a full page transition.

This change reduces friction in both the creation and editing flows and keeps the user anchored to the list view throughout.

---

## Problem Statement

The current creation flow requires a full page navigation to `/applications/new`, a form submission, and then a redirect to the new record's detail page. For a user who is in a rapid data-entry mode — logging several applications back-to-back — this means three page loads per record and constant context-switching away from the list view.

Similarly, editing an application currently requires navigating to `/applications/[id]/edit`, making a change, and being redirected to the detail page — two page loads away from the list.

An inline drawer eliminates those transitions for both flows. The user stays on the list page throughout.

---

## User Stories

- As a job seeker, I want to add a new application without leaving the list page so that I can stay in the context of my pipeline.
- As a job seeker, I want to edit an application without leaving the list page so that I can make quick corrections without losing my place.
- As a job seeker, I want to close the drawer without submitting so that I can abort create or edit without side effects.
- As a job seeker, I want the list to update immediately after I submit so that I can confirm my changes were saved without navigating away.
- As a job seeker, I want to be able to access the creation form directly by URL (`/applications/new`) so that the existing link behavior is not broken.
- As a job seeker, I want to be able to access the edit form directly by URL (`/applications/[id]/edit`) so that the fallback page remains functional.

---

## Detailed Requirements

### Functional Requirements

1. The "Add Application" button on the applications list opens a side drawer panel containing the application creation form. No page navigation occurs.
2. The applications table includes an "Actions" column as the last column. Each row contains an "Edit" button and a "Delete" button in this column.
3. Clicking the "Edit" button for a row opens the same side drawer, pre-filled with that application's data, in edit mode.
4. Clicking the "Delete" button for a row prompts a `window.confirm()` native browser dialog. On confirmation, the application is deleted via the `deleteApplication` server action and the list revalidates.
5. Both the Edit and Delete buttons use `e.stopPropagation()` to prevent the row click (which opens the detail popup) from firing.
6. The drawer title reads "Add Application" in create mode and "Edit Application" in edit mode.
7. The drawer can be dismissed by: clicking the close button inside the drawer, pressing the Escape key, or clicking the backdrop overlay.
8. On successful form submission in either mode, the drawer closes, the applications list revalidates, and the table reflects the updated data. No page navigation occurs.
9. On successful create submission, focus returns to the "Add Application" button that originally opened the drawer.
10. On successful edit submission, focus returns to the "Edit" button of the row that was being edited.
11. On form validation failure or server error in either mode, the drawer stays open and error messages are displayed inline — identical behavior to the current page-based form.
12. The `/applications/new` page remains accessible and functional as a fallback. It is not removed or redirected.
13. The `/applications/[id]/edit` page remains accessible and functional as a fallback. It is not removed or redirected.
14. When the applications list is empty, the empty state's "Add Application" action opens the drawer rather than navigating to `/applications/new`.
15. The sections dropdown in the drawer form is populated with the same sections data fetched by the page Server Component — no separate client-side fetch is needed.

### UI/UX Requirements

- The drawer slides in from the right edge of the viewport using a CSS `transform: translateX()` animation. The transition duration is 250ms.
- A semi-transparent backdrop covers the rest of the page while the drawer is open. Clicking the backdrop closes the drawer.
- The drawer panel has a fixed width of 480px on desktop. On viewports 768px wide and below, the drawer takes full viewport width.
- The drawer contains a header with a title and a close button (X icon). The title is "Add Application" in create mode and "Edit Application" in edit mode. The form content is below the header and is independently scrollable if it overflows.
- Body scroll is locked while the drawer is open.
- The drawer renders via `createPortal` to `document.body` to avoid z-index stacking context issues.
- Z-index values: backdrop at 1000, drawer panel at 1001.
- The "Add Application" button in the toolbar changes from a `<Link>` element to a `<button>` element. It retains its existing visual style.
- The empty state's action changes from an `actionHref` prop (which renders an anchor) to an `onAction` callback prop (which renders a button). The empty state component gains an optional `onAction` prop alongside the existing `actionHref` prop; both remain supported.
- The "Actions" column header has no visible label (an `aria-label` of "Actions" is set on the `<th>` for screen reader accessibility). The column is right-aligned and has a fixed narrow width so it does not disrupt the layout of content columns.
- The "Edit" button in each row is a text button (not an icon-only button). It renders with sufficient contrast and a visible focus ring. It does not navigate the page.

### Data Requirements

- No new database tables or columns are required.
- The `ApplicationsPage` Server Component adds a second Supabase query to fetch all sections for the authenticated user, ordered by name alphabetically. The sections array is passed to `ApplicationList` as a new `sections` prop.
- The `createApplicationInline` server action inserts a record using the same Zod validation and the same `applicationCreateSchema` as the existing `createApplication` action. On success it calls `revalidatePath(ROUTES.APPLICATIONS)` and returns `{ id: string }` instead of calling `redirect()`. On error it returns `{ error, fieldErrors? }` — the same `ApplicationActionError` shape as existing actions.
- A new `updateApplicationInline` server action updates an existing record using the same `applicationUpdateSchema` as the existing `updateApplication` action. On success it calls `revalidatePath(ROUTES.APPLICATIONS)` and returns `{ id: string }` instead of calling `redirect()`. On error it returns `{ error, fieldErrors? }`. It does not revalidate the detail or edit page routes — the drawer user has no need for those caches to update.

### API/Integration Requirements

- Sections are fetched server-side in `ApplicationsPage`:
  ```typescript
  const { data: sectionsData } = await supabase
    .from('sections')
    .select('id, name')
    .order('name', { ascending: true });
  const sections = (sectionsData ?? []) as Section[];
  ```
- `createApplicationInline` signature:
  ```typescript
  export async function createApplicationInline(
    formData: FormData,
  ): Promise<{ id: string } | ApplicationActionError>
  ```
- `updateApplicationInline` signature:
  ```typescript
  export async function updateApplicationInline(
    id: string,
    formData: FormData,
  ): Promise<{ id: string } | ApplicationActionError>
  ```
- `ApplicationList` receives a `sections` prop (already in place) and passes both `applications` and `sections` down to `ApplicationTable` via updated props:
  ```typescript
  interface ApplicationListProps {
    applications: ApplicationWithSection[];
    sections: Section[];
  }
  ```
- `ApplicationTable` receives two new props:
  ```typescript
  interface ApplicationTableProps {
    applications: ApplicationWithSection[];
    sections: Section[];
    onEditClick: (application: ApplicationWithSection, buttonEl: HTMLButtonElement) => void;
    onDeleteClick: (application: ApplicationWithSection) => void;
    onRowClick: (application: ApplicationWithSection) => void;
  }
  ```

---

## Component Architecture

### New Components

#### `SideDrawer` — Generic reusable UI component

**Location**: `src/components/ui/SideDrawer/`

Files:
- `SideDrawer.tsx` — Component implementation
- `SideDrawer.module.scss` — Styles, animation, responsive breakpoints
- `SideDrawer.test.tsx` — Unit tests
- `index.ts` — Barrel export

Props:
```typescript
interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
```

Responsibilities:
- Renders via `createPortal` to `document.body`
- Manages body scroll lock (`overflow: hidden` on `<body>`) while open
- Traps focus within the panel while open
- Closes on Escape keydown
- Closes when backdrop is clicked
- Applies `aria-modal="true"`, `role="dialog"`, and `aria-labelledby` pointing to the title element

#### `ApplicationDrawer` — Feature wrapper component

> **Note**: This component was originally specified as `CreateApplicationDrawer`. It is renamed to `ApplicationDrawer` to reflect its expanded role handling both create and edit modes.

**Location**: `src/components/features/applications/ApplicationDrawer/`

Files:
- `ApplicationDrawer.tsx` — Composes `SideDrawer` and `ApplicationForm`
- `ApplicationDrawer.module.scss` — Drawer content layout (header, scrollable body, padding)
- `ApplicationDrawer.test.tsx` — Unit tests
- `index.ts` — Barrel export

Props:
```typescript
interface ApplicationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sections: Section[];
  /** When provided, the drawer opens in edit mode with the form pre-filled. */
  editTarget?: ApplicationWithSection;
}
```

Responsibilities:
- Derives the drawer title: `"Edit Application"` when `editTarget` is defined, `"Add Application"` otherwise
- Passes `isOpen`, `onClose`, and derived title to `SideDrawer`
- Passes `sections` and (when editing) `initialData={editTarget}` to `ApplicationForm`
- Passes `onSuccess` and `onCancel` callbacks to `ApplicationForm`
- `onSuccess` calls `onClose()`
- `onCancel` calls `onClose()`

### Modified Components

#### `ApplicationForm`

**File**: `src/components/features/applications/ApplicationForm/ApplicationForm.tsx`

The form already supports `onSuccess` and `onCancel` callback props and uses a discriminated union (`CancelProps`) to enforce that `cancelHref` is required only when `onCancel` is absent. The action-selection logic already handles create modes. The edit path needs to gain inline support.

Additional changes for edit mode:
- Extend the action-selection logic to cover inline edit:
  ```
  if isEditMode and onSuccess defined   -> updateApplicationInline (returns { id }, calls onSuccess)
  if isEditMode and onSuccess not defined -> updateApplication (redirects — page mode, unchanged)
  if !isEditMode and onSuccess defined  -> createApplicationInline (already implemented)
  if !isEditMode and onSuccess not defined -> createApplication (already implemented)
  ```
- Import and call `updateApplicationInline` when in edit mode with `onSuccess` defined.
- When `updateApplicationInline` returns `{ id }`, call `onSuccess(id)`.
- No changes to props — `onSuccess`, `onCancel`, and `initialData` already cover all four branches above.

#### `ApplicationList`

**File**: `src/components/features/applications/ApplicationList/ApplicationList.tsx`

The `sections` prop, `isDrawerOpen` state, `triggerRef`, and the `openDrawer`/`closeDrawer` handlers are already in place for the create flow. Additional changes for edit mode:

- Add `editTarget: ApplicationWithSection | null` state (default `null`).
- Add `editTriggerRef: React.RefObject<HTMLButtonElement | null>` for focus restoration to the specific row's Edit button after the drawer closes.
- Add an `openEditDrawer(app: ApplicationWithSection, buttonEl: HTMLButtonElement)` handler: sets `editTarget = app`, stores `buttonEl` in `editTriggerRef`, and sets `isDrawerOpen = true`.
- Update `closeDrawer` to restore focus to `editTriggerRef.current` when `editTarget` is set, and to `triggerRef.current` when it is not. Then clear `editTarget`.
- Replace `<CreateApplicationDrawer>` with `<ApplicationDrawer>`, passing the new `editTarget` prop.
- Pass `onEditClick` to `ApplicationTable` — the callback calls `openEditDrawer` with the application and the button element.

#### `ApplicationList.module.scss`

**File**: `src/components/features/applications/ApplicationList/ApplicationList.module.scss`

Change:
- The `.addButton` class currently styles an anchor tag. Update styles as needed to ensure they apply correctly to a `<button>` element (remove any link-specific resets if present, ensure `cursor: pointer` and `border: none` are set).

#### `ApplicationTable`

**File**: `src/components/features/applications/ApplicationList/ApplicationTable/ApplicationTable.tsx`

This sub-component renders the actual `<table>` element. Changes:

- Add `onEditClick: (application: ApplicationWithSection, buttonEl: HTMLButtonElement) => void` prop.
- Add `onDeleteClick: (application: ApplicationWithSection) => void` prop.
- Add an "Actions" `<th>` as the final column header. Set `aria-label="Actions"` and leave its text content empty.
- For each row, add an "Actions" `<td>` as the final cell containing an "Edit" `<button>` and a "Delete" `<button>`, wrapped in a `.actionButtons` container. Both buttons use `e.stopPropagation()` to prevent the row click from firing. The Edit button passes the DOM element to the parent for focus restoration:
  ```typescript
  onClick={(e) => { e.stopPropagation(); onEditClick(app, e.currentTarget); }}
  ```
  The Delete button calls:
  ```typescript
  onClick={(e) => { e.stopPropagation(); onDeleteClick(app); }}
  ```

#### `ApplicationTable.module.scss`

**File**: `src/components/features/applications/ApplicationList/ApplicationTable/ApplicationTable.module.scss`

Changes:
- Add `.actionsCell` class: `text-align: right; white-space: nowrap; width: 1%;` (the `width: 1%` trick collapses the column to its minimum content width).
- Add `.editButton` class: minimal button reset styles (`background: none; border: none; cursor: pointer; padding: ...`) plus sufficient color contrast for the "Edit" label text.
- Add `.deleteButton` class: same button reset styles as `.editButton`, with a red/danger color to indicate destructive action.
- Add `.actionButtons` class: wraps the Edit and Delete buttons inside a cell (`display: inline-flex; gap: $spacing-sm`) to provide consistent spacing between them.

#### `ApplicationsPage`

**File**: `src/app/(dashboard)/applications/page.tsx`

Changes:
- Add a second Supabase query to fetch sections after the applications query.
- Pass `sections` as a prop to `<ApplicationList>`.

#### `EmptyState`

**File**: `src/components/ui/EmptyState/EmptyState.tsx`

Change:
- Add optional `onAction?: () => void` prop.
- When `onAction` is provided, render a `<button>` for the action instead of a `<Link>`. When `actionHref` is provided, continue to render a `<Link>` as today. When both are provided, `onAction` takes precedence.
- Update the `showAction` logic accordingly.

#### `services/applications.ts`

**File**: `src/services/applications.ts`

Changes:
- `createApplicationInline` is already implemented: inserts a record, calls `revalidatePath(ROUTES.APPLICATIONS)`, returns `{ id: string }`. No changes needed.
- Add `updateApplicationInline` after the existing `updateApplication` function. It uses the same `extractFormData`, `buildValidationError`, and `applicationUpdateSchema` already in the file. On success it calls `revalidatePath(ROUTES.APPLICATIONS)` and returns `{ id: string }`. It does not call `redirect()` and does not revalidate the detail or edit page routes.

---

## Acceptance Criteria

### AC-1: Drawer Opens on Button Click
- **Given** the user is on the applications list page
- **When** the user clicks the "Add Application" button in the toolbar
- **Then** the side drawer slides in from the right, the backdrop appears, and the application creation form is visible inside the drawer

### AC-2: Drawer Contains the Full Creation Form
- **Given** the drawer is open
- **When** the user inspects the form
- **Then** all fields present on the `/applications/new` page are present in the drawer: Company Name, Position Title, Job Posting URL, Location, Work Type, Salary Range (min and max), Date Applied, Status, and Section

### AC-3: Sections Populated in Drawer Form
- **Given** the user has one or more sections
- **When** the drawer is open
- **Then** the Section dropdown contains those sections as options, matching the data shown on the `/applications/new` page

### AC-4: Successful Submission Closes Drawer and Updates List
- **Given** the drawer is open and the user fills in all required fields
- **When** the user submits the form
- **Then** the drawer closes, the applications list updates to include the new record, and no page navigation occurs

### AC-5: Focus Returns to Trigger Button After Close
- **Given** the drawer was opened via the "Add Application" button
- **When** the drawer closes (after successful submit or via any dismissal method)
- **Then** keyboard focus returns to the "Add Application" button

### AC-6: Validation Errors Keep Drawer Open
- **Given** the drawer is open and the user submits the form with required fields missing
- **When** the server action returns validation errors
- **Then** the drawer remains open, inline field errors are displayed, and focus moves to the first invalid field

### AC-7: Close Button Dismisses Drawer
- **Given** the drawer is open
- **When** the user clicks the X close button in the drawer header
- **Then** the drawer closes and the form is discarded (no data is saved)

### AC-8: Escape Key Dismisses Drawer
- **Given** the drawer is open
- **When** the user presses the Escape key
- **Then** the drawer closes and the form is discarded

### AC-9: Backdrop Click Dismisses Drawer
- **Given** the drawer is open
- **When** the user clicks on the backdrop area outside the drawer panel
- **Then** the drawer closes and the form is discarded

### AC-10: Body Scroll Locked While Drawer Open
- **Given** the applications list is long enough to scroll
- **When** the drawer is open
- **Then** the page body does not scroll

### AC-11: Empty State Action Opens Drawer
- **Given** the user has no applications (empty state is shown)
- **When** the user clicks the "Add Application" action in the empty state
- **Then** the side drawer opens — no navigation to `/applications/new` occurs

### AC-12: Fallback Page Remains Functional
- **Given** the user navigates directly to `/applications/new`
- **When** the page loads
- **Then** the standalone application creation form is displayed and submitting it still redirects to the new record's detail page

### AC-13: Drawer is Accessible
- **Given** the drawer is open
- **When** a screen reader user interacts with the page
- **Then** the drawer has `role="dialog"`, `aria-modal="true"`, and its title is referenced by `aria-labelledby`; focus is trapped within the drawer and does not reach the content behind the backdrop

### AC-14: Drawer is Full Width on Mobile
- **Given** the user is on a viewport 768px wide or narrower
- **When** the drawer is open
- **Then** the drawer panel occupies the full viewport width

### AC-15: Server Error Keeps Drawer Open
- **Given** the drawer is open and the Supabase insert fails
- **When** the `createApplicationInline` action returns an error
- **Then** the drawer stays open and an error banner is shown at the top of the form with the message "Something went wrong. Your changes were not saved. Please try again."

### AC-16: Actions Column Present in Table
- **Given** the user has at least one application
- **When** the applications list renders
- **Then** the table includes an "Actions" column as the last column, and each row contains an "Edit" button in that column

### AC-17: Edit Button Opens Drawer in Edit Mode
- **Given** the user is on the applications list page
- **When** the user clicks the "Edit" button for a specific row
- **Then** the side drawer slides open with the title "Edit Application" and the form is pre-filled with that application's current data (company name, position title, URL, location, work type, salary range, date applied, status, and section)

### AC-18: Edit Mode Drawer Has Correct Title
- **Given** the user opens the drawer via the "Add Application" button
- **Then** the drawer header reads "Add Application"
- **Given** the user opens the drawer via an "Edit" button in a row
- **Then** the drawer header reads "Edit Application"

### AC-19: Successful Edit Closes Drawer and Updates Row
- **Given** the drawer is open in edit mode with an application's data pre-filled
- **When** the user changes one or more fields and submits the form
- **Then** the drawer closes, the applications list revalidates, the edited row reflects the updated values, and no page navigation occurs

### AC-20: Focus Returns to Edit Button After Drawer Closes
- **Given** the drawer was opened via the "Edit" button in a specific row
- **When** the drawer closes (after successful save or via any dismissal method)
- **Then** keyboard focus returns to that row's "Edit" button

### AC-21: Edit Validation Errors Keep Drawer Open
- **Given** the drawer is open in edit mode and the user clears a required field and submits
- **When** the `updateApplicationInline` action returns validation errors
- **Then** the drawer remains open, inline field errors are displayed, and focus moves to the first invalid field

### AC-22: Edit Server Error Keeps Drawer Open
- **Given** the drawer is open in edit mode and the Supabase update fails
- **When** the `updateApplicationInline` action returns an error
- **Then** the drawer stays open and an error banner is shown at the top of the form with the message "Something went wrong. Your changes were not saved. Please try again."

### AC-23: Edit Fallback Page Remains Functional
- **Given** the user navigates directly to `/applications/[id]/edit`
- **When** the page loads
- **Then** the standalone edit form is displayed and submitting it still redirects to the application's detail page

### AC-24: Edit Drawer Does Not Affect Create Drawer State
- **Given** the user opens the edit drawer for one application, then closes it
- **When** the user clicks "Add Application"
- **Then** the drawer opens in create mode with a blank form and the title "Add Application" — no data from the previous edit session is present

---

## Edge Cases & Error Handling

- **Double-open**: If the drawer is already open and the trigger button is somehow activated again (e.g., via keyboard), the drawer state does not change — it remains open.
- **Sections stale across tabs**: If the user creates a new section in another tab while the drawer is open, that new section will not appear in the dropdown. This is acceptable; the user can close and reopen the drawer to get fresh data, or assign the section from the edit view afterward.
- **Slow submit / double submit**: While `isPending` is true, the submit button shows a loading state and is disabled, preventing double submission.
- **Drawer with no sections**: If the user has no sections, the Section dropdown shows only the "No section" option. This matches the existing form behavior.
- **Animation on low-motion preference**: The drawer should respect the `prefers-reduced-motion` media query. When reduced motion is preferred, the drawer appears/disappears instantly (no sliding animation), but the backdrop fade may remain as it is less disorienting.
- **Switching from edit to create without closing**: Users cannot open a second drawer while one is already open. The "Add Application" button and all "Edit" buttons in the table have no effect while `isDrawerOpen` is `true`. Disable these buttons (via `disabled` attribute or pointer-events) when the drawer is open to make this explicit.

---

## Out of Scope

- Creating a section inline from within the drawer form.
- Persisting the user's draft form content if the drawer is closed before submission.
- Animating the new or updated row into the table when the drawer closes.
- Removing or redirecting `/applications/new` or `/applications/[id]/edit` — both remain fully functional routes.

---

## Dependencies

- The existing `Job Applications CRUD` feature — this is a change to that feature's creation flow, not a new standalone feature. See [job-applications-crud.md](./job-applications-crud.md).
- The existing `Sections` feature — sections data must be fetchable by the page. See [sections.md](./sections.md).
- The `applicationCreateSchema` Zod validator in `src/lib/validators/application.ts` — reused by `createApplicationInline` with no changes.
- The `applicationUpdateSchema` Zod validator in `src/lib/validators/application.ts` — reused by `updateApplicationInline` with no changes.

---

## Open Questions

1. After the drawer closes following a successful submission, should the user be offered a way to navigate to the new record's detail view (e.g., a toast notification with a link)? Currently specified as: no — the list update is the only feedback. Raise this if stakeholders want confirmation.
2. Should the drawer remember the last form state if the user closes it without submitting and then reopens it? Currently specified as: no — the form always resets to blank on open.

---

## Technical Notes

- `createPortal` requires a browser environment. The `SideDrawer` component must be a Client Component (`'use client'`) and the portal target (`document.body`) must only be accessed after mount (use a `useEffect` with a `hasMounted` state guard or an `isMounted` ref to avoid SSR errors).
- Body scroll lock: set `document.body.style.overflow = 'hidden'` on open and restore on close via the cleanup function of a `useEffect` that depends on `isOpen`. Ensure the cleanup always runs, even if the component unmounts while open.
- Focus trap: a lightweight implementation using `keydown` listener on the drawer container to cycle focus through focusable elements on Tab/Shift+Tab is sufficient. No third-party library is required.
- Neither `createApplicationInline` nor `updateApplicationInline` may call `redirect()` — calling redirect inside a Server Action throws an error in the context where a return value is expected by `useActionState`. Return `{ id }` instead.
- TypeScript: `ApplicationForm` should use a discriminated union or overloaded types to ensure `cancelHref` is required when `onCancel` is absent, and optional when `onCancel` is present, so the compiler catches misuse. This union is already implemented.
- The `triggerRef` pattern (store a ref to the button, restore focus on close) is the standard accessible approach for both the create trigger and the per-row edit trigger. Do not use `document.activeElement` at open time for this — it is unreliable across async state updates.
- `editTriggerRef` is populated via `e.currentTarget` inside the Edit button's `onClick` handler, which is synchronous and always refers to the correct DOM element at the time of the click.
