import React, { useContext, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppIcon, desktopApps } from '../components/DeviceShell';
import { DeviceSettingsContext } from '../components/deviceSettings';
import './Home.css';

const MAX_APPS_PER_PAGE = 12;

function Home() {
  const { isPhone = false, motion = true, openExternalApp, installedApps = [], installProgress = {}, pendingInstall } = useContext(DeviceSettingsContext) || {};
  const appsRef = useRef(null);
  const pageSwipeRef = useRef(null);
  const suppressClickRef = useRef(false);
  const builtInApps = desktopApps.filter((app) => !app.downloadable);
  const downloadedKeys = [...installedApps, ...Object.keys(installProgress), pendingInstall?.key]
    .filter((key, index, keys) => key && keys.indexOf(key) === index);
  const downloadedApps = downloadedKeys
    .map((key) => desktopApps.find((app) => app.key === key && app.downloadable))
    .filter(Boolean);
  const pendingInstallPhase = pendingInstall?.phase;
  const homeApps = [...builtInApps, ...downloadedApps];
  const [activePage, setActivePage] = useState(0);
  const pages = Array.from({ length: Math.ceil(homeApps.length / MAX_APPS_PER_PAGE) }, (_, index) => (
    homeApps.slice(index * MAX_APPS_PER_PAGE, (index + 1) * MAX_APPS_PER_PAGE)
  ));

  useLayoutEffect(() => {
    appsRef.current.scrollLeft = 0;
    setActivePage(0);
  }, [isPhone]);

  useLayoutEffect(() => {
    if (isPhone || downloadedApps.length === 0) return;
    const lastPage = pages.length - 1;
    setActivePage(lastPage);
    appsRef.current?.scrollTo({ left: lastPage * appsRef.current.clientWidth });
  }, [downloadedApps.length, isPhone, pages.length]);

  useLayoutEffect(() => {
    if (!pendingInstallPhase || !appsRef.current || (isPhone && pendingInstallPhase !== 'paging')) return;
    const lastPage = pages.length - 1;
    setActivePage(lastPage);
    appsRef.current.scrollTo({ left: lastPage * appsRef.current.clientWidth, behavior: motion ? 'smooth' : 'auto' });
  }, [isPhone, motion, pages.length, pendingInstallPhase]);

  const showPage = (index) => {
    const container = appsRef.current;
    const page = Math.max(0, Math.min(index, pages.length - 1));
    setActivePage(page);
    container.scrollTo({ left: page * container.clientWidth, behavior: !isPhone && motion ? 'smooth' : 'auto' });
  };

  const startPageSwipe = (event) => {
    if (isPhone || event.pointerType === 'touch' || pages.length < 2 || (event.button !== undefined && event.button !== 0)) return;
    pageSwipeRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      scrollLeft: appsRef.current.scrollLeft,
      moved: false
    };
  };

  const movePageSwipe = (event) => {
    const swipe = pageSwipeRef.current;
    if (!swipe || event.pointerId !== swipe.pointerId) return;
    const dx = event.clientX - swipe.x;
    const dy = event.clientY - swipe.y;
    if (!swipe.moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      swipe.moved = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      event.currentTarget.classList.add('desktop-home--swiping');
    }
    if (swipe.moved) {
      event.preventDefault();
      appsRef.current.scrollLeft = swipe.scrollLeft - dx;
    }
  };

  const finishPageSwipe = (event) => {
    const swipe = pageSwipeRef.current;
    if (!swipe || event.pointerId !== swipe.pointerId) return;
    pageSwipeRef.current = null;
    event.currentTarget.classList.remove('desktop-home--swiping');
    if (!swipe.moved) return;

    const dx = event.clientX - swipe.x;
    const dy = event.clientY - swipe.y;
    const threshold = Math.max(44, (appsRef.current?.clientWidth || 0) * 0.12);
    suppressClickRef.current = true;
    window.setTimeout(() => { suppressClickRef.current = false; }, 0);
    if (Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy)) {
      showPage(activePage + (dx < 0 ? 1 : -1));
    } else {
      showPage(activePage);
    }
  };

  const cancelPageSwipe = (event) => {
    const swipe = pageSwipeRef.current;
    if (!swipe || event.pointerId !== swipe.pointerId) return;
    pageSwipeRef.current = null;
    event.currentTarget.classList.remove('desktop-home--swiping');
    showPage(activePage);
  };

  return (
    <main
      className={`desktop-home${!isPhone && pages.length > 1 ? ' desktop-home--paged' : ''}`}
      onPointerDown={startPageSwipe}
      onPointerMove={movePageSwipe}
      onPointerUp={finishPageSwipe}
      onPointerCancel={cancelPageSwipe}
      onClickCapture={(event) => {
        if (!suppressClickRef.current) return;
        event.preventDefault();
        event.stopPropagation();
        suppressClickRef.current = false;
      }}
    >
      <h1 className={isPhone ? 'sr-only' : 'desktop-home__title'}>
        <span>AJ's </span><span>Personal Site</span>
      </h1>
      <div className="desktop-home__apps-panel">
        <nav
          className="desktop-home__apps"
          aria-label="Open a site app"
          ref={appsRef}
          onScroll={(event) => {
            const container = event.currentTarget;
            if (!pageSwipeRef.current && container.clientWidth) {
              setActivePage(Math.max(0, Math.min(pages.length - 1, Math.round(container.scrollLeft / container.clientWidth))));
            }
          }}
          onKeyDown={(event) => {
            if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || pages.length < 2) return;
            event.preventDefault();
            const page = Math.max(0, Math.min(activePage + (event.key === 'ArrowRight' ? 1 : -1), pages.length - 1));
            showPage(page);
            if (isPhone) appsRef.current.children[page]?.querySelector('a')?.focus({ preventScroll: true });
          }}
        >
          {pages.map((apps, index) => (
            <div
              className="desktop-home__page"
              key={index}
              role="group"
              aria-label={`App page ${index + 1} of ${pages.length}`}
              aria-hidden={!isPhone && activePage !== index ? true : undefined}
              inert={!isPhone && activePage !== index ? '' : undefined}
            >
              {apps.map((app) => Object.prototype.hasOwnProperty.call(installProgress, app.key) ? (
                <div key={app.key} className={`desktop-home__app desktop-home__app--${app.key} desktop-home__app--installing`} role="status" aria-label={`${app.label} downloading, ${installProgress[app.key]}%`}>
                  <AppIcon name={app.key} />
                  <span className="desktop-home__install-progress" style={{ '--install-progress': `${installProgress[app.key] * 3.6}deg` }} aria-hidden="true" />
                  <span className="desktop-home__app-label">Loading...</span>
                </div>
              ) : pendingInstall?.key === app.key ? (
                <div key={app.key} className={`desktop-home__app desktop-home__app--${app.key} desktop-home__app--queued`} role="status" aria-label={`${app.label} waiting to download`}>
                  <AppIcon name={app.key} />
                  <span className="desktop-home__app-label">Waiting...</span>
                </div>
              ) : (
                <Link key={app.key} to={app.path} onClick={app.external ? (event) => openExternalApp?.(app.key, event) : undefined} reloadDocument={app.external} target={app.external ? '_blank' : undefined} rel={app.external ? 'noopener noreferrer' : undefined} className={`desktop-home__app desktop-home__app--${app.key}`}>
                  <AppIcon name={app.key} />
                  <span className="desktop-home__app-label">{app.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
        {pages.length > 1 && (
          <nav className="desktop-home__pagination" aria-label="Home screen pages">
            {pages.map((_, index) => (
              <button key={index} type="button" aria-label={`Show app page ${index + 1}`} aria-current={activePage === index ? 'page' : undefined} onClick={() => showPage(index)} />
            ))}
          </nav>
        )}
      </div>
    </main>
  );
}

export default Home;
