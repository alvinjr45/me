import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Tech from '../pages/Tech';
import Music from '../pages/Music';
import Dogs from '../pages/Dogs';
import Blog from '../pages/Blog';
import Photos from '../pages/Photos';
import Calendar from '../pages/Calendar';
import Guestbook from '../pages/Guestbook';
import Terminal from '../pages/Terminal';
import Settings from '../pages/Settings';
import AppStore from '../pages/AppStore';
import MissionControl from '../pages/MissionControl';
import SceneBackground from './SceneBackground';
import PhoneHomeIndicator from './PhoneHomeIndicator';
import useAdminAccess from '../lib/useAdminAccess';
import usePhoneLoginViewport from '../lib/usePhoneLoginViewport';
import useAdminProfile from '../lib/useAdminProfile';
import {
  DeviceSettingsContext,
  accentChoices,
  appearanceChoices,
  backgroundChoices,
  deviceViewChoices,
  wallpaperChoices,
  wallpaperSpeedChoices
} from './deviceSettings';
import './DeviceShell.css';
import './AppWorkspace.css';

export const desktopApps = [
  { key: 'guestbook', label: 'Guestbook', path: '/guestbook', description: 'Leave a little note' },
  { key: 'photos', label: 'Photos', path: '/photos', description: 'A little of my world' },
  { key: 'blog', label: 'Blog', path: '/blog', description: 'Notes from the build' },
  { key: 'calendar', label: 'Calendar', path: '/calendar', description: 'Make time for what matters', utility: true },
  { key: 'music', label: 'Music', path: '/music', description: 'The current rotation' },
  { key: 'store', label: 'App Store', path: '/app-store', description: 'Find your next favorite', utility: true },
  { key: 'dogs', label: 'Dogs', path: '/dogs', description: 'Drake & Josh' },
  { key: 'instagram', label: 'Instagram', path: 'https://www.instagram.com/_ajt3_/', description: 'Follow me on Instagram', external: true },
  { key: 'terminal', label: 'Terminal', path: '/terminal', description: 'Command center', utility: true },
  { key: 'admin', label: 'Mission Control', path: '/admin', description: 'Behind the scenes', utility: true },
  { key: 'tech', label: 'Build', path: 'https://ajt3.website', description: 'Projects & experiments', external: true },
  { key: 'settings', label: 'Settings', path: '/settings', description: 'Make it yours', utility: true }
];

const appPages = { tech: Tech, music: Music, dogs: Dogs, blog: Blog, photos: Photos, calendar: Calendar, guestbook: Guestbook, store: AppStore, admin: MissionControl, terminal: Terminal, settings: Settings };
const phoneMediaQuery = '(max-width: 1024px), (max-height: 500px)';
const phoneDockApps = desktopApps.slice(0, 4);

const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));
const resizeCorners = [
  { key: 'nw', label: 'top left' },
  { key: 'ne', label: 'top right' },
  { key: 'sw', label: 'bottom left' },
  { key: 'se', label: 'bottom right' }
];

function resizeRect(rect, corner, dx, dy, screenWidth, screenHeight) {
  const minWidth = Math.min(340, screenWidth - 24);
  const minHeight = Math.min(260, screenHeight - 105);
  let left = rect.x;
  let top = rect.y;
  let right = rect.x + rect.width;
  let bottom = rect.y + rect.height;

  if (corner.includes('w')) left = clamp(rect.x + dx, 12, right - minWidth);
  if (corner.includes('e')) right = clamp(rect.x + rect.width + dx, left + minWidth, screenWidth - 12);
  if (corner.includes('n')) top = clamp(rect.y + dy, 38, bottom - minHeight);
  if (corner.includes('s')) bottom = clamp(rect.y + rect.height + dy, top + minHeight, screenHeight - 65);

  return { x: left, y: top, width: right - left, height: bottom - top };
}

function getSavedWallpaper() {
  try {
    const saved = window.localStorage.getItem('ajt3-wallpaper');
    return wallpaperChoices.some((item) => item.key === saved) ? saved : 'aurora';
  } catch {
    return 'aurora';
  }
}

function getRandomBackground() {
  return backgroundChoices[Math.floor(Math.random() * backgroundChoices.length)].key;
}

function getSavedBoolean(key, fallback) {
  try {
    const saved = window.localStorage.getItem(key);
    return saved === null ? fallback : saved === 'true';
  } catch {
    return fallback;
  }
}

function getSavedChoice(key, choices, fallback) {
  try {
    const saved = window.localStorage.getItem(key);
    return choices.some((item) => item.key === saved) ? saved : fallback;
  } catch {
    return fallback;
  }
}

function getSavedNumber(key, fallback, min, max) {
  try {
    const stored = window.localStorage.getItem(key);
    if (stored === null) return fallback;
    const saved = Number(stored);
    return Number.isFinite(saved) ? clamp(saved, min, max) : fallback;
  } catch {
    return fallback;
  }
}

