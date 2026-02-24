import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewToggle, type ViewMode } from './ViewToggle';

describe('ViewToggle', () => {
  const noop = jest.fn();

  beforeEach(() => {
    noop.mockReset();
  });

  describe('rendering', () => {
    it('renders an "All" button', () => {
      render(<ViewToggle value="all" onChange={noop} />);
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    });

    it('renders a "By Section" button', () => {
      render(<ViewToggle value="all" onChange={noop} />);
      expect(screen.getByRole('button', { name: 'By Section' })).toBeInTheDocument();
    });

    it('renders a group container with accessible label', () => {
      render(<ViewToggle value="all" onChange={noop} />);
      expect(screen.getByRole('group', { name: 'View mode' })).toBeInTheDocument();
    });
  });

  describe('aria-pressed state', () => {
    it('marks the "All" button as pressed when value is "all"', () => {
      render(<ViewToggle value="all" onChange={noop} />);
      const allButton = screen.getByRole('button', { name: 'All' });
      expect(allButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('marks the "By Section" button as not pressed when value is "all"', () => {
      render(<ViewToggle value="all" onChange={noop} />);
      const bySectionButton = screen.getByRole('button', { name: 'By Section' });
      expect(bySectionButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('marks the "By Section" button as pressed when value is "by-section"', () => {
      render(<ViewToggle value="by-section" onChange={noop} />);
      const bySectionButton = screen.getByRole('button', { name: 'By Section' });
      expect(bySectionButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('marks the "All" button as not pressed when value is "by-section"', () => {
      render(<ViewToggle value="by-section" onChange={noop} />);
      const allButton = screen.getByRole('button', { name: 'All' });
      expect(allButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('user interactions', () => {
    it('calls onChange with "all" when the "All" button is clicked', async () => {
      const user = userEvent.setup();
      render(<ViewToggle value="by-section" onChange={noop} />);
      await user.click(screen.getByRole('button', { name: 'All' }));
      expect(noop).toHaveBeenCalledTimes(1);
      expect(noop).toHaveBeenCalledWith('all');
    });

    it('calls onChange with "by-section" when the "By Section" button is clicked', async () => {
      const user = userEvent.setup();
      render(<ViewToggle value="all" onChange={noop} />);
      await user.click(screen.getByRole('button', { name: 'By Section' }));
      expect(noop).toHaveBeenCalledTimes(1);
      expect(noop).toHaveBeenCalledWith('by-section');
    });

    it('calls onChange even when clicking the already-active button', async () => {
      const user = userEvent.setup();
      render(<ViewToggle value="all" onChange={noop} />);
      await user.click(screen.getByRole('button', { name: 'All' }));
      expect(noop).toHaveBeenCalledWith('all');
    });
  });

  describe('button types', () => {
    it('both buttons have type="button" to prevent accidental form submission', () => {
      render(<ViewToggle value="all" onChange={noop} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn).toHaveAttribute('type', 'button');
      });
    });
  });
});
