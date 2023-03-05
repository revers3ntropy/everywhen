import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import Page from '../../routes/+page.svelte';

describe('/', () => {
    test('renders', () => {
        const { getByText } = render(Page);
        expect(getByText('Username')).toBeInTheDocument();
        expect(getByText('Password')).toBeInTheDocument();
        expect(getByText('Sign Up')).toBeInTheDocument();
        expect(getByText('Log In')).toBeInTheDocument();
        expect(getByText('Log In')).toBeEnabled();
        expect(getByText('Sign Up')).toBeEnabled();
    });
});