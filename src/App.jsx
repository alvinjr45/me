// src/App.js
import React from 'react';
import { MemoryRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Tech from './pages/Tech';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import MissionControl from './pages/MissionControl';
import Dogs from './pages/Dogs';
import Music from './pages/Music';
import Photos from './pages/Photos';
import Calendar from './pages/Calendar';
import Guestbook from './pages/Guestbook';
import Policy from './pages/Policy';
import Terminal from './pages/Terminal';
import Settings from './pages/Settings';
import AppStore from './pages/AppStore';
import NotFound from './pages/NotFound';
import DeviceShell from './components/DeviceShell';
import './App.css';

function AppShell() {
  const entryScrollY = React.useRef(window.scrollY);

  React.useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add('device-page');
    document.body.classList.add('device-page');

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const useSceneEntry = isIOS
      && window.matchMedia('(max-width: 1024px), (max-height: 500px)').matches
      && !window.matchMedia('(display-mode: standalone)').matches
      && !navigator.standalone;
    let frame;
    let cancelled = false;
    const cancelEntry = () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
    const enterScene = () => {
      frame = window.requestAnimationFrame(() => {
        if (cancelled || entryScrollY.current > 0) return;
        const offset = parseFloat(window.getComputedStyle(root).getPropertyValue('--device-scene-entry-offset'));
        if (offset > 0) window.scrollTo({ top: offset, left: 0, behavior: 'instant' });
      });
    };

    if (useSceneEntry) {
      // Scroll decorative content beneath Safari's status bar without moving the phone.
      root.classList.add('device-page--scene-entry');
      if (document.readyState === 'complete') enterScene();
      else window.addEventListener('load', enterScene, { once: true });
      ['pointerdown', 'wheel', 'keydown'].forEach((event) => {
        window.addEventListener(event, cancelEntry, { once: true, passive: true });
      });
    }

    return () => {
      cancelEntry();
      window.removeEventListener('load', enterScene);
      ['pointerdown', 'wheel', 'keydown'].forEach((event) => window.removeEventListener(event, cancelEntry));
      root.classList.remove('device-page', 'device-page--scene-entry');
      document.body.classList.remove('device-page');
    };
  }, []);
  const routes = (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/tech" element={<Tech />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/admin/*" element={<MissionControl />} />
      <Route path="/dogs" element={<Dogs />} />
      <Route path="/music" element={<Music />} />
      <Route path="/photos" element={<Photos />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/guestbook" element={<Guestbook />} />
      <Route path="/terms" element={<Policy />} />
      <Route path="/privacy" element={<Policy privacy />} />
      <Route path="/terminal" element={<Terminal />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/app-store" element={<AppStore />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );

  return (
    <div className="App App--device">
      <DeviceShell home={<Home />}>{routes}</DeviceShell>
    </div>
  );
}

function App() {
  const [initialEntry] = React.useState(() => (
    window.location.pathname + window.location.search + window.location.hash
  ));

  React.useEffect(() => {
    // Keep the entry link inside the emulator while the browser stays at home.
    window.history.replaceState(window.history.state, '', '/');
  }, []);

  return (
    <Router initialEntries={[initialEntry]}>
      <AppShell />
    </Router>
  );
}

export default App;
