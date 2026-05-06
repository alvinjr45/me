// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Admin from './pages/Admin';
import Dogs from './pages/Dogs';
import Music from './pages/Music';
import NotFound from './pages/NotFound';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/Footer';
import './App.css'; // Optional: For global styles

function AppShell() {
  return (
    <div >
      <div className="App" >
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/dogs" element={<Dogs />} />
          <Route path="/music" element={<Music />} />
          <Route path="*" element={<NotFound />} />
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
