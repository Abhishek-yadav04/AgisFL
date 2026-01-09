import { render } from '@testing-library/vue';
import MetricsWidget from '@/components/MetricsWidget.vue';

describe('MetricsWidget', () => {
  it('renders uptime and requests', () => {
    const { getByText } = render(MetricsWidget, {
      props: { uptime: '2h', requests: 200 }
    });
    expect(getByText('Uptime: 2h')).toBeTruthy();
    expect(getByText('Requests: 200')).toBeTruthy();
  });

  it('shows default state', () => {
    const { getByText } = render(MetricsWidget);
    expect(getByText('No metrics available')).toBeTruthy();
  });
});
