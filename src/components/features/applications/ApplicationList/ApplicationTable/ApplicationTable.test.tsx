import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { ApplicationTable } from './ApplicationTable';
import type { ApplicationWithSection } from '@/types';

// ---------------------------------------------------------------------------
// Mock data helpers
// ---------------------------------------------------------------------------

function makeApp(overrides: Partial<ApplicationWithSection> = {}): ApplicationWithSection {
  return {
    id: 'app-1',
    user_id: 'user-1',
    section_id: null,
    company_name: 'Acme Corp',
    position_title: 'Software Engineer',
    job_posting_url: null,
    location: 'Austin, TX',
    work_type: 'remote',
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

const twoApps: ApplicationWithSection[] = [
  makeApp({
    id: 'app-1',
    company_name: 'Acme Corp',
    position_title: 'Engineer',
    date_applied: '2026-02-10',
    sections: { name: 'Big Tech' },
    status: 'applied',
  }),
  makeApp({
    id: 'app-2',
    company_name: 'BetaCo',
    position_title: 'Designer',
    date_applied: '2026-01-20',
    location: null,
    sections: null,
    status: 'interview_scheduled',
  }),
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ApplicationTable', () => {
  describe('AC-9: table structure and column headers', () => {
    it('renders a table element', () => {
      render(<ApplicationTable applications={[makeApp()]} />);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('renders a "Section" column header', () => {
      render(<ApplicationTable applications={[makeApp()]} />);
      expect(screen.getByRole('columnheader', { name: 'Section' })).toBeInTheDocument();
    });

    it('renders a "Company" column header', () => {
      render(<ApplicationTable applications={[makeApp()]} />);
      expect(screen.getByRole('columnheader', { name: 'Company' })).toBeInTheDocument();
    });

    it('renders a "Position" column header', () => {
      render(<ApplicationTable applications={[makeApp()]} />);
      expect(screen.getByRole('columnheader', { name: 'Position' })).toBeInTheDocument();
    });

    it('renders a "Location" column header', () => {
      render(<ApplicationTable applications={[makeApp()]} />);
      expect(screen.getByRole('columnheader', { name: 'Location' })).toBeInTheDocument();
    });

    it('renders a "Status" column header', () => {
      render(<ApplicationTable applications={[makeApp()]} />);
      expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    });

    it('renders a "Date Applied" column header', () => {
      render(<ApplicationTable applications={[makeApp()]} />);
      expect(screen.getByRole('columnheader', { name: 'Date Applied' })).toBeInTheDocument();
    });
  });

  describe('data rows', () => {
    it('renders one row per application', () => {
      render(<ApplicationTable applications={twoApps} />);
      // tbody rows only (not the header row)
      const rows = screen.getAllByRole('row').filter((r) => r.closest('tbody'));
      expect(rows).toHaveLength(2);
    });

    it('renders company name in each row', () => {
      render(<ApplicationTable applications={twoApps} />);
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('BetaCo')).toBeInTheDocument();
    });

    it('renders position title in each row', () => {
      render(<ApplicationTable applications={twoApps} />);
      expect(screen.getByText('Engineer')).toBeInTheDocument();
      expect(screen.getByText('Designer')).toBeInTheDocument();
    });

    it('renders section name when application has a section', () => {
      render(<ApplicationTable applications={twoApps} />);
      expect(screen.getByText('Big Tech')).toBeInTheDocument();
    });

    it('renders em dash placeholder when section is null', () => {
      render(<ApplicationTable applications={[makeApp({ sections: null })]} />);
      // There will be multiple em dashes (section + location both null); just check at least one
      const placeholders = screen.getAllByText('—');
      expect(placeholders.length).toBeGreaterThanOrEqual(1);
    });

    it('renders location when provided', () => {
      render(<ApplicationTable applications={[makeApp({ location: 'Austin, TX' })]} />);
      expect(screen.getByText('Austin, TX')).toBeInTheDocument();
    });

    it('renders em dash placeholder when location is null', () => {
      render(<ApplicationTable applications={[makeApp({ location: null, sections: null })]} />);
      const placeholders = screen.getAllByText('—');
      expect(placeholders.length).toBeGreaterThanOrEqual(2); // section + location
    });

    it('renders formatted date applied', () => {
      render(<ApplicationTable applications={[makeApp({ date_applied: '2026-02-01' })]} />);
      expect(screen.getByText('Feb 1, 2026')).toBeInTheDocument();
    });

    it('renders a StatusBadge with accessible label for the status', () => {
      render(<ApplicationTable applications={[makeApp({ status: 'applied' })]} />);
      expect(screen.getByLabelText('Status: Applied')).toBeInTheDocument();
    });

    it('renders "Interview Scheduled" badge when status is interview_scheduled', () => {
      render(<ApplicationTable applications={[makeApp({ status: 'interview_scheduled' })]} />);
      expect(screen.getByLabelText('Status: Interview Scheduled')).toBeInTheDocument();
    });
  });

  describe('row links', () => {
    it('each row links to the application detail page', () => {
      render(<ApplicationTable applications={[makeApp({ id: 'abc-123' })]} />);
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('href', '/applications/abc-123');
      });
    });

    it('generates correct detail links for multiple applications', () => {
      render(<ApplicationTable applications={twoApps} />);
      const allLinks = screen.getAllByRole('link');
      const hrefs = allLinks.map((l) => l.getAttribute('href'));
      expect(hrefs).toContain('/applications/app-1');
      expect(hrefs).toContain('/applications/app-2');
    });
  });

  describe('empty applications array', () => {
    it('renders the table structure with no data rows', () => {
      render(<ApplicationTable applications={[]} />);
      expect(screen.getByRole('table')).toBeInTheDocument();
      const bodyRows = screen.queryAllByRole('row').filter((r) => r.closest('tbody'));
      expect(bodyRows).toHaveLength(0);
    });
  });
});
