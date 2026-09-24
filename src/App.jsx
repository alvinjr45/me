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
import Terminal from './pages/Terminal';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import DeviceShell from './components/DeviceShell';
import './App.css';

function AppShell() {
  React.useEffect(() => {
    document.body.classList.add('device-page');
    return () => document.body.classList.remove('device-page');
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
      <Route path="/terminal" element={<Terminal />} />
      <Route path="/settings" element={<Settings />} />
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
