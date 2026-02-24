import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApplicationForm } from './ApplicationForm';
import type { ApplicationWithSection, Section } from '@/types';

// ---------------------------------------------------------------------------
// Mock server actions (they live in a 'use server' module)
// ---------------------------------------------------------------------------

const mockCreateApplication = jest.fn();
const mockUpdateApplication = jest.fn();

jest.mock('@/services/applications', () => ({
  createApplication: (...args: unknown[]) => mockCreateApplication(...args),
  updateApplication: (...args: unknown[]) => mockUpdateApplication(...args),
}));

// ---------------------------------------------------------------------------
// Mock useActionState
//
// ApplicationForm uses React's useActionState which is only fully functional
// inside a real React server/client setup.  We stub it to:
//   - Return [state, dispatchFn, isPending]
//   - Allow tests to control `state` via a helper
// ---------------------------------------------------------------------------

type ActionState = { error: string; fieldErrors?: Record<string, string> } | null;

let simulatedState: ActionState = null;
let capturedAction: ((prev: ActionState, formData: FormData) => Promise<ActionState>) | null = null;

jest.mock('react', () => {
  const actual = jest.requireActual<typeof import('react')>('react');
  return {
    ...actual,
    useActionState: <S, P>(
      action: (prev: S, payload: P) => Promise<S>,
      initialState: S,
    ): [S, (payload: P) => void, boolean] => {
      // Capture the action so tests can call it directly
      capturedAction = action as unknown as typeof capturedAction;
      // Return the simulated state, a no-op dispatch, and isPending=false
      return [simulatedState as unknown as S, jest.fn(), false];
    },
  };
});

// ---------------------------------------------------------------------------
// Mock data helpers
// ---------------------------------------------------------------------------

const noSections: Section[] = [];
const someSections: Section[] = [
  { id: 'sec-1', user_id: 'user-1', name: 'Frontend', created_at: '2026-01-01T00:00:00Z' },
  { id: 'sec-2', user_id: 'user-1', name: 'Backend',  created_at: '2026-01-01T00:00:00Z' },
];

