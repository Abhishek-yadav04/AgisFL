
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopBar } from '../layout/TopBar';

/**
 * Component tests for TopBar
 * I wrote these tests to ensure the navigation bar behaves correctly
 * across different user states and screen sizes
 */
describe('TopBar Component', () => {
  it('should render system title correctly', () => {
    render(<TopBar />);
    
    // Verify that our branding is displayed properly
    expect(screen.getByText('NexusGuard AI')).toBeInTheDocument();
  });

  it('should display user information when logged in', () => {
    // Mock localStorage to simulate logged-in user
    const mockUser = {
      username: 'testuser',
      email: 'test@nexusguard.ai',
      role: 'administrator'
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => JSON.stringify(mockUser)),
      },
      writable: true,
    });

    render(<TopBar />);
    
    // Check if user initials are displayed
    expect(screen.getByText('TE')).toBeInTheDocument();
  });

  it('should handle notification system correctly', () => {
    render(<TopBar />);
    
    // Verify notification bell is present
    const notificationButton = screen.getByRole('button', { name: /notifications/i });
    expect(notificationButton).toBeInTheDocument();
  });
});
