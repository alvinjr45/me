import React, { useContext, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppIcon, desktopApps } from '../components/DeviceShell';
import { DeviceSettingsContext } from '../components/deviceSettings';
import './Home.css';

function Home() {
  const { isPhone = false, openBuild } = useContext(DeviceSettingsContext) || {};
  const appsRef = useRef(null);
  const [pageSize, setPageSize] = useState(desktopApps.length);
  const [activePage, setActivePage] = useState(0);
  const appsPerPage = isPhone ? pageSize : desktopApps.length;
  const pages = Array.from({ length: Math.ceil(desktopApps.length / appsPerPage) }, (_, index) => (
    desktopApps.slice(index * appsPerPage, (index + 1) * appsPerPage)
  ));

  useLayoutEffect(() => {
    if (!isPhone) return;
    const container = appsRef.current;
    const measure = () => {
      const styles = window.getComputedStyle(container);
      const columns = Number(styles.getPropertyValue('--app-columns')) || 4;
      const rowHeight = parseFloat(styles.getPropertyValue('--app-row-height')) || 104;
      const gap = parseFloat(styles.getPropertyValue('--app-row-gap')) || 16;
      const rows = Math.max(1, Math.floor((container.clientHeight + gap) / (rowHeight + gap)));
      setPageSize(columns * rows);
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(container);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [isPhone]);

  useLayoutEffect(() => {
    appsRef.current.scrollLeft = 0;
    setActivePage(0);
  }, [isPhone, pageSize]);

  const showPage = (index) => {
    const container = appsRef.current;
    const page = Math.max(0, Math.min(index, pages.length - 1));
    container.scrollTo({ left: page * container.clientWidth });
  };

  return (
    <main className="desktop-home">
      <h1 className={isPhone ? 'sr-only' : 'desktop-home__title'}>
        <span>AJ's </span><span>Personal Site</span>
      </h1>
      <nav
        className="desktop-home__apps"
        aria-label="Open a site app"
        ref={appsRef}
        onScroll={(event) => {
          const container = event.currentTarget;
          if (isPhone && container.clientWidth) {
            setActivePage(Math.max(0, Math.min(pages.length - 1, Math.round(container.scrollLeft / container.clientWidth))));
          }
        }}
        onKeyDown={(event) => {
          if (!isPhone || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
          event.preventDefault();
          const page = Math.max(0, Math.min(activePage + (event.key === 'ArrowRight' ? 1 : -1), pages.length - 1));
          showPage(page);
          appsRef.current.children[page]?.querySelector('a')?.focus({ preventScroll: true });
        }}
      >
        {pages.map((apps, index) => (
          <div className="desktop-home__page" key={index} role={isPhone ? 'group' : undefined} aria-label={isPhone ? `App page ${index + 1} of ${pages.length}` : undefined}>
            {apps.map((app) => (
              <Link key={app.key} to={app.path} onClick={app.key === 'tech' ? openBuild : undefined} reloadDocument={app.external} target={app.external ? '_blank' : undefined} rel={app.external ? 'noopener noreferrer' : undefined} className={`desktop-home__app desktop-home__app--${app.key}`}>
                <AppIcon name={app.key} />
                <span className="desktop-home__app-label">{app.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
      {isPhone && pages.length > 1 && (
        <nav className="desktop-home__pagination" aria-label="Home screen pages">
          {pages.map((_, index) => (
            <button key={index} type="button" aria-label={`Show app page ${index + 1}`} aria-current={activePage === index ? 'page' : undefined} onClick={() => showPage(index)} />
          ))}
        </nav>
      )}
    </main>
  );
}

export default Home;
