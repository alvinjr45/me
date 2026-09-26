import React, { useEffect, useRef } from 'react';

function PhoneBackGesture({ screenRef, motion, onBack, previousLabel }) {
  const gestureRef = useRef(null);
  const frameRef = useRef(null);
  const offsetRef = useRef(0);
  const finishingRef = useRef(false);

  useEffect(() => {
    const screen = screenRef.current;
    return () => {
      cancelAnimationFrame(frameRef.current);
      screen?.classList.remove('device-screen--back-gesture');
      screen?.style.removeProperty('--back-progress');
      screen?.style.removeProperty('--back-offset');
    };
  }, [screenRef]);

  const paint = (offset, distance) => {
    offsetRef.current = offset;
    screenRef.current.style.setProperty('--back-offset', `${offset}px`);
    screenRef.current.style.setProperty('--back-progress', Math.min(offset / distance, 1));
  };

  const finish = (complete, distance) => {
    gestureRef.current = null;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    finishingRef.current = true;
    const start = offsetRef.current;
    const end = complete ? distance : 0;
    const cleanUp = () => {
      finishingRef.current = false;
      if (complete) onBack();
      else screenRef.current.classList.remove('device-screen--back-gesture');
    };

    if (!motion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      paint(end, distance);
      cleanUp();
      return;
    }

    const started = performance.now();
    const duration = complete ? 180 : 220;
    const tick = (now) => {
      const progress = Math.min((now - started) / duration, 1);
      paint(start + (end - start) * (1 - Math.pow(1 - progress, 3)), distance);
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
      else {
        frameRef.current = null;
        cleanUp();
      }
    };
    frameRef.current = requestAnimationFrame(tick);
  };

  const cancel = (event) => {
    if (gestureRef.current?.id === event.pointerId) finish(false, gestureRef.current.distance);
  };

  return (
    <>
      <div className="device-screen__back-preview" aria-hidden="true">
        <span>&lsaquo;</span>
        <small>{previousLabel}</small>
      </div>
      <div
        className="device-screen__back-edge"
        aria-hidden="true"
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0 || finishingRef.current) return;
          cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
          const distance = (screenRef.current.clientWidth || 320) * 0.78;
          gestureRef.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            axis: null,
            distance,
            lastX: event.clientX,
            lastTime: event.timeStamp,
            velocity: 0,
            offset: 0
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const gesture = gestureRef.current;
          if (!gesture || gesture.id !== event.pointerId) return;
          const dx = event.clientX - gesture.x;
          const dy = Math.abs(event.clientY - gesture.y);
          if (!gesture.axis && Math.max(Math.abs(dx), dy) > 8) {
            gesture.axis = Math.abs(dx) > dy ? 'horizontal' : 'vertical';
            if (gesture.axis === 'horizontal' && dx > 0) {
              screenRef.current.classList.add('device-screen--back-gesture');
            }
          }
          if (gesture.axis !== 'horizontal' || dx <= 0) return;
          const elapsed = event.timeStamp - gesture.lastTime;
          if (elapsed > 0) gesture.velocity = (event.clientX - gesture.lastX) / elapsed;
          gesture.lastX = event.clientX;
          gesture.lastTime = event.timeStamp;
          gesture.offset = Math.min(dx, gesture.distance);
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
          const dx = event.clientX - gesture.x;
          const dy = Math.abs(event.clientY - gesture.y);
          const offset = Math.min(Math.max(dx, 0), gesture.distance);
          const flick = dx > 28 && gesture.velocity > 0.5 && event.timeStamp - gesture.lastTime < 100;
          const complete = gesture.axis === 'horizontal' && dx > dy
            && (offset >= Math.min(90, gesture.distance * 0.3) || flick);
          if (gesture.axis === 'horizontal') paint(offset, gesture.distance);
          finish(complete, gesture.distance);
        }}
        onPointerCancel={cancel}
        onLostPointerCapture={(event) => {
          if (event.target === event.currentTarget) cancel(event);
        }}
      />
    </>
  );
}

export default PhoneBackGesture;
