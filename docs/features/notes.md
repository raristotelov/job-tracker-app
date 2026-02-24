# Feature: Notes

**Status**: Draft
**Created**: 2026-02-22
**Last Updated**: 2026-02-22
**Author**: Product Docs Manager

---

## Overview

The user can attach rich-text notes to any application. Notes are a running log for anything that doesn't fit a structured field — a recruiter conversation, interview feedback, salary negotiation details, or a reminder. The editor supports headings, bullet and numbered lists, bold, italic, and clickable URLs. Each note is timestamped and they accumulate on the application detail view.

---

## Problem Statement

Structured fields capture facts, but the hiring process generates a lot of unstructured information. Without somewhere to capture it, the user either loses it or stores it in a disconnected place. Notes keep that context attached to the application it belongs to.

---

## User Stories

- As a job seeker, I want to add a note to an application so that I can capture relevant context while it's fresh.
- As a job seeker, I want to format my notes with headings, bullets, and emphasis so that I can structure information clearly.
- As a job seeker, I want to include clickable URLs in my notes so that I can link to relevant pages without copying text.
- As a job seeker, I want to see all notes for an application in one place so that I have a full history.
- As a job seeker, I want to edit a note so that I can correct or expand what I wrote.
- As a job seeker, I want to delete a note I no longer need.
- As a job seeker, I want notes to be timestamped so that I know when each one was written.

---

## Detailed Requirements

### Functional Requirements

1. The user can add a new note to any application from the application detail view using a rich text editor.
2. The editor supports the following formatting options:
   - **Heading sizes**: Heading 1, Heading 2, and normal paragraph text
   - **Bullet list**: unordered list
   - **Numbered list**: ordered list
   - **Bold**
   - **Italic**
   - **URL / hyperlink**: the user can select text and apply a URL to make it a clickable link, or paste a bare URL which is auto-detected and made clickable
3. A note must contain at least one non-whitespace character of actual content. An editor state with no visible text (e.g., an empty paragraph) is treated as empty and cannot be saved.
4. Notes are displayed in reverse-chronological order (newest first) on the application detail view.
5. Each note renders its formatted content and shows the date/time it was created.
6. URLs in notes are rendered as clickable links that open in a new tab.
7. If a note has been edited, it shows an "edited" indicator alongside the edit timestamp.
8. The user can edit any note inline on the detail view. Editing opens the same rich text editor pre-filled with the existing content.
9. The user can delete any note. Deletion requires a brief inline confirmation.
10. Deleting a note is permanent.
11. When an application is deleted, all its notes are deleted automatically via cascade.

### UI/UX Requirements

- The Notes section sits below the application fields on the detail view.
- The "Add Note" area at the top of the Notes section contains a rich text editor. The editor is collapsed by default (showing a single placeholder line "Add a note...") and expands to a comfortable writing height when the user clicks into it, revealing the formatting toolbar.
- The formatting toolbar appears above the editor content area and contains controls for: Heading 1, Heading 2, Paragraph (normal text), Bold, Italic, Bullet List, Numbered List, and Insert/Edit Link.
- The "Add Note" button is disabled when the editor contains no visible text content.
- Each note is a card showing: the rendered formatted content, the creation timestamp, and Edit/Delete controls that appear on hover or focus.
- URLs in a rendered note are styled as links and open in a new tab (`target="_blank"` with `rel="noopener noreferrer"`).
- Editing a note replaces the card's rendered content with the rich text editor pre-filled with the existing content and its formatting. The same toolbar is present. Save and Cancel buttons appear below the editor. The user must explicitly click Save to persist changes.
- The delete control shows an inline confirmation directly on the card: "Delete this note?" with "Yes, delete" and "Cancel". No modal is used.
- If there are no notes, the section shows: "No notes yet."

### Data Requirements

**`notes` table:**

