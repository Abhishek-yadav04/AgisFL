import { render, fireEvent } from '@testing-library/vue';
import LoginForm from '@/components/LoginForm.vue';

describe('LoginForm', () => {
  it('renders correctly', () => {
    const { getByLabelText } = render(LoginForm);
    expect(getByLabelText('Username')).toBeTruthy();
    expect(getByLabelText('Password')).toBeTruthy();
  });

  it('submits valid credentials', async () => {
    const { getByLabelText, getByText } = render(LoginForm);
    await fireEvent.update(getByLabelText('Username'), 'user1');
    await fireEvent.update(getByLabelText('Password'), 'StrongPass123!');
    await fireEvent.click(getByText('Login'));
    // Add assertion for API call or UI change
  });

  it('shows error on invalid input', async () => {
    const { getByLabelText, getByText, findByText } = render(LoginForm);
    await fireEvent.update(getByLabelText('Username'), '');
    await fireEvent.click(getByText('Login'));
    expect(await findByText('Username is required')).toBeTruthy();
  });
});
