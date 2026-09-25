import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

function PhoneHomeIndicator({ screenRef, hasApp, motion, onHome }) {
  const gestureRef = useRef(null);
  const frameRef = useRef(null);
  const offsetRef = useRef(0);
  const movedRef = useRef(false);
  const finishingRef = useRef(false);

  useEffect(() => {
    const screen = screenRef.current;
    return () => {
      cancelAnimationFrame(frameRef.current);
      screen.classList.remove('device-screen--home-gesture');
      screen.style.removeProperty('--home-progress');
      screen.style.removeProperty('--home-offset');
    };
  }, [screenRef]);

  const paint = (offset, distance) => {
    offsetRef.current = offset;
    screenRef.current.style.setProperty('--home-offset', `${offset}px`);
    screenRef.current.style.setProperty('--home-progress', Math.min(offset / distance, 1));
  };

  const settle = (complete, distance) => {
    gestureRef.current = null;
    cancelAnimationFrame(frameRef.current);
    finishingRef.current = complete;
    const start = offsetRef.current;
    const end = complete ? distance : 0;
    const finish = () => {
      frameRef.current = null;
      if (complete) onHome();
      else screenRef.current.classList.remove('device-screen--home-gesture');
    };
    if (!motion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      paint(end, distance);
      finish();
      return;
    }
    const started = performance.now();
    const duration = complete ? 240 : 280;
    const tick = (now) => {
      const progress = Math.min((now - started) / duration, 1);
      paint(start + (end - start) * (1 - Math.pow(1 - progress, 3)), distance);
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
      else finish();
    };
    frameRef.current = requestAnimationFrame(tick);
  };

  const cancel = (event) => {
    if (gestureRef.current?.id === event.pointerId) settle(false, gestureRef.current.distance);
  };

  return (
    <Link
      className="device-screen__home-indicator"
      to="/"
      draggable={false}
      aria-label="Return to phone home screen"
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0 || finishingRef.current) return;
        movedRef.current = false;
        if (!hasApp) return;
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
        gestureRef.current = {
          id: event.pointerId, x: event.clientX, y: event.clientY, axis: null,
          start: offsetRef.current, offset: offsetRef.current,
          distance: (screenRef.current.clientHeight || 600) * 0.65,
          lastY: event.clientY, lastTime: event.timeStamp, velocity: 0
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const gesture = gestureRef.current;
        if (!gesture || gesture.id !== event.pointerId) return;
        const dx = Math.abs(event.clientX - gesture.x);
        const dy = gesture.y - event.clientY;
        if (Math.max(dx, Math.abs(dy)) > 8) {
          movedRef.current = true;
          if (!gesture.axis) gesture.axis = Math.abs(dy) > dx ? 'vertical' : 'horizontal';
        }
        if (gesture.axis !== 'vertical') return;
        screenRef.current.classList.add('device-screen--home-gesture');
        const elapsed = event.timeStamp - gesture.lastTime;
        if (elapsed > 0) gesture.velocity = (gesture.lastY - event.clientY) / elapsed;
        gesture.lastY = event.clientY;
        gesture.lastTime = event.timeStamp;
        gesture.offset = Math.max(0, Math.min(gesture.start + dy, gesture.distance));
        if (frameRef.current === null) {
          frameRef.current = requestAnimationFrame(() => {
            frameRef.current = null;
            paint(gesture.offset, gesture.distance);
          });
        }
      }}
      onPointerUp={(event) => {
        const gesture = gestureRef.current;
        if (!gesture || gesture.id !== event.pointerId) return;
        const dy = gesture.y - event.clientY;
        const offset = Math.max(0, Math.min(gesture.start + dy, gesture.distance));
        const flick = dy > 32 && gesture.velocity > 0.55 && event.timeStamp - gesture.lastTime < 100;
        const complete = gesture.axis === 'vertical' && dy > Math.abs(event.clientX - gesture.x)
          && (offset >= Math.min(110, gesture.distance * 0.3) || flick);
        if (gesture.axis === 'vertical') paint(offset, gesture.distance);
        settle(complete, gesture.distance);
      }}
      onPointerCancel={cancel}
      onLostPointerCapture={(event) => { if (event.target === event.currentTarget) cancel(event); }}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        if (finishingRef.current || (movedRef.current && event.detail !== 0)) return;
        onHome();
      }}
    />
  );
}

export default PhoneHomeIndicator;
