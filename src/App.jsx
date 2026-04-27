// src/App.js
import React from 'react';
import { BrowserRouter as Router, Link, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Dogs from './pages/Dogs';
import Music from './pages/Music';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/Footer';
import './App.css'; // Optional: For global styles

function AppShell() {
  const location = useLocation();
  const showHomeReturn = location.pathname !== '/';

  return (
    <div >
      <div className="App" >
        <ScrollToTop />
        {showHomeReturn ? (
          <Link to="/" className="home-return" aria-label="Return to home">
            &lt;&lt; return home
          </Link>
        ) : null}
        <Routes>
          <Route path="/" exact element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/dogs" element={<Dogs />} />
          <Route path="/music" element={<Music />} />
        </Routes>
        <Footer />
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;