// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dogs from './pages/Dogs';
import TechStuff from './pages/TechStuff';
import Music from './pages/Music';
import ContactMe from './pages/ContactMe';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/Footer';
import './App.css'; // Optional: For global styles

function App() {


  return (
    <div >
      <Router>
        <div className="App" >
          <ScrollToTop />
          <Navbar />
          <Routes>
            <Route path="/" exact element={<Home />} />
            <Route path="/dogs" element={<Dogs />} />
            <Route path="/techstuff" element={<TechStuff />} />
            <Route path="/music" element={<Music />} />
            <Route path="/contactme" element={<ContactMe />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </div>
  );
}

export default App;
