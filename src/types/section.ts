/** Database row shape for the sections table */
export interface Section {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

/** Section with the count of applications assigned to it. Used in management view. */
export interface SectionWithCount extends Section {
  application_count: number;
}

/** Input shape for creating or renaming a section. */
export interface SectionInput {
  name: string;
}