export function AppIcon({ name }) {
  const paths = {
    calendar: <>
      <rect width="64" height="64" rx="13" fill="#f8f8f5" />
      <path d="M0 13C0 6 6 0 13 0h38c7 0 13 6 13 13v8H0Z" fill="#ee654b" />
      <text x="32" y="15" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600">{new Date().toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</text>
      <text x="32" y="54" textAnchor="middle" fill="#242b33" fontSize="35" fontWeight="300">{new Date().getDate()}</text>
    </>,
    store: <path d="m24 13 23 39M39 13 17 51M12 40h28M46 40h7" stroke="#fff" strokeWidth="5" />,
    instagram: <>
      <rect x="14" y="14" width="36" height="36" rx="11" stroke="#fff" strokeWidth="3.5" />
      <circle cx="32" cy="32" r="9" stroke="#fff" strokeWidth="3.5" />
      <circle cx="43" cy="21" r="2.5" fill="#fff" />
    </>,
    guestbook: <path d="M32 11C18 11 8 19 8 30c0 7 4 13 11 16l-3 8 12-5 4 1c14 0 24-8 24-20S46 11 32 11Z" fill="#fff" />,
    admin: <>
      <path d="M27 46h10l2 7H25Z" fill="#aeb7c3" />
      <rect x="20" y="52" width="24" height="3" rx="1.5" fill="#e3e8ed" />
      <rect x="7" y="11" width="50" height="37" rx="4" fill="#dce2e9" />
      <rect x="9" y="13" width="46" height="30" rx="2" fill="#101b32" />
      <rect x="12" y="16" width="23" height="14" rx="1.5" fill="#59b9ff" />
      <rect x="38" y="16" width="14" height="10" rx="1.5" fill="#bf8af4" />
      <rect x="27" y="33" width="25" height="7" rx="1.5" fill="#ff9d54" />
      <rect x="12" y="33" width="12" height="7" rx="1.5" fill="#68d8bf" />
    </>,
    photos: <>
      {['#ffb52c', '#ff8b38', '#f45c68', '#d56ba8', '#9b80ce', '#6aade0', '#65c9b5', '#b5d766'].map((color, index) => (
        <ellipse key={color} cx="32" cy="19" rx="8" ry="13" fill={color} fillOpacity="0.82" transform={`rotate(${index * 45} 32 32)`} />
      ))}
    </>,
    tech: <>
      <path d="M8 16h48M8 24h48M8 32h48M8 40h48M8 48h48M16 8v48M24 8v48M32 8v48M40 8v48M48 8v48" stroke="#fff" strokeOpacity="0.18" strokeWidth="0.7" />
      <rect x="11" y="11" width="42" height="42" rx="3" stroke="#c6efff" strokeOpacity="0.65" />
      <path d="m22 27-7 7 7 7m20-14 7 7-7 7m-7-20-6 29" stroke="#fff" strokeWidth="3.5" />
    </>,
    music: <>
      <path d="M27 20v24.5c0 3.4-3.7 5.7-7.2 5.7-3.1 0-5.3-1.7-5.3-4.3 0-3.1 3.2-5.1 7-5.6l2.5-.4V18.7c0-1.3.5-2 1.8-2.3l19-4.1c1.2-.3 2.2.4 2.2 1.7v26c0 3.5-3.6 5.8-7.2 5.8-3.1 0-5.3-1.7-5.3-4.3 0-3 3.1-5 7-5.6l2.5-.4V20.4l-17 3.7Z" fill="#fff" />
    </>,
    dogs: <g fill="#fff6e9">
      <ellipse cx="16" cy="27" rx="5" ry="7" transform="rotate(-28 16 27)" />
      <ellipse cx="26" cy="18" rx="5" ry="7" transform="rotate(-10 26 18)" />
      <ellipse cx="39" cy="18" rx="5" ry="7" transform="rotate(10 39 18)" />
      <ellipse cx="49" cy="27" rx="5" ry="7" transform="rotate(28 49 27)" />
      <path d="M32 29c-6 0-8 7-13 11-5 4-4 12 3 12 4 0 6-3 10-3s6 3 10 3c7 0 8-8 3-12-5-4-7-11-13-11Z" />
    </g>,
    blog: <>
      <path d="M0 21h64" stroke="#d3a72d" strokeWidth="1" />
      <path d="M0 24h64" stroke="#e1ded5" strokeWidth="1" strokeDasharray="1 2" />
      <path d="M12 33h40M12 42h40M12 51h29" stroke="#c9c7c0" strokeWidth="1.5" />
    </>,
    terminal: <>
      <rect x="5" y="7" width="54" height="50" rx="7" fill="#0d1016" stroke="#a8afb8" strokeWidth="2" />
      <path d="m15 21 10 9-10 9M31 40h15" stroke="#f5f7fa" strokeWidth="3.5" />
    </>,
    settings: <>
      <circle cx="32" cy="32" r="25" fill="#747b86" stroke="#f1f3f6" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="21.5" fill="#343a44" stroke="#aab0ba" strokeWidth="1" />
      <g fill="#d8dce2">
        {Array.from({ length: 12 }, (_, index) => (
          <rect key={index} x="29" y="12" width="6" height="10" rx="1" transform={`rotate(${index * 30} 32 32)`} />
        ))}
        <circle cx="32" cy="32" r="15.5" />
      </g>
      <circle cx="32" cy="32" r="11" fill="#646c78" stroke="#f0f2f5" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="7" fill="#343a44" stroke="#979eaa" strokeWidth="1.5" />
    </>
  };

  return (
    <span className={`device-app-icon device-app-icon--${name}`} aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none" strokeLinecap="round" strokeLinejoin="round" focusable="false">
        {paths[name]}
      </svg>
    </span>
  );
}

