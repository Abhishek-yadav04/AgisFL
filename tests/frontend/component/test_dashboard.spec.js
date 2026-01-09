import { render } from '@testing-library/vue';
import Dashboard from '@/components/Dashboard.vue';

describe('Dashboard', () => {
  it('renders metrics', () => {
    const { getByText } = render(Dashboard, {
      props: { metrics: { uptime: '1h', requests: 100 } }
    });
    expect(getByText('Uptime: 1h')).toBeTruthy();
    expect(getByText('Requests: 100')).toBeTruthy();
  });

  it('shows empty state', () => {
    const { getByText } = render(Dashboard, {
      props: { metrics: {} }
    });
    expect(getByText('No metrics available')).toBeTruthy();
  });
});
