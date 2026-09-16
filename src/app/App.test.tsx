import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { App } from './App';

describe('App navigation', () => {
  it('stores the selected view in the URL', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Hourly' }));
    expect(new URLSearchParams(window.location.search).get('view')).toBe('hourly');
  });
});
