import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { DeviceSettingsContext } from '../components/deviceSettings';
import LinkedIn from './LinkedIn';

test('renders professional experience and selected web apps', () => {
  render(<MemoryRouter><LinkedIn /></MemoryRouter>);

  expect(screen.getByRole('heading', { name: /AJ Thompson/i, level: 1 })).toBeInTheDocument();
  expect(screen.getByText('North Carolina State University')).toBeInTheDocument();
  expect(screen.getByText('B.S. in Computer Science · College of Engineering')).toBeInTheDocument();
  expect(screen.getByText('Class of 2021')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Experience' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'API Connect End-to-End Automation', level: 3 })).toBeInTheDocument();
  expect(screen.getByText('Software · 2021–Present')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Process Automation', level: 3 })).toBeInTheDocument();
  expect(screen.getByText('Fidelity Investments')).toBeInTheDocument();
  expect(screen.getByText('2019–2021')).toBeInTheDocument();
  expect(screen.getByText(/700–1,000 tests nightly through Jenkins/i)).toBeInTheDocument();
  expect(screen.getByText(/data-access tool that let internal teams retrieve/i)).toBeInTheDocument();
  expect(screen.getByText('SQL · JavaScript · Java · Ruby')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
  expect(screen.getByText('New Trinity')).toBeInTheDocument();
  expect(screen.getByText('Lattaco Welding')).toBeInTheDocument();
  expect(screen.getByText('Jazzed To Be Jones')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /^Projects$/i })).toHaveAttribute('href', '/app-store');
  expect(screen.getByRole('link', { name: /^Contact$/i })).toHaveAttribute('href', '/mail');
});

test('uses the device account image for the profile photo', () => {
  render(
    <DeviceSettingsContext.Provider value={{ adminProfile: { imageUrl: 'https://example.com/account.jpg' } }}>
      <MemoryRouter><LinkedIn /></MemoryRouter>
    </DeviceSettingsContext.Provider>
  );

  expect(screen.getByRole('img', { name: 'AJ Thompson' })).toHaveAttribute('src', 'https://example.com/account.jpg');
});
