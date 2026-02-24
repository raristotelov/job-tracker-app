import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApplicationDetail } from './ApplicationDetail';
import type { ApplicationWithSection } from '@/types';

// ---------------------------------------------------------------------------
// Mock deleteApplication server action — ApplicationDetail renders
// DeleteApplicationDialog which calls it. We only want to test presentation here.
// ---------------------------------------------------------------------------

jest.mock('@/services/applications', () => ({
  deleteApplication: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Mock data helpers
// ---------------------------------------------------------------------------

function makeApp(overrides: Partial<ApplicationWithSection> = {}): ApplicationWithSection {
  return {
    id: 'app-abc-123',
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
    created_at: '2026-02-01T09:00:00Z',
    updated_at: '2026-02-01T09:00:00Z',
    sections: null,
    ...overrides,
  };
}

const fullApp = makeApp({
  company_name: 'TechCorp Inc.',
  position_title: 'Senior Developer',
  job_posting_url: 'https://techcorp.com/jobs/456',
  location: 'Austin, TX',
  work_type: 'hybrid',
  salary_range_min: 80000,
  salary_range_max: 120000,
  status: 'interview_scheduled',
  date_applied: '2026-02-15',
  sections: { name: 'Big Tech' },
  created_at: '2026-02-15T10:00:00Z',
  updated_at: '2026-02-16T10:00:00Z',
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ApplicationDetail', () => {
  describe('AC-13: header — displays company and position', () => {
    it('renders the position title as the main heading', () => {
      render(<ApplicationDetail application={fullApp} />);
      expect(screen.getByRole('heading', { level: 1, name: 'Senior Developer' })).toBeInTheDocument();
    });

    it('renders the company name', () => {
      render(<ApplicationDetail application={fullApp} />);
      expect(screen.getByText('TechCorp Inc.')).toBeInTheDocument();
    });
  });

  describe('AC-13: status section', () => {
    it('renders the StatusBadge with accessible status label', () => {
      render(<ApplicationDetail application={fullApp} />);
      expect(screen.getByLabelText('Status: Interview Scheduled')).toBeInTheDocument();
    });

    it('renders "Applied" status badge for applied status', () => {
      render(<ApplicationDetail application={makeApp({ status: 'applied' })} />);
      expect(screen.getByLabelText('Status: Applied')).toBeInTheDocument();
    });

    it('renders "Offer Received" status badge', () => {
      render(<ApplicationDetail application={makeApp({ status: 'offer_received' })} />);
      expect(screen.getByLabelText('Status: Offer Received')).toBeInTheDocument();
    });
  });

  describe('AC-13: job details fields', () => {
    it('renders the section name when a section is assigned', () => {
      render(<ApplicationDetail application={fullApp} />);
      expect(screen.getByText('Big Tech')).toBeInTheDocument();
    });

    it('renders "—" placeholder for section when section is null', () => {
      render(<ApplicationDetail application={makeApp({ sections: null })} />);
      // Multiple "—" may appear for null fields; check that at least one is shown
      const placeholders = screen.getAllByText('—');
      expect(placeholders.length).toBeGreaterThanOrEqual(1);
    });

    it('renders location when provided', () => {
      render(<ApplicationDetail application={fullApp} />);
      expect(screen.getByText('Austin, TX')).toBeInTheDocument();
    });

    it('renders "—" placeholder when location is null', () => {
      render(<ApplicationDetail application={makeApp({ location: null })} />);
      const placeholders = screen.getAllByText('—');
      expect(placeholders.length).toBeGreaterThanOrEqual(1);
    });

    it('renders work type label when work_type is set', () => {
      render(<ApplicationDetail application={fullApp} />);
      expect(screen.getByText('Hybrid')).toBeInTheDocument();
    });

    it('renders "Remote" work type label', () => {
      render(<ApplicationDetail application={makeApp({ work_type: 'remote' })} />);
      expect(screen.getByText('Remote')).toBeInTheDocument();
    });

    it('renders "On Site" work type label', () => {
      render(<ApplicationDetail application={makeApp({ work_type: 'on_site' })} />);
      expect(screen.getByText('On Site')).toBeInTheDocument();
    });

    it('renders "—" placeholder when work_type is null', () => {
      render(<ApplicationDetail application={makeApp({ work_type: null })} />);
      const placeholders = screen.getAllByText('—');
      expect(placeholders.length).toBeGreaterThanOrEqual(1);
    });

    it('renders formatted salary range when both min and max are provided', () => {
      render(<ApplicationDetail application={fullApp} />);
      expect(screen.getByText('$80,000 - $120,000')).toBeInTheDocument();
    });

    it('renders "—" salary placeholder when both salary fields are null', () => {
      render(<ApplicationDetail application={makeApp({ salary_range_min: null, salary_range_max: null })} />);
      const placeholders = screen.getAllByText('—');
      expect(placeholders.length).toBeGreaterThanOrEqual(1);
    });

    it('renders "$80,000+" when only min salary is provided', () => {
      render(<ApplicationDetail application={makeApp({ salary_range_min: 80000, salary_range_max: null })} />);
      expect(screen.getByText('$80,000+')).toBeInTheDocument();
    });

    it('renders "Up to $120,000" when only max salary is provided', () => {
      render(<ApplicationDetail application={makeApp({ salary_range_min: null, salary_range_max: 120000 })} />);
      expect(screen.getByText('Up to $120,000')).toBeInTheDocument();
    });

    it('renders the formatted date applied', () => {
      render(<ApplicationDetail application={fullApp} />);
      expect(screen.getByText('Feb 15, 2026')).toBeInTheDocument();
    });

    it('renders job posting URL as a link when provided', () => {
      render(<ApplicationDetail application={fullApp} />);
      const link = screen.getByRole('link', { name: 'https://techcorp.com/jobs/456' });
      expect(link).toHaveAttribute('href', 'https://techcorp.com/jobs/456');
    });

    it('opens job posting URL in a new tab', () => {
      render(<ApplicationDetail application={fullApp} />);
      const link = screen.getByRole('link', { name: 'https://techcorp.com/jobs/456' });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders "—" for job posting URL when null', () => {
      render(<ApplicationDetail application={makeApp({ job_posting_url: null })} />);
      const placeholders = screen.getAllByText('—');
      expect(placeholders.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('AC-13: field labels', () => {
    it('renders a "Section" field label', () => {
      render(<ApplicationDetail application={fullApp} />);
      expect(screen.getByText('Section')).toBeInTheDocument();
    });

    it('renders a "Location" field label', () => {
      render(<ApplicationDetail application={fullApp} />);
      expect(screen.getByText('Location')).toBeInTheDocument();
    });

    it('renders a "Work Type" field label', () => {
      render(<ApplicationDetail application={fullApp} />);
      expect(screen.getByText('Work Type')).toBeInTheDocument();
    });

    it('renders a "Salary Range" field label', () => {
      render(<ApplicationDetail application={fullApp} />);
      expect(screen.getByText('Salary Range')).toBeInTheDocument();
    });

    it('renders a "Date Applied" field label', () => {
      render(<ApplicationDetail application={fullApp} />);
      expect(screen.getByText('Date Applied')).toBeInTheDocument();
    });

    it('renders a "Job Posting URL" field label', () => {
      render(<ApplicationDetail application={fullApp} />);
      expect(screen.getByText('Job Posting URL')).toBeInTheDocument();
    });
  });

  describe('edit link', () => {
    it('renders an "Edit" link', () => {
      render(<ApplicationDetail application={fullApp} />);
      expect(screen.getByRole('link', { name: 'Edit' })).toBeInTheDocument();
    });

    it('"Edit" link points to the edit route for the application', () => {
      render(<ApplicationDetail application={makeApp({ id: 'app-xyz' })} />);
      const editLink = screen.getByRole('link', { name: 'Edit' });
      expect(editLink).toHaveAttribute('href', '/applications/app-xyz/edit');
    });
  });

  describe('AC-17: delete button', () => {
    it('renders a "Delete" button', () => {
      render(<ApplicationDetail application={fullApp} />);
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });
  });

  describe('timestamps footer', () => {
    it('renders "Created" timestamp', () => {
      render(<ApplicationDetail application={fullApp} />);
      expect(screen.getByText(/Created Feb 15, 2026/)).toBeInTheDocument();
    });

    it('renders "Updated" timestamp when updated_at differs from created_at', () => {
      render(<ApplicationDetail application={fullApp} />);
      expect(screen.getByText(/Updated Feb 16, 2026/)).toBeInTheDocument();
    });

    it('does not render "Updated" timestamp when updated_at equals created_at', () => {
      const app = makeApp({
        created_at: '2026-02-01T09:00:00Z',
        updated_at: '2026-02-01T09:00:00Z',
      });
      render(<ApplicationDetail application={app} />);
      expect(screen.queryByText(/Updated/)).not.toBeInTheDocument();
    });
  });
});
