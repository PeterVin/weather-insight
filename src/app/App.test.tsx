import { render, screen } from '@testing-library/react';

import { App } from './App';

describe('App', () => {
  it('renders the product foundation', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /Weather data will be displayed here/i }),
    ).toBeInTheDocument();
  });
});