function makeApp(overrides: Partial<ApplicationWithSection> = {}): ApplicationWithSection {
  return {
    id: 'app-abc',
    user_id: 'user-1',
    section_id: null,
    company_name: 'Acme Corp',
    position_title: 'Software Engineer',
    job_posting_url: null,
    location: null,
    work_type: null,
    salary_range_min: null,
    salary_range_max: null,
    status: 'applied',
    date_applied: '2026-02-01',
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    sections: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  simulatedState = null;
  capturedAction = null;
  mockCreateApplication.mockReset();
  mockUpdateApplication.mockReset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ApplicationForm', () => {
  describe('create mode — form fields and structure', () => {
    it('renders the "Company Name" input field', () => {
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.getByLabelText(/Company Name/)).toBeInTheDocument();
    });

    it('renders the "Position Title" input field', () => {
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.getByLabelText(/Position Title/)).toBeInTheDocument();
    });

    it('renders the "Date Applied" input field', () => {
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.getByLabelText(/Date Applied/)).toBeInTheDocument();
    });

    it('renders the "Status" select field', () => {
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.getByLabelText(/Status/)).toBeInTheDocument();
    });

    it('renders the "Job Posting URL" input field', () => {
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.getByLabelText(/Job Posting URL/)).toBeInTheDocument();
    });

    it('renders the "Location" input field', () => {
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.getByLabelText(/Location/)).toBeInTheDocument();
    });

    it('renders the "Work Type" select field', () => {
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.getByLabelText(/Work Type/)).toBeInTheDocument();
    });

    it('renders the "Minimum" salary input field', () => {
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.getByLabelText(/Minimum/)).toBeInTheDocument();
    });

    it('renders the "Maximum" salary input field', () => {
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.getByLabelText(/Maximum/)).toBeInTheDocument();
    });

    it('renders the "Section" select field', () => {
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.getByLabelText(/Section/)).toBeInTheDocument();
    });
  });

  describe('create mode — submit button', () => {
    it('renders "Add Application" as the submit button text in create mode', () => {
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.getByRole('button', { name: 'Add Application' })).toBeInTheDocument();
    });

    it('submit button has type="submit"', () => {
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.getByRole('button', { name: 'Add Application' })).toHaveAttribute(
        'type',
        'submit',
      );
    });
  });

  describe('create mode — cancel link', () => {
    it('renders a "Cancel" link', () => {
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.getByRole('link', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('Cancel link points to the cancelHref prop', () => {
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
        'href',
        '/applications',
      );
    });
  });

  describe('create mode — default form values', () => {
    it('Status field defaults to "applied" in create mode', () => {
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      const statusSelect = screen.getByLabelText(/Status/) as HTMLSelectElement;
      expect(statusSelect.value).toBe('applied');
    });

    it('Company Name field is empty by default in create mode', () => {
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.getByLabelText(/Company Name/)).toHaveValue('');
    });
  });

  describe('create mode — section dropdown', () => {
    it('renders a "No section" option at the top of the section dropdown', () => {
      render(
        <ApplicationForm sections={someSections} cancelHref="/applications" />,
      );
      const sectionSelect = screen.getByLabelText(/Section/);
      const noSectionOption = within(sectionSelect as HTMLElement).queryAllByRole('option');
      const firstOption = noSectionOption[0];
      expect(firstOption).toHaveValue('');
      expect(firstOption).toHaveTextContent('No section');
    });

    it('renders available section options in the dropdown', () => {
      render(
        <ApplicationForm sections={someSections} cancelHref="/applications" />,
      );
      expect(screen.getByRole('option', { name: 'Frontend' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Backend' })).toBeInTheDocument();
    });

    it('renders only "No section" when sections prop is empty', () => {
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      const options = screen.getAllByRole('option');
      // Section select has "No section" + the status select options
      // We just verify "No section" option exists
      const noSectionOption = options.find((o) => o.textContent === 'No section');
      expect(noSectionOption).toBeDefined();
    });
  });

  describe('edit mode — pre-filled values', () => {
    const existingApp = makeApp({
      company_name: 'TechCorp',
      position_title: 'Senior Dev',
      location: 'Austin, TX',
      status: 'interview_scheduled',
      date_applied: '2026-01-15',
      work_type: 'remote',
    });

    it('pre-fills the company name field with existing data', () => {
      render(
        <ApplicationForm
          initialData={existingApp}
          sections={noSections}
          cancelHref="/applications/app-abc"
        />,
      );
      expect(screen.getByLabelText(/Company Name/)).toHaveValue('TechCorp');
    });

    it('pre-fills the position title field with existing data', () => {
      render(
        <ApplicationForm
          initialData={existingApp}
          sections={noSections}
          cancelHref="/applications/app-abc"
        />,
      );
      expect(screen.getByLabelText(/Position Title/)).toHaveValue('Senior Dev');
    });

    it('pre-fills the location field with existing data', () => {
      render(
        <ApplicationForm
          initialData={existingApp}
          sections={noSections}
          cancelHref="/applications/app-abc"
        />,
      );
      expect(screen.getByLabelText(/Location/)).toHaveValue('Austin, TX');
    });

    it('pre-fills the date applied field with existing data', () => {
      render(
        <ApplicationForm
          initialData={existingApp}
          sections={noSections}
          cancelHref="/applications/app-abc"
        />,
      );
      expect(screen.getByLabelText(/Date Applied/)).toHaveValue('2026-01-15');
    });

    it('pre-selects the status field with existing data', () => {
      render(
        <ApplicationForm
          initialData={existingApp}
          sections={noSections}
          cancelHref="/applications/app-abc"
        />,
      );
      const statusSelect = screen.getByLabelText(/Status/) as HTMLSelectElement;
      expect(statusSelect.value).toBe('interview_scheduled');
    });
  });

  describe('edit mode — submit button', () => {
    it('renders "Save Changes" as the submit button text in edit mode', () => {
      render(
        <ApplicationForm
          initialData={makeApp()}
          sections={noSections}
          cancelHref="/applications/app-abc"
        />,
      );
      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
    });
  });

  describe('AC-4: field error display', () => {
    it('shows company_name field error when fieldErrors contains company_name', () => {
      simulatedState = {
        error: 'Please fix the errors below.',
        fieldErrors: { company_name: 'Company name is required' },
      };
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.getByText('Company name is required')).toBeInTheDocument();
    });

    it('shows position_title field error when fieldErrors contains position_title', () => {
      simulatedState = {
        error: 'Please fix the errors below.',
        fieldErrors: { position_title: 'Position title is required' },
      };
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.getByText('Position title is required')).toBeInTheDocument();
    });

    it('shows date_applied field error when fieldErrors contains date_applied', () => {
      simulatedState = {
        error: 'Please fix the errors below.',
        fieldErrors: { date_applied: 'Date applied cannot be in the future' },
      };
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.getByText('Date applied cannot be in the future')).toBeInTheDocument();
    });

    it('marks the company_name input as aria-invalid when it has an error', () => {
      simulatedState = {
        error: 'Please fix the errors below.',
        fieldErrors: { company_name: 'Company name is required' },
      };
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.getByLabelText(/Company Name/)).toHaveAttribute('aria-invalid', 'true');
    });

    it('shows job_posting_url error "Please enter a valid URL"', () => {
      simulatedState = {
        error: 'Please fix the errors below.',
        fieldErrors: { job_posting_url: 'Please enter a valid URL' },
      };
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument();
    });

    it('shows salary_range_max error for cross-field validation', () => {
      simulatedState = {
        error: 'Please fix the errors below.',
        fieldErrors: { salary_range_max: 'Maximum must be greater than or equal to minimum' },
      };
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(
        screen.getByText('Maximum must be greater than or equal to minimum'),
      ).toBeInTheDocument();
    });
  });

  describe('AC-4: top-level error banner', () => {
    it('shows the error banner when state has an error message', () => {
      simulatedState = {
        error: 'Please fix the errors below.',
        fieldErrors: {},
      };
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.getByText('Please fix the errors below.')).toBeInTheDocument();
    });

    it('shows a network error banner message', () => {
      simulatedState = {
        error: 'Something went wrong. Your changes were not saved. Please try again.',
      };
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(
        screen.getByText('Something went wrong. Your changes were not saved. Please try again.'),
      ).toBeInTheDocument();
    });

    it('does not show an error banner when state is null', () => {
      simulatedState = null;
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('AC-8: default status in create mode', () => {
    it('the status select defaults to "applied" ensuring default status is applied', () => {
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      const statusSelect = screen.getByLabelText(/Status/) as HTMLSelectElement;
      expect(statusSelect.value).toBe('applied');
    });
  });

  describe('form structure', () => {
    it('renders a noValidate form to delegate validation to the server action', () => {
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      const form = document.querySelector('form');
      expect(form).not.toBeNull();
      expect(form).toHaveAttribute('novalidate');
    });

    it('renders all three fieldsets (Job Details, Salary Range, Application Details)', () => {
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      const fieldsets = document.querySelectorAll('fieldset');
      expect(fieldsets.length).toBe(3);
    });

    it('renders "Job Details" fieldset legend', () => {
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.getByText('Job Details')).toBeInTheDocument();
    });

    it('renders "Salary Range (USD)" fieldset legend', () => {
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.getByText('Salary Range (USD)')).toBeInTheDocument();
    });

    it('renders "Application Details" fieldset legend', () => {
      render(
        <ApplicationForm sections={noSections} cancelHref="/applications" />,
      );
      expect(screen.getByText('Application Details')).toBeInTheDocument();
    });
  });

  describe('work type options', () => {
    it('renders "Remote" option in work type select', () => {
      render(<ApplicationForm sections={noSections} cancelHref="/applications" />);
      expect(screen.getByRole('option', { name: 'Remote' })).toBeInTheDocument();
    });

    it('renders "Hybrid" option in work type select', () => {
      render(<ApplicationForm sections={noSections} cancelHref="/applications" />);
      expect(screen.getByRole('option', { name: 'Hybrid' })).toBeInTheDocument();
    });

    it('renders "On Site" option in work type select', () => {
      render(<ApplicationForm sections={noSections} cancelHref="/applications" />);
      expect(screen.getByRole('option', { name: 'On Site' })).toBeInTheDocument();
    });
  });

  describe('status options', () => {
    it('renders all 5 status options', () => {
      render(<ApplicationForm sections={noSections} cancelHref="/applications" />);
      const statuses = [
        'Applied',
        'Interview Scheduled',
        'Interview Completed',
        'Offer Received',
        'Rejected',
      ];
      statuses.forEach((label) => {
        expect(screen.getByRole('option', { name: label })).toBeInTheDocument();
      });
    });
  });
});
