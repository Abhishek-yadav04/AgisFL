import { render } from '@testing-library/vue';
import DatasetList from '@/components/DatasetList.vue';

describe('DatasetList', () => {
  it('renders datasets', () => {
    const datasets = [{ name: 'Test Dataset' }, { name: 'Another Dataset' }];
    const { getByText } = render(DatasetList, { props: { datasets } });
    expect(getByText('Test Dataset')).toBeTruthy();
    expect(getByText('Another Dataset')).toBeTruthy();
  });

  it('shows empty state', () => {
    const { getByText } = render(DatasetList, { props: { datasets: [] } });
    expect(getByText('No datasets found')).toBeTruthy();
  });
});
