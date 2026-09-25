import { useEffect } from 'react';

export default function usePhoneLoginViewport(panelRef, enabled) {
  useEffect(() => {
    const panel = panelRef.current;
    const viewport = window.visualViewport;
    const scene = panel?.closest('.device-scene');
    if (!enabled || !viewport || !scene) return undefined;

    let session = null;
    let frame;
    let restingHeight = viewport.height;
    const properties = [
      '--keyboard-scene-top', '--keyboard-scene-left', '--keyboard-scene-width',
      '--keyboard-scene-height', '--keyboard-monitor-height', '--keyboard-login-height'
    ];
    const passwordFocused = () => panel.contains(document.activeElement)
      && document.activeElement.matches('input[type="password"]');

    const restore = () => {
      if (!session) return;
      const { scrollX, scrollY } = session;
      session = null;
      scene.classList.remove('device-scene--keyboard');
      properties.forEach((property) => scene.style.removeProperty(property));
      window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
    };

    const pinScene = () => {
      if (session || !passwordFocused() || viewport.scale !== 1) return;
      const rect = scene.getBoundingClientRect();
      const screen = panel.parentElement.getBoundingClientRect();
      session = {
        top: rect.top - viewport.offsetTop,
        left: rect.left - viewport.offsetLeft,
        screenTop: screen.top - viewport.offsetTop,
        screenHeight: screen.height,
        width: window.innerWidth,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        keyboardShown: false
      };
      scene.style.setProperty('--keyboard-scene-width', `${rect.width}px`);
      scene.style.setProperty('--keyboard-scene-height', `${rect.height}px`);
      scene.style.setProperty('--keyboard-monitor-height', `${scene.querySelector('.device-scene__monitor').getBoundingClientRect().height}px`);
      scene.classList.add('device-scene--keyboard');
    };

    const update = () => {
      if (!session && passwordFocused() && restingHeight - viewport.height > 100) pinScene();
      if (!session) {
        restingHeight = viewport.height;
        return;
      }
      if (window.innerWidth !== session.width || viewport.scale !== 1) {
        restore();
        restingHeight = viewport.height;
        return;
      }
      if (restingHeight - viewport.height > 100) session.keyboardShown = true;
      if (viewport.height >= restingHeight - 2 && (session.keyboardShown || !passwordFocused())) {
        restore();
        restingHeight = viewport.height;
        return;
      }
      // Safari can pan the visual viewport independently of document scrolling.
      scene.style.setProperty('--keyboard-scene-top', `${session.top + viewport.offsetTop}px`);
      scene.style.setProperty('--keyboard-scene-left', `${session.left + viewport.offsetLeft}px`);
      scene.style.setProperty('--keyboard-login-height', `${Math.max(0, Math.min(session.screenHeight, viewport.height - session.screenTop - 12))}px`);
      if (passwordFocused()) {
        const field = document.activeElement.getBoundingClientRect();
        const bounds = panel.getBoundingClientRect();
        if (field.bottom > bounds.bottom - 16) panel.scrollTop += field.bottom - bounds.bottom + 16;
        else if (field.top < bounds.top + 16) panel.scrollTop -= bounds.top + 16 - field.top;
      }
    };
    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };
    const onFocus = () => { pinScene(); update(); };

    panel.addEventListener('focusin', onFocus);
    panel.addEventListener('focusout', scheduleUpdate);
    viewport.addEventListener('resize', scheduleUpdate);
    viewport.addEventListener('scroll', scheduleUpdate);
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      window.cancelAnimationFrame(frame);
      panel.removeEventListener('focusin', onFocus);
      panel.removeEventListener('focusout', scheduleUpdate);
      viewport.removeEventListener('resize', scheduleUpdate);
      viewport.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      restore();
    };
  }, [panelRef, enabled]);
}