function DeviceWindow({ app, state, isRoute, onClose, onMinimize, onMaximize, onFocus, onStartInteraction, onMoveInteraction, onEndInteraction, onKeyboardResize, children }) {
  const contentRef = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    if (isRoute && app.key === 'blog') {
      contentRef.current?.scrollTo(0, 0);
    }
  }, [app.key, isRoute, pathname]);

  const style = state ? {
    '--window-x': `${state.x}px`,
    '--window-y': `${state.y}px`,
    '--window-width': `${state.width}px`,
    '--window-height': `${state.height}px`,
    zIndex: state.z,
    display: state.minimized ? 'none' : undefined
  } : undefined;

  return (
    <section
      className={`device-window${state?.maximized ? ' device-window--maximized' : ''}${app.key === 'photos' ? ' device-window--photos' : ''}`}
      style={style}
      aria-label={`${app.label} app`}
      onPointerDown={() => onFocus(app.key)}
    >
      <header
        className="device-window__titlebar"
        onPointerDown={(event) => onStartInteraction(app.key, 'move', event)}
        onPointerMove={onMoveInteraction}
        onPointerUp={onEndInteraction}
        onLostPointerCapture={onEndInteraction}
        onDoubleClick={() => onMaximize(app.key)}
      >
        <div className="device-window__controls" onPointerDown={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()}>
          <button type="button" className="device-window__control device-window__control--close" aria-label={`Close ${app.label}`} onClick={() => onClose(app.key)} />
          <button type="button" className="device-window__control device-window__control--minimize" aria-label={`Minimize ${app.label}`} onClick={() => onMinimize(app.key)} />
          <button type="button" className="device-window__control device-window__control--maximize" aria-label={`${state?.maximized ? 'Restore' : 'Maximize'} ${app.label}`} onClick={() => onMaximize(app.key)} />
        </div>
        <span className="device-window__title">{app.label}</span>
        <span className="device-window__path">ajt3://{app.key}</span>
      </header>
      <div className={`device-window__content${app.key === 'terminal' ? ' device-window__content--terminal' : ''}`} ref={contentRef}>
        {children}
      </div>
      {resizeCorners.map((corner) => (
        <button
          key={corner.key}
          type="button"
          className={`device-window__resize device-window__resize--${corner.key}`}
          aria-label={`Resize ${app.label} from the ${corner.label} corner. Use arrow keys to adjust size.`}
          onPointerDown={(event) => onStartInteraction(app.key, corner.key, event)}
          onPointerMove={onMoveInteraction}
          onPointerUp={onEndInteraction}
          onLostPointerCapture={onEndInteraction}
          onKeyDown={(event) => onKeyboardResize(app.key, corner.key, event)}
        />
      ))}
    </section>
  );
}

function GuestAccessDialog({ onDismiss, onLogout }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="device-access-dialog"
      role="alertdialog"
      aria-labelledby="device-access-title"
      aria-describedby="device-access-message"
      onCancel={(event) => { event.preventDefault(); onDismiss(); }}
    >
      <span className="device-access-dialog__icon" aria-hidden="true">!</span>
      <h2 id="device-access-title">Administrator access required</h2>
      <p id="device-access-message">You are signed in as Guest. To open Mission Control, you must log out and log in as AJ Thompson, the administrator.</p>
      <div className="device-access-dialog__actions">
        <button type="button" onClick={onDismiss} autoFocus>OK</button>
        <button type="button" onClick={onLogout}>Log out</button>
      </div>
    </dialog>
  );
}