| Column | Type | Required | Notes |
|---|---|---|---|
| `id` | `uuid` | Yes | Primary key, auto-generated |
| `application_id` | `uuid` | Yes | FK to `applications.id`, ON DELETE CASCADE |
| `user_id` | `uuid` | Yes | FK to `auth.users`, set from session |
| `content` | `jsonb` | Yes | Rich text stored as editor JSON document. Must not represent an empty document. |
| `created_at` | `timestamptz` | Yes | Auto-set on insert |
| `updated_at` | `timestamptz` | Yes | Auto-set on insert and update via DB trigger |

```typescript
interface Note {
  id: string;
  application_id: string;
  user_id: string;
  content: Record<string, unknown>; // Rich text editor JSON document (e.g., Tiptap JSONContent)
  created_at: string;
  updated_at: string;
}
```

### API/Integration Requirements

- **Create**: `supabase.from('notes').insert({ application_id, user_id, content: editorJson })` where `editorJson` is the JSON document object produced by the editor, validated server-side before insert.
- **Read**: `supabase.from('notes').select('*').eq('application_id', id).order('created_at', { ascending: false })`
- **Update**: `supabase.from('notes').update({ content: editorJson }).eq('id', noteId)`
- **Delete**: `supabase.from('notes').delete().eq('id', noteId)`

