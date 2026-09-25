import React, { useRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import usePhoneLoginViewport from './usePhoneLoginViewport';

function Login({ enabled = true }) {
  const ref = useRef(null);
  usePhoneLoginViewport(ref, enabled);
  return <div className="device-scene" data-testid="scene">
    <div className="device-scene__monitor"><div data-testid="phone">
      <section ref={ref} data-testid="login"><input type="password" aria-label="Password" /><button>Log in</button></section>
    </div></div>
  </div>;
}

const savedViewport = window.visualViewport;
let viewport;
let nextFrame;
let scrollTo;

beforeEach(() => {
  viewport = Object.assign(new EventTarget(), { height: 800, offsetTop: 0, offsetLeft: 0, scale: 1 });
  window.visualViewport = viewport;
  scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => { nextFrame = callback; return 1; });
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  window.visualViewport = savedViewport;
});

function openLogin(enabled = true) {
  const result = render(<Login enabled={enabled} />);
  const scene = screen.getByTestId('scene');
  scene.getBoundingClientRect = () => ({ top: -80, left: 0, width: 390, height: 880 });
  scene.querySelector('.device-scene__monitor').getBoundingClientRect = () => ({ height: 760 });
  screen.getByTestId('phone').getBoundingClientRect = () => ({ top: 20, height: 748 });
  screen.getByTestId('login').getBoundingClientRect = () => ({ top: 20, bottom: 460 });
  const input = screen.getByLabelText('Password');
  input.getBoundingClientRect = () => ({ top: 560, bottom: 600 });
  act(() => input.focus());
  return { ...result, scene, input };
}

function changeViewport(values, event = 'resize') {
  Object.assign(viewport, values);
  act(() => {
    viewport.dispatchEvent(new Event(event));
    nextFrame();
  });
}

test('keeps the scene anchored through keyboard resize and viewport panning while scrolling only the login panel', () => {
  const { scene } = openLogin();
  expect(scene).toHaveClass('device-scene--keyboard');
  expect(scene.style.getPropertyValue('--keyboard-monitor-height')).toBe('760px');
  changeViewport({ height: 480, offsetTop: 120 });
  expect(scene.style.getPropertyValue('--keyboard-scene-top')).toBe('40px');
  expect(scene.style.getPropertyValue('--keyboard-login-height')).toBe('448px');
  expect(screen.getByTestId('login').scrollTop).toBeGreaterThan(0);
  expect(scrollTo).not.toHaveBeenCalled();
  changeViewport({ offsetTop: 160 }, 'scroll');
  expect(scene.style.getPropertyValue('--keyboard-scene-top')).toBe('80px');
  expect(scene.style.getPropertyValue('--keyboard-monitor-height')).toBe('760px');
});

test('waits for keyboard dismissal after blur, then restores the page offset and sizing', () => {
  const { scene, input } = openLogin();
  changeViewport({ height: 480, offsetTop: 120 });
  act(() => input.blur());
  act(() => nextFrame());
  expect(scene).toHaveClass('device-scene--keyboard');
  changeViewport({ height: 800, offsetTop: 0 });
  expect(scene).not.toHaveClass('device-scene--keyboard');
  expect(scene.style.length).toBe(0);
  expect(scrollTo).toHaveBeenCalledWith({ left: window.scrollX, top: window.scrollY, behavior: 'instant' });
});

test('cleans up an active session when login unmounts', () => {
  const { scene, unmount } = openLogin();
  changeViewport({ height: 480 });
  unmount();
  expect(scene).not.toHaveClass('device-scene--keyboard');
  expect(scene.style.length).toBe(0);
  const count = scrollTo.mock.calls.length;
  fireEvent(viewport, new Event('resize'));
  expect(scrollTo).toHaveBeenCalledTimes(count);
});

test('leaves desktop login unchanged', () => {
  const { scene } = openLogin(false);
  expect(scene).not.toHaveClass('device-scene--keyboard');
  expect(scrollTo).not.toHaveBeenCalled();
});