function PhoneLockScreen({ time, date, onUnlock, onSwitchUser }) {
  const screenRef = useRef(null);
  const gestureRef = useRef(null);
  const movedRef = useRef(false);
  const frameRef = useRef(null);
  const animationRef = useRef(null);
  const previewAnimationRef = useRef(null);

  useEffect(() => {
    const device = screenRef.current.parentElement;
    return () => {
      cancelAnimationFrame(frameRef.current);
      animationRef.current?.cancel();
      previewAnimationRef.current?.cancel();
      device.style.removeProperty('--unlock-progress');
      device.style.removeProperty('--unlock-reveal');
      device.classList.remove('device-screen--unlock-dragging');
    };
  }, []);

  const revealProgress = (progress) => clamp((progress - 0.18) / 0.82, 0, 1);

  const paintSwipe = (offset, height) => {
    const progress = Math.min(offset / height, 1);
    screenRef.current.style.setProperty('--unlock-offset', `${offset}px`);
    screenRef.current.parentElement.style.setProperty('--unlock-progress', progress);
    screenRef.current.parentElement.style.setProperty('--unlock-reveal', revealProgress(progress));
  };

  const resetSwipe = () => {
    if (!gestureRef.current) return;
    gestureRef.current = null;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    screenRef.current.classList.remove('device-system-screen--swiping');
    screenRef.current.parentElement.classList.remove('device-screen--unlock-dragging');
    paintSwipe(0, 1);
  };

  const finishSwipe = () => {
    const lock = screenRef.current;
    const { offset, height } = gestureRef.current;
    const sheet = lock.querySelector('.device-system-screen__lock-sheet');
    const preview = lock.parentElement.querySelector('.device-screen__session');
    const progress = Math.min(offset / height, 1);
    const reveal = revealProgress(progress);
    gestureRef.current = null;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    paintSwipe(offset, height);
    if (!sheet.animate || lock.closest('[data-motion="off"]') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onUnlock();
      return;
    }
    const timing = { duration: 280 * (1 - progress), easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', fill: 'forwards' };
    animationRef.current = sheet.animate([
      { opacity: 1 - progress, transform: `translate3d(0, -${offset}px, 0)` },
      { opacity: 0, transform: `translate3d(0, -${height}px, 0)` }
    ], timing);
    previewAnimationRef.current = preview.animate([
      { opacity: reveal, transform: `translate3d(0, ${(1 - reveal) * 24}px, 0) scale(${0.96 + reveal * 0.04})` },
      { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' }
    ], timing);
    animationRef.current.onfinish = onUnlock;
  };

  return (
    <section
      ref={screenRef}
      className="device-system-screen device-system-screen--phone-locked"
      aria-label="Phone locked"
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0 || animationRef.current) return;
        movedRef.current = false;
        if (event.target.closest('.device-system-screen__switch-user')) return;
        gestureRef.current = {
          id: event.pointerId, x: event.clientX, y: event.clientY, axis: null, offset: 0,
          height: event.currentTarget.clientHeight || 600
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
          if (!gesture.axis) {
            gesture.axis = Math.abs(dy) > dx ? 'vertical' : 'horizontal';
            if (gesture.axis === 'vertical') {
              event.currentTarget.classList.add('device-system-screen--swiping');
              event.currentTarget.parentElement.classList.add('device-screen--unlock-dragging');
            }
          }
        }
        if (gesture.axis !== 'vertical') return;
        gesture.offset = clamp(dy, 0, gesture.height);
        if (frameRef.current === null) {
          frameRef.current = requestAnimationFrame(() => {
            frameRef.current = null;
            paintSwipe(gesture.offset, gesture.height);
          });
        }
      }}
      onPointerUp={(event) => {
        const gesture = gestureRef.current;
        if (!gesture || gesture.id !== event.pointerId) return;
        const dy = gesture.y - event.clientY;
        const shouldUnlock = gesture.axis !== 'horizontal' && dy >= 70 && dy > Math.abs(event.clientX - gesture.x);
        if (shouldUnlock) {
          gesture.offset = clamp(dy, 0, gesture.height);
          finishSwipe();
        } else resetSwipe();
      }}
      onPointerCancel={(event) => { if (gestureRef.current?.id === event.pointerId) resetSwipe(); }}
      onLostPointerCapture={(event) => {
        // A child's implicit touch capture can end when this screen takes ownership.
        if (event.target === event.currentTarget && gestureRef.current?.id === event.pointerId) resetSwipe();
      }}
    >
      <span className="device-screen__island" aria-hidden="true" />
      <div className="device-system-screen__lock-sheet">
        <div className="device-system-screen__phone-clock">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="10" width="12" height="11" rx="3" /><path d="M8 10V6a4 4 0 0 1 8 0v4" /></svg>
          <span>{date}</span>
          <time>{time}</time>
          <h1 className="device-system-screen__site-title"><span>AJ's</span> Personal Site</h1>
        </div>
        <div className="device-system-screen__unlock-actions">
          <button type="button" className="device-system-screen__switch-user" onClick={() => { if (!animationRef.current) onSwitchUser(); }}>Switch user</button>
          <button
            type="button"
            className="device-system-screen__swipe-unlock"
            aria-label="Unlock as Guest"
            onClick={(event) => { if (!animationRef.current && (!movedRef.current || event.detail === 0)) onUnlock(); }}
          >
            <span>Swipe up to unlock</span>
            <small>Guest</small>
            <span className="device-system-screen__unlock-indicator" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

function SystemScreen({ state, isPhone, time, date, access, profileImage, onGuestLogin, onPowerOn }) {
  const [selectedAccount, setSelectedAccount] = useState('guest');
  const [showProfiles, setShowProfiles] = useState(false);
  const loginPanelRef = useRef(null);
  usePhoneLoginViewport(loginPanelRef, isPhone && state === 'locked' && showProfiles);

  useEffect(() => {
    if (state !== 'locked') setShowProfiles(false);
  }, [state]);

  if (state === 'running') return null;

  if (state === 'off') {
    return (
      <section className="device-system-screen device-system-screen--off" aria-label="Device is shut down">
        <button type="button" className="device-system-screen__power" onClick={onPowerOn}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2v9M6.2 5.8a8 8 0 1 0 11.6 0" />
          </svg>
          <span>Power on</span>
        </button>
      </section>
    );
  }

  if (state === 'restarting' || state === 'booting') {
    return (
      <section className="device-system-screen device-system-screen--boot" role="status" aria-live="polite">
        <span className="device-system-screen__logo" aria-hidden="true">A/3</span>
        <span className="device-system-screen__spinner" aria-hidden="true" />
        <p>{state === 'restarting' ? 'Restarting' : 'Starting up'}</p>
      </section>
    );
  }

  if (isPhone && !showProfiles) {
    return <PhoneLockScreen time={time} date={date} onUnlock={() => onGuestLogin(true)} onSwitchUser={() => setShowProfiles(true)} />;
  }

  return (
    <section className="device-system-screen device-system-screen--locked" aria-label="Logged out" ref={loginPanelRef}>
      <div className="device-system-screen__clock">
        <time>{time}</time>
        <span>{date}</span>
      </div>
      <form className="device-system-screen__login" onSubmit={(event) => {
        if (selectedAccount === 'admin') access.login(event);
        else { event.preventDefault(); onGuestLogin(); }
      }}>
        <fieldset className="device-system-screen__accounts" disabled={access.isChecking}>
          <legend>Choose your profile</legend>
          {[
            { id: 'admin', name: 'AJ Thompson', role: 'Administrator', avatar: 'A/3' },
            { id: 'guest', name: 'Guest', role: 'Visitor', avatar: 'G' }
          ].map((account) => (
            <label className="device-system-screen__account" key={account.id}>
              <input
                type="radio"
                name="account"
                value={account.id}
                checked={selectedAccount === account.id}
                onChange={() => {
                  access.logout();
                  setSelectedAccount(account.id);
                }}
              />
              <span className="device-system-screen__account-card">
                <span className={`device-system-screen__avatar device-system-screen__avatar--${account.id}`} aria-hidden="true">{account.id === 'admin' && profileImage ? <img src={profileImage} alt="" /> : account.avatar}</span>
                <strong>{account.name}</strong>
                <span className="device-system-screen__account-role">{account.role}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {selectedAccount === 'admin' && <>
          <label htmlFor="device-admin-password">Admin password</label>
          <input
            id="device-admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={access.password}
            disabled={access.isChecking}
            onChange={(event) => access.setPassword(event.target.value)}
            aria-invalid={Boolean(access.error)}
            aria-describedby={access.error ? 'device-login-error' : undefined}
          />
          {!access.isConfigured && <p role="status">Admin sign-in is unavailable until the site connection is configured.</p>}
          {access.error && <p id="device-login-error" role="alert">{access.error}</p>}
        </>}
        <button type="submit" disabled={access.isChecking || (selectedAccount === 'admin' && !access.isConfigured)}>
          {access.isChecking ? 'Verifying access...' : selectedAccount === 'admin' ? 'Log in as AJ Thompson' : 'Log in as Guest'}
        </button>
      </form>
    </section>
  );
}

function DeviceDock({ isPhone, motion, inactive = false, children }) {
  const dockRef = useRef(null);

  useEffect(() => {
    if (isPhone || !motion) return;

    const dock = dockRef.current;
    const media = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const items = Array.from(dock.querySelectorAll('a')).map((element) => ({ element, value: 0, target: 0, width: element.offsetWidth }));
    let frame = null;
    let lastTime = null;

    const animate = (time) => {
      const blend = 1 - Math.exp(-Math.min(lastTime === null ? 16 : time - lastTime, 64) / 70);
      lastTime = time;
      let moving = false;
      items.forEach((item) => {
        item.value += (item.target - item.value) * blend;
        if (Math.abs(item.target - item.value) < 0.001) item.value = item.target;
        else moving = true;
      });

      const expansion = items.reduce((total, item) => total + item.width * 0.48 * item.value, 0);
      let offset = -expansion / 2;
      items.forEach((item) => {
        const extra = item.width * 0.48 * item.value;
        item.element.style.setProperty('--dock-shift', `${offset + extra / 2}px`);
        item.element.style.setProperty('--dock-lift', `${-8 * item.value}px`);
        item.element.style.setProperty('--dock-scale', 1 + 0.48 * item.value);
        offset += extra;
      });
      frame = moving ? window.requestAnimationFrame(animate) : null;
      if (!moving) lastTime = null;
    };

    const update = (x) => {
      items.forEach((item) => {
        // Layout positions stay stable while the icons transform around the pointer.
        const center = item.element.offsetLeft + item.width / 2;
        const distance = x === null ? 1 : Math.min(Math.abs(center - x) / 125, 1);
        item.target = (1 + Math.cos(distance * Math.PI)) / 2;
      });
      if (frame === null) frame = window.requestAnimationFrame(animate);
    };
    const onPointerMove = (event) => {
      if (!media.matches || event.pointerType === 'touch') return;
      update(event.clientX - dock.getBoundingClientRect().left - dock.clientLeft);
    };
    const reset = () => update(null);
    const clear = () => {
      window.cancelAnimationFrame(frame);
      frame = null;
      lastTime = null;
      items.forEach((item) => {
        item.value = 0;
        item.target = 0;
        item.width = item.element.offsetWidth;
        ['--dock-shift', '--dock-lift', '--dock-scale'].forEach((property) => item.element.style.removeProperty(property));
      });
    };

    dock.addEventListener('pointermove', onPointerMove);
    dock.addEventListener('pointerleave', reset);
    dock.addEventListener('pointercancel', reset);
    window.addEventListener('blur', clear);
    window.addEventListener('resize', clear);
    media.addEventListener('change', clear);
    return () => {
      clear();
      dock.removeEventListener('pointermove', onPointerMove);
      dock.removeEventListener('pointerleave', reset);
      dock.removeEventListener('pointercancel', reset);
      window.removeEventListener('blur', clear);
      window.removeEventListener('resize', clear);
      media.removeEventListener('change', clear);
    };
  }, [isPhone, motion]);

  return <nav ref={dockRef} className="device-screen__dock" aria-label="App dock" inert={inactive ? '' : undefined} aria-hidden={inactive ? true : undefined}>{children}</nav>;
}

function DeviceShell({ children, home }) {
  const adminAccess = useAdminAccess();
  const adminProfile = useAdminProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname } = location;
  const screenRef = useRef(null);
  const dragRef = useRef(null);
  const systemTimerRef = useRef(null);
  const redirectRef = useRef(null);
  const nextZRef = useRef(10);
  const [now, setNow] = useState(() => new Date());
  const [viewportIsPhone, setViewportIsPhone] = useState(() => window.matchMedia(phoneMediaQuery).matches);
  const [systemPrefersLight, setSystemPrefersLight] = useState(() => window.matchMedia('(prefers-color-scheme: light)').matches);
  const [windows, setWindows] = useState([]);
  const [wallpaper, setWallpaper] = useState(getSavedWallpaper);
  const [background, setBackground] = useState(getRandomBackground);
  const [appearance, setAppearance] = useState(() => getSavedChoice('ajt3-appearance', appearanceChoices, 'system'));
  const [deviceView, setDeviceView] = useState(() => getSavedChoice('ajt3-device-view', deviceViewChoices, 'auto'));
  const [accent, setAccent] = useState(() => getSavedChoice('ajt3-accent', accentChoices, 'signal'));
  const [wallpaperSpeed, setWallpaperSpeed] = useState(() => getSavedChoice('ajt3-wallpaper-speed', wallpaperSpeedChoices, 'normal'));
  const [wallpaperDim, setWallpaperDim] = useState(() => getSavedNumber('ajt3-wallpaper-dim', 18, 0, 65));
  const [wallpaperIntensity, setWallpaperIntensity] = useState(() => getSavedNumber('ajt3-wallpaper-intensity', 100, 60, 140));
  const [clock24, setClock24] = useState(() => getSavedBoolean('ajt3-clock24', false));
  const [motion, setMotion] = useState(() => getSavedBoolean('ajt3-motion', true));
  const canChooseDeviceView = !viewportIsPhone;
  const isPhone = viewportIsPhone || deviceView === 'mobile';
  const [systemState, setSystemState] = useState(() => isPhone ? 'locked' : 'running');
  const [buildRedirect, setBuildRedirect] = useState(null);
  const isHome = pathname === '/';
  const activeApp = desktopApps.find((app) => pathname === app.path || pathname.startsWith(`${app.path}/`)) || (!isHome ? { key: 'page', label: 'Page', path: pathname } : null);
  const activeKey = activeApp?.key;
  const isAdmin = Boolean(adminAccess.session);
  const accountName = isAdmin ? 'AJ Thompson' : 'Guest';
  const guestDenied = systemState === 'running' && activeKey === 'admin' && !isAdmin;
  const phoneLocked = isPhone && systemState === 'locked';

  const openBuild = (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setBuildRedirect(desktopApps.find((app) => app.key === 'tech').path);
  };

  useEffect(() => {
    if (!buildRedirect) return;
    redirectRef.current?.focus();
    const timer = window.setTimeout(() => window.location.assign(buildRedirect), 2000);
    const restore = (event) => {
      if (event.persisted) setBuildRedirect(null);
    };
    window.addEventListener('pageshow', restore);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pageshow', restore);
    };
  }, [buildRedirect]);

  useEffect(() => {
    if (isAdmin) setSystemState('running');
  }, [isAdmin]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const media = window.matchMedia(phoneMediaQuery);
    const update = () => setViewportIsPhone(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const update = () => setSystemPrefersLight(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => () => window.clearTimeout(systemTimerRef.current), []);

  useEffect(() => {
    const openTerminal = (event) => {
      if (systemState !== 'running' || guestDenied) return;
      const tag = document.activeElement?.tagName;
      if (event.key === '`' && !event.metaKey && !event.ctrlKey && !event.altKey && tag !== 'INPUT' && tag !== 'TEXTAREA' && !document.activeElement?.isContentEditable) {
        event.preventDefault();
        navigate('/terminal');
      }
    };
    document.addEventListener('keydown', openTerminal);
    return () => document.removeEventListener('keydown', openTerminal);
  }, [navigate, systemState, guestDenied]);

  useEffect(() => {
    try {
      window.localStorage.setItem('ajt3-wallpaper', wallpaper);
      window.localStorage.setItem('ajt3-appearance', appearance);
      window.localStorage.setItem('ajt3-device-view', deviceView);
      window.localStorage.setItem('ajt3-accent', accent);
      window.localStorage.setItem('ajt3-wallpaper-speed', wallpaperSpeed);
      window.localStorage.setItem('ajt3-wallpaper-dim', String(wallpaperDim));
      window.localStorage.setItem('ajt3-wallpaper-intensity', String(wallpaperIntensity));
      window.localStorage.setItem('ajt3-clock24', String(clock24));
      window.localStorage.setItem('ajt3-motion', String(motion));
    } catch {
      // Preferences still work for this visit when storage is unavailable.
    }
  }, [wallpaper, appearance, deviceView, accent, wallpaperSpeed, wallpaperDim, wallpaperIntensity, clock24, motion]);

  useEffect(() => {
    if (!activeKey || isPhone || systemState !== 'running' || (activeKey === 'admin' && !isAdmin)) {
      return;
    }

    setWindows((current) => {
      const z = ++nextZRef.current;
      const existing = current.find((item) => item.key === activeKey);
      if (existing) {
        return current.map((item) => item.key === activeKey ? { ...item, minimized: false, z } : item);
      }

      const screenWidth = screenRef.current?.clientWidth || 1000;
      const screenHeight = screenRef.current?.clientHeight || 600;
      const width = Math.min(720, screenWidth - 80);
      const height = Math.min(460, screenHeight - 120);
      const offset = current.length * 28;
      return [...current, {
        key: activeKey,
        x: clamp((screenWidth - width) / 2 + offset, 12, screenWidth - width - 12),
        y: clamp(52 + offset, 38, screenHeight - height - 65),
        width,
        height,
        z,
        minimized: false,
        maximized: false
      }];
    });
  }, [location.key, activeKey, isPhone, systemState, isAdmin]);

  useEffect(() => {
    const screen = screenRef.current;
    if (!screen || !window.ResizeObserver || isPhone) {
      return;
    }

    const observer = new ResizeObserver(() => {
      const screenWidth = screen.clientWidth;
      const screenHeight = screen.clientHeight;
      setWindows((current) => current.map((item) => {
        const width = Math.min(item.width, screenWidth - 24);
        const height = Math.min(item.height, screenHeight - 105);
        return {
          ...item,
          width,
          height,
          x: clamp(item.x, 12, screenWidth - width - 12),
          y: clamp(item.y, 38, screenHeight - height - 65)
        };
      }));
    });
    observer.observe(screen);
    return () => observer.disconnect();
  }, [isPhone]);

  const focusWindow = (key) => {
    setWindows((current) => {
      const windowItem = current.find((item) => item.key === key);
      if (!windowItem || windowItem.z === Math.max(...current.map((item) => item.z))) {
        return current;
      }
      const z = ++nextZRef.current;
      return current.map((item) => item.key === key ? { ...item, z } : item);
    });
  };

  const closeWindow = (key) => {
    const nextApp = windows.filter((item) => item.key !== key && !item.minimized).sort((a, b) => b.z - a.z)[0];
    setWindows((current) => current.filter((item) => item.key !== key));
    if (activeApp?.key === key) {
      navigate(desktopApps.find((app) => app.key === nextApp?.key)?.path || '/');
    }
  };

  const minimizeWindow = (key) => {
    setWindows((current) => current.map((item) => item.key === key ? { ...item, minimized: true } : item));
  };

  const maximizeWindow = (key) => {
    setWindows((current) => current.map((item) => item.key === key ? { ...item, maximized: !item.maximized } : item));
    focusWindow(key);
  };

  const startInteraction = (key, mode, event) => {
    if (isPhone || event.button !== 0) {
      return;
    }
    const item = windows.find((windowItem) => windowItem.key === key);
    if (!item || item.maximized) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { key, mode, x: event.clientX, y: event.clientY, item };
    focusWindow(key);
  };

  const moveInteraction = (event) => {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }
    const screenWidth = screenRef.current?.clientWidth || 1000;
    const screenHeight = screenRef.current?.clientHeight || 600;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    setWindows((current) => current.map((item) => {
      if (item.key !== drag.key) {
        return item;
      }
      if (drag.mode === 'move') {
        return {
          ...item,
          x: clamp(drag.item.x + dx, 12, screenWidth - item.width - 12),
          y: clamp(drag.item.y + dy, 38, screenHeight - item.height - 65)
        };
      }
      return { ...item, ...resizeRect(drag.item, drag.mode, dx, dy, screenWidth, screenHeight) };
    }));
  };

  const endInteraction = () => { dragRef.current = null; };

  const keyboardResize = (key, corner, event) => {
    const sizes = { ArrowRight: [24, 0], ArrowLeft: [-24, 0], ArrowDown: [0, 24], ArrowUp: [0, -24] };
    if (!sizes[event.key]) {
      return;
    }
    event.preventDefault();
    const [dx, dy] = sizes[event.key];
    const screenWidth = screenRef.current?.clientWidth || 1000;
    const screenHeight = screenRef.current?.clientHeight || 600;
    setWindows((current) => current.map((item) => item.key === key && !item.maximized ? {
      ...item,
      ...resizeRect(item, corner, dx, dy, screenWidth, screenHeight)
    } : item));
  };

  const showDesktop = () => {
    setWindows((current) => current.map((item) => ({ ...item, minimized: true })));
  };

  const clearDesktopSession = () => {
    adminAccess.logout();
    window.clearTimeout(systemTimerRef.current);
    setWindows([]);
    nextZRef.current = 10;
    navigate('/');
  };

  const runSystemAction = (action) => {
    clearDesktopSession();
    if (action === 'logout') {
      setSystemState('locked');
      return;
    }
    if (action === 'restart') {
      setSystemState('restarting');
      systemTimerRef.current = window.setTimeout(() => setSystemState('locked'), 1800);
      return;
    }
    setSystemState('off');
  };

  const powerOn = () => {
    window.clearTimeout(systemTimerRef.current);
    setSystemState('booting');
    systemTimerRef.current = window.setTimeout(() => setSystemState('locked'), 1500);
  };

  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: !clock24 });
  const menuDate = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  const lockDate = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  const resolvedAppearance = appearance === 'system' ? (systemPrefersLight ? 'light' : 'dark') : appearance;
  const selectedAccent = accentChoices.find((choice) => choice.key === accent) || accentChoices[0];
  const screenStyle = {
    '--color-main': selectedAccent.main,
    '--color-accent': selectedAccent.accent,
    '--wallpaper-dim': wallpaperDim / 100,
    '--wallpaper-intensity': `${wallpaperIntensity}%`
  };

  return (
    <DeviceSettingsContext.Provider value={{
      isPhone,
      openBuild,
      wallpaper,
      setWallpaper,
      background,
      setBackground,
      appearance,
      setAppearance,
      deviceView,
      setDeviceView,
      canChooseDeviceView,
      accent,
      setAccent,
      wallpaperSpeed,
      setWallpaperSpeed,
      wallpaperDim,
      setWallpaperDim,
      wallpaperIntensity,
      setWallpaperIntensity,
      clock24,
      setClock24,
      motion,
      setMotion,
      accountName,
      adminProfile,
      accountImage: isAdmin ? adminProfile.imageUrl : '',
      adminAccess: { ...adminAccess, logout: () => runSystemAction('logout') },
      runSystemAction
    }}>
    <div data-testid="device-scene" className={`device-scene device-scene--${isPhone ? 'phone' : 'desktop'}`}>
      <SceneBackground background={background} />
      <div className="device-scene__ambient" aria-hidden="true" />
      <div className="device-scene__monitor">
        <div className="device-scene__bezel">
          <div className="device-scene__camera" aria-hidden="true" />
          <div
            className={`device-screen${isHome || guestDenied ? '' : ' device-screen--app'}`}
            data-wallpaper={wallpaper}
            data-wallpaper-speed={wallpaperSpeed}
            data-appearance={resolvedAppearance}
            data-motion={motion ? 'on' : 'off'}
            style={screenStyle}
            ref={screenRef}
            onContextMenu={(event) => {
              if (!isPhone && event.target.closest('.desktop-home') && !event.target.closest('a, button')) {
                event.preventDefault();
                navigate('/settings');
              }
            }}
          >
            <div className="device-screen__wallpaper" aria-hidden="true">
              <span className="device-screen__wallpaper-layer device-screen__wallpaper-layer--one" />
              <span className="device-screen__wallpaper-layer device-screen__wallpaper-layer--two" />
              <span className="device-screen__wallpaper-dim" />
            </div>
            {(systemState === 'running' || phoneLocked) && <div
              className={`device-screen__session${phoneLocked ? ' device-screen__session--locked' : ''}`}
              aria-hidden={phoneLocked || buildRedirect ? true : undefined}
              inert={phoneLocked || buildRedirect ? '' : undefined}
            >
            <header className="device-screen__menu">
              <Link to="/" className="device-screen__brand" aria-label="AJ Thompson desktop home" onClick={showDesktop}>A/3</Link>
              <span className="device-screen__menu-title">{accountName}</span>
              <button type="button" className="device-screen__menu-action" onClick={() => { showDesktop(); navigate('/'); }}>Show desktop</button>
              <Link to="/terminal" className="device-screen__menu-action">Terminal</Link>
              <Link to="/settings" className="device-screen__menu-action">Settings</Link>
              <span className="device-screen__menu-spacer" />
              <span className="device-screen__online"><i /> online</span>
              <time>{menuDate} &nbsp; {time}</time>
            </header>

            <div className="device-screen__phone-status" aria-label={`Phone status, ${time}`}>
              <time>{time}</time>
              <span className="device-screen__island" aria-hidden="true" />
              <span className="device-screen__phone-signals" aria-hidden="true">
                <svg viewBox="0 0 76 16" fill="currentColor" focusable="false">
                  <rect x="0" y="10" width="3" height="4" rx="0.8" />
                  <rect x="5" y="7.5" width="3" height="6.5" rx="0.8" />
                  <rect x="10" y="4.5" width="3" height="9.5" rx="0.8" />
                  <rect x="15" y="1.5" width="3" height="12.5" rx="0.8" />
                  <g fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
                    <path d="M27 5a11.2 11.2 0 0 1 16 0" />
                    <path d="M30 8a7 7 0 0 1 10 0" />
                    <path d="M33 11a2.8 2.8 0 0 1 4 0" />
                  </g>
                  <circle cx="35" cy="13.5" r="1.2" />
                  <rect x="53" y="2" width="20" height="12" rx="3" fill="none" stroke="currentColor" strokeOpacity="0.5" />
                  <rect x="55" y="4" width="14" height="8" rx="1.4" />
                  <path d="M74.5 6v4a2.2 2.2 0 0 0 0-4Z" opacity="0.65" />
                </svg>
              </span>
            </div>

            {isHome ? children : phoneLocked ? home : isPhone && !guestDenied ? null : home}
            {isPhone && !isHome && !phoneLocked && !guestDenied && (
              <div className="device-screen__home-preview" inert="" aria-hidden="true">{home}</div>
            )}

            {isPhone ? (!phoneLocked && !isHome && activeApp && !guestDenied ? (
              <DeviceWindow
                app={activeApp}
                isRoute
                onClose={closeWindow}
                onMinimize={minimizeWindow}
                onMaximize={maximizeWindow}
                onFocus={focusWindow}
                onStartInteraction={startInteraction}
                onMoveInteraction={moveInteraction}
                onEndInteraction={endInteraction}
                onKeyboardResize={keyboardResize}
              >
                {children}
              </DeviceWindow>
            ) : null) : windows.filter((item) => (item.key !== 'admin' || isAdmin) && (!item.minimized || item.key === 'admin')).map((item) => {
              const app = desktopApps.find((entry) => entry.key === item.key) || { key: 'page', label: 'Page' };
              const Page = appPages[item.key];
              const isRoute = activeApp?.key === item.key && !isHome;
              return (
                <DeviceWindow
                  key={item.key}
                  app={app}
                  state={item}
                  isRoute={isRoute}
                  onClose={closeWindow}
                  onMinimize={minimizeWindow}
                  onMaximize={maximizeWindow}
                  onFocus={focusWindow}
                  onStartInteraction={startInteraction}
                  onMoveInteraction={moveInteraction}
                  onEndInteraction={endInteraction}
                  onKeyboardResize={keyboardResize}
                >
                  {item.key === 'page' || (item.key === 'blog' && isRoute && pathname.startsWith('/blog/')) ? children : Page ? <Page /> : null}
                </DeviceWindow>
              );
            })}

            <DeviceDock isPhone={isPhone} motion={motion} inactive={isPhone && !isHome}>
              {!isPhone && <>
              <Link className={`device-screen__dock-home${isHome ? ' device-screen__dock-home--active' : ''}`} to="/" aria-label="Show desktop" onClick={showDesktop}>A/3</Link>
              <span className="device-screen__dock-divider" aria-hidden="true" />
              </>}
              {(isPhone ? phoneDockApps : desktopApps).map((app) => (
                <Link key={app.key} to={app.path} onClick={app.key === 'tech' ? openBuild : undefined} reloadDocument={app.external} target={app.external ? '_blank' : undefined} rel={app.external ? 'noopener noreferrer' : undefined} className={`device-screen__dock-app${app.utility ? ' device-screen__dock-app--utility' : ''}${windows.some((item) => item.key === app.key) || activeApp?.key === app.key ? ' device-screen__dock-app--active' : ''}`} aria-label={`Open ${app.label}`} title={app.label}>
                  <AppIcon name={app.key} />
                  <span className="device-screen__dock-label">{app.label}</span>
                </Link>
              ))}
            </DeviceDock>
            {isPhone ? <PhoneHomeIndicator
              key={pathname}
              screenRef={screenRef}
              hasApp={!isHome && !guestDenied}
              motion={motion}
              onHome={() => { showDesktop(); navigate('/'); }}
            /> : <Link className="device-screen__home-indicator" to="/" aria-label="Return to phone home screen" onClick={showDesktop} />}
            </div>}
            {guestDenied && <GuestAccessDialog onDismiss={() => navigate('/', { replace: true })} onLogout={() => runSystemAction('logout')} />}
            <SystemScreen
              state={systemState}
              isPhone={isPhone}
              time={time}
              date={lockDate}
              access={adminAccess}
              profileImage={adminProfile.imageUrl}
              onGuestLogin={(preserveRoute = false) => { adminAccess.logout(); if (!preserveRoute) navigate('/'); setSystemState('running'); }}
              onPowerOn={powerOn}
            />
            {buildRedirect && (
              <section className="device-system-screen device-system-screen--redirect" aria-labelledby="build-redirect-title">
                <AppIcon name="tech" />
                <h1 id="build-redirect-title" ref={redirectRef} tabIndex={-1}>
                  Redirecting to <span>{new URL(buildRedirect).hostname}...</span>
                </h1>
                <p>You're leaving AJ's Personal Site.</p>
                <a href={buildRedirect}>Continue now</a>
              </section>
            )}
          </div>
          <div className="device-scene__chin"><span>AJT3</span></div>
        </div>
        <div className="device-scene__stand" aria-hidden="true" />
        <div className="device-scene__foot" aria-hidden="true" />
      </div>
    </div>
    </DeviceSettingsContext.Provider>
  );
}

export default DeviceShell;
