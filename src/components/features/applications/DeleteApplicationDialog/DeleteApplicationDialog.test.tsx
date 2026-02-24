import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteApplicationDialog } from './DeleteApplicationDialog';

// ---------------------------------------------------------------------------
// Mock the deleteApplication server action
// ---------------------------------------------------------------------------

const mockDeleteApplication = jest.fn();

jest.mock('@/services/applications', () => ({
  deleteApplication: (...args: unknown[]) => mockDeleteApplication(...args),
}));

// ---------------------------------------------------------------------------
// Default props
// ---------------------------------------------------------------------------

const defaultProps = {
  applicationId: 'app-abc-123',
  companyName: 'Acme Corp',
  positionTitle: 'Software Engineer',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DeleteApplicationDialog', () => {
  beforeEach(() => {
    mockDeleteApplication.mockReset();
  });

  describe('initial state — trigger button', () => {
    it('renders a "Delete" trigger button when dialog is closed', () => {
      render(<DeleteApplicationDialog {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('does not show the confirmation message in the initial state', () => {
      render(<DeleteApplicationDialog {...defaultProps} />);
      expect(screen.queryByText(/Are you sure/)).not.toBeInTheDocument();
    });
  });

  describe('AC-17: opening the confirmation dialog', () => {
    it('shows the confirmation message when "Delete" trigger is clicked', async () => {
      const user = userEvent.setup();
      render(<DeleteApplicationDialog {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      expect(screen.getByText(/Are you sure you want to delete your application to/)).toBeInTheDocument();
    });

    it('includes the company name in the confirmation message', async () => {
      const user = userEvent.setup();
      render(<DeleteApplicationDialog {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    it('includes the position title in the confirmation message', async () => {
      const user = userEvent.setup();
      render(<DeleteApplicationDialog {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    it('shows "This cannot be undone." in the confirmation message', async () => {
      const user = userEvent.setup();
      render(<DeleteApplicationDialog {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      expect(screen.getByText(/This cannot be undone\./)).toBeInTheDocument();
    });

    it('renders a "Cancel" button in the dialog', async () => {
      const user = userEvent.setup();
      render(<DeleteApplicationDialog {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('renders a confirm "Delete" button in the dialog', async () => {
      const user = userEvent.setup();
      render(<DeleteApplicationDialog {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      // After opening, there is a new "Delete" button in the dialog
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('renders the confirmation container with role="alert"', async () => {
      const user = userEvent.setup();
      render(<DeleteApplicationDialog {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('AC-19: cancelling deletion', () => {
    it('hides the confirmation dialog when "Cancel" is clicked', async () => {
      const user = userEvent.setup();
      render(<DeleteApplicationDialog {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByText(/Are you sure/)).not.toBeInTheDocument();
    });

    it('does not call deleteApplication when "Cancel" is clicked', async () => {
      const user = userEvent.setup();
      render(<DeleteApplicationDialog {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(mockDeleteApplication).not.toHaveBeenCalled();
    });

    it('restores the trigger "Delete" button after cancelling', async () => {
      const user = userEvent.setup();
      render(<DeleteApplicationDialog {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });
  });

  describe('AC-18: confirming deletion', () => {
    it('calls deleteApplication with the correct application ID on confirm', async () => {
      mockDeleteApplication.mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<DeleteApplicationDialog {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      expect(mockDeleteApplication).toHaveBeenCalledWith('app-abc-123');
    });

    it('calls deleteApplication exactly once when confirmed', async () => {
      mockDeleteApplication.mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<DeleteApplicationDialog {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      expect(mockDeleteApplication).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('shows an error banner when deleteApplication returns an error', async () => {
      mockDeleteApplication.mockResolvedValue({
        error: 'Something went wrong. The application could not be deleted. Please try again.',
      });
      const user = userEvent.setup();
      render(<DeleteApplicationDialog {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      await waitFor(() => {
        expect(
          screen.getByText(
            'Something went wrong. The application could not be deleted. Please try again.',
          ),
        ).toBeInTheDocument();
      });
    });

    it('clears the error banner when "Cancel" is clicked after an error', async () => {
      mockDeleteApplication.mockResolvedValue({
        error: 'Something went wrong. The application could not be deleted. Please try again.',
      });
      const user = userEvent.setup();
      render(<DeleteApplicationDialog {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      // Wait for the error message to appear (both dialog and ErrorBanner have role="alert")
      await waitFor(() => {
        expect(
          screen.getByText('Something went wrong. The application could not be deleted. Please try again.'),
        ).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      // After cancel, the whole dialog is closed — error message is gone
      expect(
        screen.queryByText('Something went wrong. The application could not be deleted. Please try again.'),
      ).not.toBeInTheDocument();
    });
  });
});
