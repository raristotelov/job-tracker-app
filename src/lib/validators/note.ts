import { z } from 'zod';
import type { NoteInput } from '@/types';

/**
 * Zod schema for creating or updating a note.
 *
 * The content must be a valid Tiptap JSONContent object — a Record<string, unknown>
 * with a top-level `type` property equal to `'doc'`.
 */
export const noteContentSchema = z.object({
  content: z
    .record(z.string(), z.unknown())
    .refine(
      (val) => val['type'] === 'doc',
      { message: "Note content must be a valid Tiptap document with type 'doc'" }
    ),
});

/** Inferred output type of the note schema. */
export type NoteSchemaOutput = z.infer<typeof noteContentSchema>;

// Compile-time structural check: the schema output must be assignable to NoteInput.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _typeCheck: NoteInput = {} as NoteSchemaOutput;
