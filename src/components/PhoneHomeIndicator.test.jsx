import React, { useRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import PhoneHomeIndicator from './PhoneHomeIndicator';

const savedMatchMedia = window.matchMedia;

function Phone({ motion = true }) {
  const screenRef = useRef(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return (
    <div ref={screenRef} aria-label="Phone screen">
      <output aria-label="Current page">{pathname}</output>
      <PhoneHomeIndicator key={pathname} screenRef={screenRef} motion={motion} hasApp={pathname !== '/'} onHome={() => navigate('/')} />
    </div>
  );
}

function openPhone(motion = true) {
  render(<MemoryRouter initialEntries={['/settings']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Phone motion={motion} /></MemoryRouter>);
  const bar = screen.getByRole('link', { name: 'Return to phone home screen' });
  bar.setPointerCapture = jest.fn();
  return bar;
}

function pointer(bar, type, x, y, timeStamp = 0) {
  const event = new Event(type, { bubbles: true });
  Object.assign(event, { pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0, clientX: x, clientY: y });
  Object.defineProperty(event, 'timeStamp', { value: 1000 + timeStamp });
  fireEvent(bar, event);
}

beforeEach(() => {
  jest.useFakeTimers();
  window.matchMedia = jest.fn(() => ({ matches: false }));
});

afterEach(() => {
  jest.useRealTimers();
  window.matchMedia = savedMatchMedia;
});

test('a held swipe follows the finger and completes home navigation after release', () => {
  const bar = openPhone();
  const phone = screen.getByLabelText('Phone screen');
  pointer(bar, 'pointerdown', 100, 550);
  pointer(bar, 'pointermove', 100, 400, 300);
  act(() => jest.advanceTimersByTime(20));
  expect(phone.style.getPropertyValue('--home-offset')).toBe('150px');
  expect(screen.getByLabelText('Current page')).toHaveTextContent('/settings');
  pointer(bar, 'pointerup', 100, 400, 350);
  pointer(bar, 'lostpointercapture', 100, 400, 350);
  expect(screen.getByLabelText('Current page')).toHaveTextContent('/settings');
  act(() => jest.advanceTimersByTime(300));
  expect(screen.getByLabelText('Current page').textContent).toBe('/');
  expect(phone).not.toHaveClass('device-screen--home-gesture');
  expect(phone.style.getPropertyValue('--home-offset')).toBe('');
});

test.each(['pointercancel', 'lostpointercapture'])('%s restores the app without navigating', (type) => {
  const bar = openPhone();
  pointer(bar, 'pointerdown', 100, 550);
  pointer(bar, 'pointermove', 100, 350, 300);
  act(() => jest.advanceTimersByTime(20));
  pointer(bar, type, 100, 350, 350);
  fireEvent.click(bar, { detail: 1 });
  act(() => jest.advanceTimersByTime(300));
  expect(screen.getByLabelText('Current page')).toHaveTextContent('/settings');
  expect(screen.getByLabelText('Phone screen')).not.toHaveClass('device-screen--home-gesture');
});

test.each([[100, 530], [100, 580], [250, 500]])('short, downward, and sideways drags stay in the app (%s, %s)', (x, y) => {
  const bar = openPhone();
  pointer(bar, 'pointerdown', 100, 550);
  pointer(bar, 'pointermove', x, y, 300);
  pointer(bar, 'pointerup', x, y, 350);
  fireEvent.click(bar, { detail: 1 });
  act(() => jest.advanceTimersByTime(300));
  expect(screen.getByLabelText('Current page')).toHaveTextContent('/settings');
});

test('pulling back down reverses the preview and restores the app', () => {
  const bar = openPhone();
  const phone = screen.getByLabelText('Phone screen');
  pointer(bar, 'pointerdown', 100, 550);
  pointer(bar, 'pointermove', 100, 350, 300);
  act(() => jest.advanceTimersByTime(20));
  pointer(bar, 'pointermove', 100, 530, 600);
  act(() => jest.advanceTimersByTime(20));
  expect(phone.style.getPropertyValue('--home-offset')).toBe('20px');
  pointer(bar, 'pointerup', 100, 530, 650);
  act(() => jest.advanceTimersByTime(300));
  expect(screen.getByLabelText('Current page')).toHaveTextContent('/settings');
  expect(phone.style.getPropertyValue('--home-offset')).toBe('0px');
});

test('a short upward flick goes home', () => {
  const bar = openPhone();
  pointer(bar, 'pointerdown', 100, 550);
  pointer(bar, 'pointermove', 100, 500, 50);
  pointer(bar, 'pointerup', 100, 500, 60);
  act(() => jest.advanceTimersByTime(300));
  expect(screen.getByLabelText('Current page').textContent).toBe('/');
});

test.each([0, 1])('keyboard and tap activation still go home (click detail %s)', (detail) => {
  const bar = openPhone();
  fireEvent.click(bar, { detail });
  expect(screen.getByLabelText('Current page').textContent).toBe('/');
});

test.each(['off', 'reduced'])('motion %s completes immediately on release', (mode) => {
  window.matchMedia.mockReturnValue({ matches: mode === 'reduced' });
  const bar = openPhone(mode !== 'off');
  pointer(bar, 'pointerdown', 100, 550);
  pointer(bar, 'pointermove', 100, 350, 300);
  pointer(bar, 'pointerup', 100, 350, 350);
  expect(screen.getByLabelText('Current page').textContent).toBe('/');
});
