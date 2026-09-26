import React, { useRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import PhoneBackGesture from './PhoneBackGesture';

const savedMatchMedia = window.matchMedia;

function Phone({ motion = true, onBack }) {
  const screenRef = useRef(null);
  return (
    <div ref={screenRef} aria-label="Phone screen">
      <PhoneBackGesture screenRef={screenRef} motion={motion} previousLabel="Blogs" onBack={onBack} />
    </div>
  );
}

function openPhone(onBack = jest.fn(), motion = true) {
  const view = render(<Phone motion={motion} onBack={onBack} />);
  /* eslint-disable testing-library/no-container, testing-library/no-node-access */
  const edge = view.container.querySelector('.device-screen__back-edge');
  /* eslint-enable testing-library/no-container, testing-library/no-node-access */
  edge.setPointerCapture = jest.fn();
  return { edge, onBack, phone: screen.getByLabelText('Phone screen') };
}

function pointer(edge, type, x, y, timeStamp = 0) {
  const event = new Event(type, { bubbles: true });
  Object.assign(event, { pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0, clientX: x, clientY: y });
  Object.defineProperty(event, 'timeStamp', { value: 1000 + timeStamp });
  fireEvent(edge, event);
}

beforeEach(() => {
  jest.useFakeTimers();
  window.matchMedia = jest.fn(() => ({ matches: false }));
});

afterEach(() => {
  jest.useRealTimers();
  window.matchMedia = savedMatchMedia;
});

test('a rightward edge swipe follows the finger and goes back after release', () => {
  const { edge, onBack, phone } = openPhone();
  Object.defineProperty(phone, 'clientWidth', { value: 320 });
  pointer(edge, 'pointerdown', 4, 240);
  pointer(edge, 'pointermove', 124, 244, 200);
  act(() => jest.advanceTimersByTime(20));
  expect(phone).toHaveClass('device-screen--back-gesture');
  expect(phone.style.getPropertyValue('--back-offset')).toBe('120px');
  pointer(edge, 'pointerup', 124, 244, 240);
  expect(onBack).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(240));
  expect(onBack).toHaveBeenCalledTimes(1);
});

test.each([
  ['short', 34, 242],
  ['leftward', -80, 240],
  ['vertical', 12, 360]
])('%s drags do not go back', (_name, x, y) => {
  const { edge, onBack, phone } = openPhone();
  pointer(edge, 'pointerdown', 4, 240);
  pointer(edge, 'pointermove', x, y, 200);
  pointer(edge, 'pointerup', x, y, 240);
  act(() => jest.advanceTimersByTime(260));
  expect(onBack).not.toHaveBeenCalled();
  expect(phone).not.toHaveClass('device-screen--back-gesture');
});

test.each(['pointercancel', 'lostpointercapture'])('%s restores the current screen', (type) => {
  const { edge, onBack, phone } = openPhone();
  pointer(edge, 'pointerdown', 4, 240);
  pointer(edge, 'pointermove', 124, 240, 200);
  act(() => jest.advanceTimersByTime(20));
  pointer(edge, type, 124, 240, 220);
  act(() => jest.advanceTimersByTime(260));
  expect(onBack).not.toHaveBeenCalled();
  expect(phone).not.toHaveClass('device-screen--back-gesture');
});

test.each(['off', 'reduced'])('motion %s completes immediately', (mode) => {
  window.matchMedia.mockReturnValue({ matches: mode === 'reduced' });
  const { edge, onBack } = openPhone(jest.fn(), mode !== 'off');
  pointer(edge, 'pointerdown', 4, 240);
  pointer(edge, 'pointermove', 124, 240, 200);
  pointer(edge, 'pointerup', 124, 240, 240);
  expect(onBack).toHaveBeenCalledTimes(1);
});
