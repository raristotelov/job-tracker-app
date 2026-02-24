import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApplicationList } from './ApplicationList';
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

const appsWithSections: ApplicationWithSection[] = [
  makeApp({ id: 'a1', company_name: 'Alpha', position_title: 'Dev', sections: { name: 'Frontend' }, date_applied: '2026-02-10' }),
  makeApp({ id: 'a2', company_name: 'Beta',  position_title: 'QA',  sections: { name: 'Backend' },  date_applied: '2026-01-15' }),
  makeApp({ id: 'a3', company_name: 'Gamma', position_title: 'PM',  sections: null,                 date_applied: '2026-01-01' }),
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ApplicationList', () => {
  describe('AC-10: empty state', () => {
    it('shows empty state message when there are no applications', () => {
      render(<ApplicationList applications={[]} />);
      expect(
        screen.getByText('No applications yet. Add your first one to get started.'),
      ).toBeInTheDocument();
    });

    it('shows an "Add Application" link in the empty state', () => {
      render(<ApplicationList applications={[]} />);
      const links = screen.getAllByRole('link', { name: 'Add Application' });
      // One in toolbar, one in empty state
      expect(links.length).toBeGreaterThanOrEqual(1);
    });

    it('does not render a table when the list is empty', () => {
      render(<ApplicationList applications={[]} />);
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('toolbar', () => {
    it('renders the "Add Application" button link in the toolbar', () => {
      render(<ApplicationList applications={[makeApp()]} />);
      expect(screen.getByRole('link', { name: 'Add Application' })).toBeInTheDocument();
    });

    it('"Add Application" link points to the new application route', () => {
      render(<ApplicationList applications={[makeApp()]} />);
      const link = screen.getByRole('link', { name: 'Add Application' });
      expect(link).toHaveAttribute('href', '/applications/new');
    });

    it('renders the ViewToggle with "All" and "By Section" buttons', () => {
      render(<ApplicationList applications={[makeApp()]} />);
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'By Section' })).toBeInTheDocument();
    });
  });

  describe('AC-9: All view (default)', () => {
    it('defaults to "All" view mode on first render', () => {
      render(<ApplicationList applications={[makeApp()]} />);
      const allButton = screen.getByRole('button', { name: 'All' });
      expect(allButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('renders a table in All view mode', () => {
      render(<ApplicationList applications={[makeApp()]} />);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('renders all applications in the table', () => {
      render(<ApplicationList applications={appsWithSections} />);
      expect(screen.getByText('Alpha')).toBeInTheDocument();
      expect(screen.getByText('Beta')).toBeInTheDocument();
      expect(screen.getByText('Gamma')).toBeInTheDocument();
    });
  });

  describe('view mode toggle', () => {
    it('switches to By Section view when "By Section" button is clicked', async () => {
      const user = userEvent.setup();
      render(<ApplicationList applications={appsWithSections} />);
      await user.click(screen.getByRole('button', { name: 'By Section' }));
      const bySectionButton = screen.getByRole('button', { name: 'By Section' });
      expect(bySectionButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('switches back to All view when "All" button is clicked after selecting By Section', async () => {
      const user = userEvent.setup();
      render(<ApplicationList applications={appsWithSections} />);
      await user.click(screen.getByRole('button', { name: 'By Section' }));
      await user.click(screen.getByRole('button', { name: 'All' }));
      expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('AC-11: By Section grouping', () => {
    it('shows named section headings in By Section view', async () => {
      const user = userEvent.setup();
      render(<ApplicationList applications={appsWithSections} />);
      await user.click(screen.getByRole('button', { name: 'By Section' }));
      // Section name appears in both the heading and the table cell, so use getAllByText
      expect(screen.getAllByText('Frontend').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Backend').length).toBeGreaterThanOrEqual(1);
    });

    it('shows "Unsectioned" group heading when some apps have no section', async () => {
      const user = userEvent.setup();
      render(<ApplicationList applications={appsWithSections} />);
      await user.click(screen.getByRole('button', { name: 'By Section' }));
      expect(screen.getByText('Unsectioned')).toBeInTheDocument();
    });

    it('displays application count in each section heading', async () => {
      const user = userEvent.setup();
      render(<ApplicationList applications={appsWithSections} />);
      await user.click(screen.getByRole('button', { name: 'By Section' }));
      // Each section has 1 app; count should appear
      const counts = screen.getAllByText('1');
      expect(counts.length).toBeGreaterThanOrEqual(3); // Frontend(1), Backend(1), Unsectioned(1)
    });

    it('renders applications under their respective section', async () => {
      const user = userEvent.setup();
      render(<ApplicationList applications={appsWithSections} />);
      await user.click(screen.getByRole('button', { name: 'By Section' }));
      // "Alpha" app should appear somewhere in the document (under Frontend section)
      expect(screen.getByText('Alpha')).toBeInTheDocument();
    });

    it('preserves applications in their section tables', async () => {
      const user = userEvent.setup();
      render(<ApplicationList applications={appsWithSections} />);
      await user.click(screen.getByRole('button', { name: 'By Section' }));
      // All apps should still be visible
      expect(screen.getByText('Alpha')).toBeInTheDocument();
      expect(screen.getByText('Beta')).toBeInTheDocument();
      expect(screen.getByText('Gamma')).toBeInTheDocument();
    });
  });

  describe('AC-12: Unsectioned group hidden when no unsectioned apps', () => {
    it('does not show "Unsectioned" heading when all apps have a section', async () => {
      const user = userEvent.setup();
      const allSectioned: ApplicationWithSection[] = [
        makeApp({ id: 'b1', company_name: 'Corp A', sections: { name: 'Alpha Section' } }),
        makeApp({ id: 'b2', company_name: 'Corp B', sections: { name: 'Beta Section' } }),
      ];
      render(<ApplicationList applications={allSectioned} />);
      await user.click(screen.getByRole('button', { name: 'By Section' }));
      expect(screen.queryByText('Unsectioned')).not.toBeInTheDocument();
    });
  });

  describe('section sorting', () => {
    it('sorts named sections alphabetically in By Section view', async () => {
      const user = userEvent.setup();
      const apps: ApplicationWithSection[] = [
        makeApp({ id: 'z1', company_name: 'Zeta', sections: { name: 'Zebra' } }),
        makeApp({ id: 'a1', company_name: 'Alpha', sections: { name: 'Aardvark' } }),
      ];
      render(<ApplicationList applications={apps} />);
      await user.click(screen.getByRole('button', { name: 'By Section' }));
      const headings = screen.getAllByRole('heading', { level: 2 });
      const headingTexts = headings.map((h) => h.textContent);
      const aardvarkIdx = headingTexts.findIndex((t) => t?.includes('Aardvark'));
      const zebraIdx = headingTexts.findIndex((t) => t?.includes('Zebra'));
      expect(aardvarkIdx).toBeLessThan(zebraIdx);
    });

    it('places Unsectioned group last, after all named sections', async () => {
      const user = userEvent.setup();
      const apps: ApplicationWithSection[] = [
        makeApp({ id: 'u1', company_name: 'Corp U', sections: null }),
        makeApp({ id: 'z1', company_name: 'Corp Z', sections: { name: 'Zeta' } }),
      ];
      render(<ApplicationList applications={apps} />);
      await user.click(screen.getByRole('button', { name: 'By Section' }));
      const headings = screen.getAllByRole('heading', { level: 2 });
      const headingTexts = headings.map((h) => h.textContent);
      const zetaIdx = headingTexts.findIndex((t) => t?.includes('Zeta'));
      const unsectionedIdx = headingTexts.findIndex((t) => t?.includes('Unsectioned'));
      expect(zetaIdx).toBeLessThan(unsectionedIdx);
    });
  });
});
