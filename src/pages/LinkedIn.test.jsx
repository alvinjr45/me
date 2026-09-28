import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { DeviceSettingsContext } from '../components/deviceSettings';
import LinkedIn from './LinkedIn';

test('renders a portfolio resume without invented employment details', () => {
  render(<MemoryRouter><LinkedIn /></MemoryRouter>);

  expect(screen.getByRole('heading', { name: /AJ Thompson/i, level: 1 })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Experience' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Product engineering', level: 3 })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Creative systems', level: 3 })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Continuous experiments', level: 3 })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /View portfolio/i })).toHaveAttribute('href', 'https://ajt3.website');
  expect(screen.getByRole('link', { name: /Read build notes/i })).toHaveAttribute('href', '/blog');
  expect(screen.queryByText(/musician|dog person/i)).not.toBeInTheDocument();
});

test('uses the device account image for the profile photo', () => {
  render(
    <DeviceSettingsContext.Provider value={{ adminProfile: { imageUrl: 'https://example.com/account.jpg' } }}>
      <MemoryRouter><LinkedIn /></MemoryRouter>
    </DeviceSettingsContext.Provider>
  );

  expect(screen.getByRole('img', { name: 'AJ Thompson' })).toHaveAttribute('src', 'https://example.com/account.jpg');
});
