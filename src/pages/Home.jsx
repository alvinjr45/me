import React from 'react';
import { Link } from 'react-router-dom';
import { AppIcon, desktopApps } from '../components/DeviceShell';
import './Home.css';

function Home() {
  return (
    <main className="desktop-home">
      <h1 className="sr-only">AJ Thompson</h1>
      <nav className="desktop-home__apps" aria-label="Open a site app">
        {desktopApps.map((app) => (
          <Link key={app.key} to={app.path} className={`desktop-home__app desktop-home__app--${app.key}`}>
            <AppIcon name={app.key} />
            <span className="desktop-home__app-label">{app.label}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}

export default Home;
