import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';

jest.mock('heic2any', () => jest.fn());
jest.mock('./pages/Tech', () => () => <h1>Tech content</h1>);
jest.mock('./pages/Music', () => () => <h1>Music content</h1>);
jest.mock('./pages/Dogs', () => () => null);
jest.mock('./pages/Photos', () => () => null);
jest.mock('./pages/Settings', () => () => null);
jest.mock('./pages/MissionControl', () => () => null);
jest.mock('./pages/Blog', () => {
  const { Link } = require('react-router-dom');
  return () => <Link to="/blog/first-post">Read first post</Link>;
});
jest.mock('./pages/BlogPost', () => {
  const { useParams, useLocation, Link } = require('react-router-dom');
  return () => {
    const { slug } = useParams();
    const { search, hash } = useLocation();
    return <><h1>{slug}{search}{hash}</h1><Link to="/blog">All entries</Link></>;
  };
});

const savedMatchMedia = window.matchMedia;
const savedScrollTo = HTMLElement.prototype.scrollTo;

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  window.matchMedia = jest.fn(() => ({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }));
  HTMLElement.prototype.scrollTo = jest.fn();
});

afterEach(() => {
  window.history.replaceState(null, '', '/');
  window.matchMedia = savedMatchMedia;
  HTMLElement.prototype.scrollTo = savedScrollTo;
});

function expectHomeUrl(historyLength) {
  expect(window.location.pathname + window.location.search + window.location.hash).toBe('/');
  expect(window.history.length).toBe(historyLength);
}

test('opens multiple desktop apps and closes them without changing browser history', () => {
  const historyLength = window.history.length;
  render(<App />);
  fireEvent.click(screen.getByRole('link', { name: 'Open Dogs' }));
  fireEvent.click(screen.getByRole('link', { name: 'Open Music' }));
  expect(screen.getByRole('region', { name: 'Dogs app' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Music app' })).toBeInTheDocument();
  expectHomeUrl(historyLength);
  fireEvent.click(screen.getByRole('button', { name: 'Close Music' }));
  expect(screen.queryByRole('region', { name: 'Music app' })).not.toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Dogs app' })).toBeInTheDocument();
  expectHomeUrl(historyLength);
});

test.each([false, true])('opens a direct article link and keeps subsequent navigation at home (phone: %s)', (isPhone) => {
  window.matchMedia.mockImplementation((query) => ({
    matches: isPhone && query.includes('max-width'),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }));
  window.history.replaceState(null, '', '/blog/first-post?source=shared#details');
  const historyLength = window.history.length;
  render(<React.StrictMode><App /></React.StrictMode>);
  expect(screen.getByRole('region', { name: 'Blog app' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'first-post?source=shared#details' })).toBeInTheDocument();
  if (!isPhone) expect(screen.getByRole('navigation', { name: 'Open a site app' })).toBeInTheDocument();
  expectHomeUrl(historyLength);
  fireEvent.click(screen.getByRole('link', { name: 'All entries' }));
  fireEvent.click(screen.getByRole('link', { name: 'Read first post' }));
  expect(screen.getByRole('heading', { name: 'first-post' })).toBeInTheDocument();
  expectHomeUrl(historyLength);
  fireEvent.click(screen.getByRole('link', { name: 'Return to phone home screen' }));
  expect(screen.getByRole('navigation', { name: 'Open a site app' })).toBeInTheDocument();
  expectHomeUrl(historyLength);
});

test('terminal navigation opens an app without changing the home URL', async () => {
  const historyLength = window.history.length;
  render(<App />);
  fireEvent.keyDown(document, { key: '`' });
  const terminal = screen.getByRole('region', { name: 'Terminal app' });
  const input = within(terminal).getByRole('textbox');
  fireEvent.change(input, { target: { value: 'open music' } });
  fireEvent.submit(input.closest('form'));
  expect(await screen.findByRole('region', { name: 'Music app' })).toBeInTheDocument();
  expectHomeUrl(historyLength);
});
