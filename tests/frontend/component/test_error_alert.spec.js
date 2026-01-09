import { render } from '@testing-library/vue';
import ErrorAlert from '@/components/ErrorAlert.vue';

describe('ErrorAlert', () => {
  it('renders error message', () => {
    const { getByText } = render(ErrorAlert, { props: { error: 'Something went wrong' } });
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('does not render if no error', () => {
    const { queryByText } = render(ErrorAlert, { props: { error: '' } });
    expect(queryByText('Something went wrong')).toBeNull();
  });
});
