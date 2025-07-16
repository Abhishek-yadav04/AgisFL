import { render, screen } from '@testing-library/react';
import App from '../../App';

describe('App', () => {
  it('renders main dashboard content', () => {
    render(<App />);
    expect(screen.getByLabelText(/main dashboard content/i)).toBeInTheDocument();
  });
});