RLS policy:
```sql
CREATE POLICY "Users manage own notes"
ON notes FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## Acceptance Criteria

### AC-1: Add a Note — Happy Path
- **Given** the user is on the detail view for an application
- **When** the user types content into the rich text editor and clicks "Add Note"
- **Then** a new note record is created in the database, it appears at the top of the Notes section with its formatted content and creation timestamp, and the editor is cleared and collapsed back to its default state

### AC-2: Add a Note — Empty Submission Prevented
- **Given** the rich text editor contains no visible text content (e.g., the user opened it but typed nothing)
- **When** the user attempts to click "Add Note"
- **Then** the button is disabled and no note is created

### AC-3: Add a Note — Formatting Preserved on Save
- **Given** the user composes a note using heading, bullet list, and bold formatting
- **When** the user clicks "Add Note"
- **Then** the saved note renders with all applied formatting intact — headings display at the correct size, bullets appear as a list, and bold text is visually bold

### AC-4: URL in Note — Clickable Link
- **Given** the user adds a note containing a URL (either as a hyperlink applied to text, or a bare URL typed into the editor)
- **When** the note is saved and displayed in read-only mode
- **Then** the URL is rendered as a clickable link that opens in a new browser tab

### AC-5: Notes Display Order
- **Given** an application has multiple notes created at different times
- **When** the user views the detail page
- **Then** notes appear in reverse-chronological order with the most recent at the top

### AC-6: Edit a Note — Happy Path
- **Given** a note exists with formatted content
- **When** the user clicks "Edit", the rich text editor opens pre-filled with the existing content and formatting, the user makes changes, and clicks "Save"
- **Then** the note is updated in the database, the card shows the new formatted content in read-only mode, and an "edited" indicator with the updated timestamp appears

### AC-7: Edit a Note — Formatting Survives Round-trip
- **Given** a note was saved with bullet list and bold formatting
- **When** the user opens the note for editing
- **Then** the editor loads with the original formatting intact — bullets are still bullets, bold text is still bold

### AC-8: Edit a Note — Cancel Discards Changes
- **Given** a note is in edit mode with unsaved changes
- **When** the user clicks "Cancel"
- **Then** the card returns to read-only mode with the original content and formatting, and no database write occurs

### AC-9: Edit a Note — Empty Content Prevented
- **Given** a note is in edit mode
- **When** the user removes all visible content and clicks "Save"
- **Then** the save is blocked and an inline message reads "Note cannot be empty"

### AC-10: Delete a Note — Inline Confirmation
- **Given** the user clicks "Delete" on a note
- **When** the confirmation appears
- **Then** it shows "Delete this note?" with "Yes, delete" and "Cancel" directly on the note card — no modal

### AC-11: Delete a Note — Confirmed
- **Given** the inline delete confirmation is showing
- **When** the user clicks "Yes, delete"
- **Then** the note is permanently deleted and immediately removed from the Notes section

### AC-12: Delete a Note — Cancelled
- **Given** the inline delete confirmation is showing
- **When** the user clicks "Cancel"
- **Then** no deletion occurs and the note returns to its normal read-only state

### AC-13: Empty State
- **Given** an application has no notes
- **When** the user views the detail page
- **Then** the Notes section shows "No notes yet."

### AC-14: Notes Deleted with Application
- **Given** an application has notes attached to it
- **When** the application is deleted
- **Then** all associated note records are also deleted with no orphaned rows remaining in the `notes` table

---

## Edge Cases & Error Handling

- **Network failure on add**: The note does not appear, the editor retains the user's content, and an error is shown: "Failed to save note. Please try again."
- **Network failure on edit save**: The note card stays in edit mode with the user's changes intact, and an error is shown: "Failed to save changes. Please try again."
- **Network failure on delete**: The note remains visible and an error is shown: "Failed to delete note. Please try again."
- **Empty document check**: An editor document consisting only of empty paragraphs (no visible text) is treated as empty and cannot be saved. This check is performed both client-side (to disable the button) and server-side (to reject the request).
- **URL security**: All links rendered from note content use `target="_blank"` and `rel="noopener noreferrer"` to prevent tab-napping.
- **Content sanitization**: Rich text content is sanitized on the server before being stored to strip any disallowed node types or attributes. Only the supported formatting types (headings, lists, bold, italic, links, paragraphs) are permitted. Anything else is stripped.

---

## Out of Scope (v1)

- Image attachments or file uploads within notes
- Tables within notes
- Code blocks within notes
- Tagging or categorizing notes
- Searching note content across applications

---

## Dependencies

- [Job Applications CRUD](./job-applications-crud.md) — a note requires an existing application; `ON DELETE CASCADE` on the FK handles cleanup automatically

---

## Open Questions

1. Should very long notes collapse behind a "Show more" toggle to keep the detail view scannable? Deferred — all content is shown in full for v1.

---

## Technical Notes

- **Rich text editor**: Use [Tiptap](https://tiptap.dev/) as the editor library. It is headless, React-compatible, actively maintained, and produces a clean JSON document format (`JSONContent`) that is straightforward to store in a `jsonb` column. Extensions needed: `StarterKit` (covers paragraphs, headings, bold, italic, bullet list, ordered list), `Link` (for URL support with auto-link detection).
- **Storage format**: Store the Tiptap `JSONContent` object in the `content` column as `jsonb`. Do not store HTML — storing HTML creates a persistent XSS surface. Render HTML only on the client using Tiptap's read-only renderer or `generateHTML()`.
- **Sanitization**: On the server (in the Server Action), validate the incoming JSON against the allowed schema — permitted node types are: `doc`, `paragraph`, `heading`, `bulletList`, `orderedList`, `listItem`, `text`, `hardBreak`. Permitted marks are: `bold`, `italic`, `link`. Strip any other nodes or marks before persisting.
- **Link attributes**: The `Link` extension should be configured with `openOnClick: false` in edit mode (to avoid navigating away while editing) and links should render with `target="_blank"` and `rel="noopener noreferrer"` in read-only mode.
- **Empty check**: Use Tiptap's `editor.isEmpty` in the client to disable the submit button. Re-validate server-side by checking whether the JSON document contains any non-empty text nodes.
- **Edit and delete state**: Local React component state inside a `NoteCard` component. No global state or URL state is needed.
- After any mutation (add, edit, delete), call `revalidatePath()` from the Server Action or `router.refresh()` to re-fetch the updated notes list from the server.
- The same `updated_at` DB trigger used on the `applications` table should be applied to the `notes` table.
