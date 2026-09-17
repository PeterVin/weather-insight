import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { weatherFixture } from '../../../test/weatherFixture';
import { searchLocations } from '../../weather/api/openMeteo';
import { LocationSearch } from './LocationSearch';

vi.mock('../../weather/api/openMeteo', () => ({
  getWeather: vi.fn(),
  searchLocations: vi.fn(),
}));

const searchLocationsMock = vi.mocked(searchLocations);

describe('LocationSearch', () => {
  it('selects a search result with the pointer', async () => {
    searchLocationsMock.mockResolvedValue([weatherFixture.location]);
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <LocationSearch
        selectedLocation={{ ...weatherFixture.location, name: 'Szeged' }}
        onSelect={onSelect}
      />,
    );

    await user.type(screen.getByRole('combobox', { name: 'Search locations' }), 'Buda');
    await user.click(await screen.findByRole('button', { name: /Budapest/ }));

    expect(onSelect).toHaveBeenCalledWith(weatherFixture.location);
  });

  it('selects the active result with the keyboard', async () => {
    searchLocationsMock.mockResolvedValue([weatherFixture.location]);
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<LocationSearch selectedLocation={weatherFixture.location} onSelect={onSelect} />);

    const input = screen.getByRole('combobox', { name: 'Search locations' });
    await user.type(input, 'Buda');
    await screen.findByRole('button', { name: /Budapest/ });
    await user.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledWith(weatherFixture.location);
    expect(input).toHaveValue('');
  });
});
