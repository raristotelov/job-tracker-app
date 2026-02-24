import { z } from 'zod';
import type { SectionInput } from '@/types';

/**
 * Zod schema for creating or renaming a section.
 * Validates that the name is non-empty and within the 100-character database limit.
 */
export const sectionNameSchema = z.object({
  name: z
    .string()
    .min(1, 'Section name is required')
    .max(100, 'Section name must be 100 characters or fewer')
    .trim(),
});

/** Inferred output type of the section name schema. */
export type SectionNameSchemaOutput = z.infer<typeof sectionNameSchema>;

// Compile-time structural check: the schema output must be assignable to SectionInput.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _typeCheck: SectionInput = {} as SectionNameSchemaOutput;
