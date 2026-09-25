import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dogs from './Dogs';
import { getBlogPostsByTag } from '../data/blogPosts';
import { getLatestDogIncident } from '../data/dogIncident';

jest.mock('../data/blogPosts', () => ({ getBlogPostsByTag: jest.fn() }));
jest.mock('../data/dogIncident', () => ({
  ...jest.requireActual('../data/dogIncident'),
  getLatestDogIncident: jest.fn()
}));

const posts = [
  { slug: 'patrol', title: 'Drake on patrol', excerpt: 'The daily rounds.', date: 'September 20, 2026', tags: ['dogs'], sections: [{ heading: 'Patrol report', paragraphs: ['Every room inspected.'] }] },
  { slug: 'snacks', title: 'Josh finds the snacks', excerpt: 'An afternoon adventure.', date: 'September 19, 2026', tags: ['dogs'], sections: [] }
];

beforeEach(() => {
  getBlogPostsByTag.mockReset().mockResolvedValue(posts);
  getLatestDogIncident.mockReset().mockResolvedValue(null);
});

function renderDogs() {
  return render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Dogs /></MemoryRouter>);
}

test('searches field notes and returns from the embedded reader with focus and search preserved', async () => {
  renderDogs();
  await screen.findByRole('button', { name: /Drake on patrol/ });
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search field notes' }), { target: { value: 'Drake' } });
  expect(screen.queryByRole('button', { name: /Josh finds the snacks/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Drake on patrol/ }));
  expect(screen.getByRole('heading', { name: 'Drake on patrol' })).toHaveFocus();
  expect(screen.getByText('Every room inspected.')).toBeInTheDocument();
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Article navigation' })).getByRole('button', { name: 'Dog HQ' }));
  expect(screen.getByRole('searchbox')).toHaveValue('Drake');
  expect(screen.getByRole('button', { name: /Drake on patrol/ })).toHaveFocus();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'no such story' } });
  expect(screen.getByRole('heading', { name: 'No matching field notes' })).toBeInTheDocument();
});

test('keeps notes usable when incident loading fails and retries without claiming a clean record', async () => {
  getLatestDogIncident.mockRejectedValue(new Error('Offline'));
  renderDogs();
  expect(screen.queryByText('No incidents on file')).not.toBeInTheDocument();
  expect(await screen.findByRole('alert')).toHaveTextContent('Report unavailable');
  expect(screen.getByRole('button', { name: /Drake on patrol/ })).toBeInTheDocument();
  expect(screen.queryByText('No incidents on file')).not.toBeInTheDocument();
  getLatestDogIncident.mockResolvedValue({ culprit: 'Josh', incident: 'Snack theft.', incidentAt: new Date(Date.now() - 3 * 86400000).toISOString(), incidentCount: 2 });
  fireEvent.click(screen.getByRole('button', { name: /Try again/ }));
  expect(await screen.findByText('Snack theft.')).toBeInTheDocument();
  expect(screen.getByText('03')).toBeInTheDocument();
  expect(screen.getByText('2nd incident all-time')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('distinguishes empty notes from failure and refreshes published notes', async () => {
  getBlogPostsByTag.mockRejectedValue(new Error('Offline'));
  renderDogs();
  expect(await screen.findByRole('alert')).toHaveTextContent("Field notes couldn't be loaded.");
  expect(screen.getByText('No incidents on file')).toBeInTheDocument();
  getBlogPostsByTag.mockResolvedValue([]);
  fireEvent.click(screen.getByRole('button', { name: /Try again/ }));
  expect(await screen.findByRole('heading', { name: 'The story starts here.' })).toBeInTheDocument();
  getBlogPostsByTag.mockResolvedValue(posts);
  fireEvent(window, new Event('ajt3-posts-updated'));
  expect(await screen.findByRole('button', { name: /Drake on patrol/ })).toBeInTheDocument();
});
