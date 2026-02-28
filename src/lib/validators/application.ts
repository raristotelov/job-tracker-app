import { z } from 'zod';
import type { ApplicationCreateInput, WorkType, ApplicationStatus } from '@/types';

const WORK_TYPE_VALUES = ['remote', 'hybrid', 'on_site'] as const satisfies readonly WorkType[];
const STATUS_VALUES = [
  'applied',
  'interview_scheduled',
  'interview_completed',
  'offer_received',
  'rejected',
] as const satisfies readonly ApplicationStatus[];

/**
 * Validates a string value as a URL. Returns true for empty / null / undefined
 * values since those are handled by the nullability wrapper.
 */
const isValidUrl = (val: string): boolean => {
  const trimmed = val.trim();
  if (trimmed === '') return true;
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
};

/**
 * Base Zod schema for application create and update forms.
 *
 * All constraints mirror the database CHECK constraints and feature spec:
 * - company_name: required, 1-200 chars, trimmed
 * - position_title: required, 1-200 chars, trimmed
 * - job_posting_url: optional/nullable, max 2000 chars, must be a valid URL if provided
 * - location: optional/nullable, max 200 chars, trimmed
 * - work_type: optional/nullable enum
 * - salary_range_min: optional/nullable, >= 0
 * - salary_range_max: optional/nullable, >= 0; must be >= salary_range_min when both provided
 * - status: required enum, defaults to 'applied'
 * - date_applied: required ISO date (YYYY-MM-DD), must not be in the future
 * - section_id: optional/nullable UUID
 */
const applicationBaseSchema = z
  .object({
    company_name: z
      .string()
      .min(1, 'Company name is required')
      .max(200, 'Company name must be 200 characters or fewer')
      .trim(),

    position_title: z
      .string()
      .min(1, 'Position title is required')
      .max(200, 'Position title must be 200 characters or fewer')
      .trim(),

    job_posting_url: z
      .string()
      .max(2000, 'URL must be 2000 characters or fewer')
      .trim()
      .refine(isValidUrl, { message: 'Please enter a valid URL' })
      .nullable()
      .optional()
      .transform((val) => val ?? null),

    location: z
      .string()
      .max(200, 'Location must be 200 characters or fewer')
      .trim()
      .nullable()
      .optional()
      .transform((val) => val ?? null),

    work_type: z
      .enum(WORK_TYPE_VALUES)
      .nullable()
      .optional()
      .transform((val) => val ?? null),

    salary_range_min: z
      .number()
      .min(0, 'Minimum salary must be 0 or greater')
      .nullable()
      .optional()
      .transform((val) => val ?? null),

    salary_range_max: z
      .number()
      .min(0, 'Maximum salary must be 0 or greater')
      .nullable()
      .optional()
      .transform((val) => val ?? null),

    status: z.enum(STATUS_VALUES).default('applied'),

    date_applied: z
      .iso.date('Date applied must be a valid date (YYYY-MM-DD)')
      .refine(
        (val) => {
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];
          return val <= todayStr;
        },
        { message: 'Date applied cannot be in the future' }
      ),

    section_id: z
      .uuid()
      .nullable()
      .optional()
      .transform((val) => val ?? null),
  })
  .superRefine((data, ctx) => {
    const { salary_range_min, salary_range_max } = data;
    if (
      salary_range_min !== null &&
      salary_range_max !== null &&
      salary_range_max < salary_range_min
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['salary_range_max'],
        message: 'Maximum must be greater than or equal to minimum',
      });
    }
  });

/** Inferred output type of the application schema. */
export type ApplicationSchemaOutput = z.infer<typeof applicationBaseSchema>;

// Compile-time structural check: the schema output must be assignable to ApplicationCreateInput.
// A type error here means the schema and domain type have drifted out of sync.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _typeCheck: ApplicationCreateInput = {} as ApplicationSchemaOutput;

/**
 * Zod schema for creating a new job application.
 * Validates all required and optional fields, including the cross-field salary range check.
 */
export const applicationCreateSchema = applicationBaseSchema;

/**
 * Zod schema for updating an existing job application.
 * Identical validation rules to the create schema.
 */
export const applicationUpdateSchema = applicationBaseSchema;

/** Standalone status enum validator for single-field status updates. */
export const statusUpdateSchema = z.enum(STATUS_VALUES);
