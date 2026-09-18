import { render, screen } from '@testing-library/react';

import { weatherFixture } from '../test/weatherFixture';
import { App } from './App';

vi.mock('../features/weather/model/useWeather', () => ({
  useWeather: () => ({
    status: 'success',
    data: weatherFixture,
    error: null,
    isStale: false,
    lastSuccessfulAt: weatherFixture.updatedAt,
    refresh: vi.fn(),
  }),
}));

describe('Weather application', () => {
  it('renders normalized weather data', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: weatherFixture.current.summary }),
    ).toBeInTheDocument();
  });
});
