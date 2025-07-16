import { render, screen } from '@testing-library/react';
import Sidebar from '../layout/Sidebar';

describe('Sidebar', () => {
  it('renders sidebar navigation', () => {
    render(<Sidebar />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
