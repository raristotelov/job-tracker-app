/** Valid work arrangement types */
export type WorkType = 'remote' | 'hybrid' | 'on_site';

/** Valid application pipeline statuses */
export type ApplicationStatus =
  | 'applied'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offer_received'
  | 'rejected';

/** Database row shape for the applications table */
export interface Application {
  id: string;
  user_id: string;
  section_id: string | null;
  company_name: string;
  position_title: string;
  job_posting_url: string | null;
  location: string | null;
  work_type: WorkType | null;
  salary_range_min: number | null;
  salary_range_max: number | null;
  status: ApplicationStatus;
  date_applied: string; // ISO 8601 date string (YYYY-MM-DD)
  created_at: string;   // ISO 8601 timestamptz
  updated_at: string;   // ISO 8601 timestamptz
}

/** Application with its section name joined. Used in list and detail views. */
export interface ApplicationWithSection extends Application {
  sections: { name: string } | null;
}

/** Input shape for creating a new application (fields the user provides). */
export interface ApplicationCreateInput {
  section_id: string | null;
  company_name: string;
  position_title: string;
  job_posting_url: string | null;
  location: string | null;
  work_type: WorkType | null;
  salary_range_min: number | null;
  salary_range_max: number | null;
  status: ApplicationStatus;
  date_applied: string;
}

/** Input shape for updating an existing application. Same fields as create. */
export type ApplicationUpdateInput = ApplicationCreateInput;
