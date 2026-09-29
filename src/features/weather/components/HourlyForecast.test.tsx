import { render } from '@testing-library/react';

import { weatherFixture } from '../../../test/weatherFixture';
import { HourlyForecast } from './HourlyForecast';

describe('HourlyForecast', () => {
  it('uses one tooltip host across the synchronized bands', () => {
    const { container } = render(
      <HourlyForecast hourly={weatherFixture.hourly} unit="celsius" timeZone="Europe/Budapest" />,
    );
    expect(container.querySelectorAll('[data-tooltip-host="shared-hourly"]')).toHaveLength(1);
  });
});
