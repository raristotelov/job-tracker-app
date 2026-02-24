/**
 * Tiptap JSONContent equivalent.
 * Using Record<string, unknown> as a placeholder until @tiptap/core is installed (T-031).
 * Once Tiptap is installed, replace with: import type { JSONContent } from '@tiptap/core';
 */
type JSONContent = Record<string, unknown>;

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
