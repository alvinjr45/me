import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
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

test.each([false, true])('opens policy entry links and navigates between policies (phone: %s)', (isPhone) => {
  window.matchMedia.mockImplementation((query) => ({
    matches: isPhone && query.includes('max-width'),
    addEventListener: jest.fn(), removeEventListener: jest.fn()
  }));
  window.history.replaceState(null, '', '/terms');
  render(<App />);
  if (isPhone) fireEvent.click(screen.getByRole('button', { name: 'Unlock as Guest' }));
  expect(screen.getByRole('heading', { name: 'Terms and Conditions', level: 1 })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('link', { name: 'Privacy Policy' }));
  expect(screen.getByRole('heading', { name: 'Privacy Policy', level: 1 })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Cloudflare Turnstile Privacy Addendum' })).toHaveAttribute('href', 'https://www.cloudflare.com/turnstile-privacy-policy/');
  expect(window.location.pathname).toBe('/');
});

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

test.each([
  [true, 'Build'],
  [false, 'Build'],
  [false, 'Open Build']
])('Build shows a full emulator redirect screen before leaving the site (phone: %s, link: %s)', (isPhone, linkName) => {
  jest.useFakeTimers();
  const savedLocation = Object.getOwnPropertyDescriptor(window, 'location');
  const assign = jest.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { href: window.location.href, origin: window.location.origin, pathname: '/', search: '', hash: '', assign }
  });
  window.matchMedia.mockImplementation((query) => ({
    matches: isPhone && query.includes('max-width'),
    addEventListener: jest.fn(), removeEventListener: jest.fn()
  }));
  let unmount;
  try {
    ({ unmount } = render(<App />));
    if (isPhone) fireEvent.click(screen.getByRole('button', { name: 'Unlock as Guest' }));
    fireEvent.click(screen.getByRole('link', { name: linkName }));
    const redirect = screen.getByRole('region', { name: 'Redirecting to ajt3.website...' });
    expect(redirect).toHaveClass('device-system-screen--redirect');
    expect(within(redirect).getByRole('heading')).toHaveFocus();
    expect(within(redirect).getByText("You're leaving AJ's Personal Site.")).toBeInTheDocument();
    expect(within(redirect).getByRole('link', { name: 'Continue now' })).toHaveAttribute('href', 'https://ajt3.website');
    expect(screen.queryByRole('navigation', { name: 'Open a site app' })).not.toBeInTheDocument();
    act(() => jest.advanceTimersByTime(1999));
    expect(assign).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(1));
    expect(assign).toHaveBeenCalledWith('https://ajt3.website');
    const restoredPage = new Event('pageshow');
    Object.defineProperty(restoredPage, 'persisted', { value: true });
    fireEvent(window, restoredPage);
    expect(screen.queryByRole('region', { name: 'Redirecting to ajt3.website...' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Build' })).toBeInTheDocument();
  } finally {
    unmount?.();
    Object.defineProperty(window, 'location', savedLocation);
    jest.useRealTimers();
  }
});

describe('iOS scene entry', () => {
  let enterFrame;
  let mocks;
  let savedWindowScrollY;

  beforeEach(() => {
    enterFrame = undefined;
    savedWindowScrollY = window.scrollY;
    window.scrollY = 0;
    mocks = [
      jest.spyOn(navigator, 'userAgent', 'get').mockReturnValue('iPhone'),
      jest.spyOn(document, 'readyState', 'get').mockReturnValue('complete'),
      jest.spyOn(window, 'scrollTo').mockImplementation(() => {}),
      jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
        enterFrame = callback;
        return 1;
      }),
      jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    ];
    window.matchMedia.mockImplementation((query) => ({
      matches: query.includes('max-width'),
      addEventListener: jest.fn(), removeEventListener: jest.fn()
    }));
    document.documentElement.style.setProperty('--device-scene-entry-offset', '80px');
  });

  afterEach(() => {
    mocks.forEach((mock) => mock.mockRestore());
    window.scrollY = savedWindowScrollY;
    document.documentElement.style.removeProperty('--device-scene-entry-offset');
  });

  test('enters the scene once without scrolling again when unlocking or opening an app', () => {
    const { unmount } = render(<App />);
    expect(document.documentElement).toHaveClass('device-page--scene-entry');
    act(() => enterFrame());
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 80, left: 0, behavior: 'instant' });
    fireEvent.click(screen.getByRole('button', { name: 'Unlock as Guest' }));
    fireEvent.click(screen.getByRole('link', { name: 'Music' }));
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
    unmount();
    expect(document.documentElement).not.toHaveClass('device-page--scene-entry');
  });

  test.each(['pointerdown', 'wheel', 'keydown'])('does not override a user %s before entry', (event) => {
    render(<App />);
    fireEvent(window, new Event(event));
    act(() => enterFrame());
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  test('preserves a restored scroll position', () => {
    window.scrollY = 120;
    render(<App />);
    act(() => enterFrame());
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  test.each(['desktop', 'standalone', 'other browser'])('leaves %s entry unchanged', (mode) => {
    if (mode === 'other browser') mocks[0].mockReturnValue('Android');
    window.matchMedia.mockImplementation((query) => ({
      matches: mode !== 'desktop' && (query.includes('max-width') || (mode === 'standalone' && query.includes('display-mode'))),
      addEventListener: jest.fn(), removeEventListener: jest.fn()
    }));
    render(<App />);
    expect(document.documentElement).not.toHaveClass('device-page--scene-entry');
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});

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
  if (isPhone) fireEvent.click(screen.getByRole('button', { name: 'Unlock as Guest' }));
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
