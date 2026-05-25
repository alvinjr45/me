import React from 'react';
import { Link } from 'react-router-dom';
import './HomeLink.css';

function HomeLink({ className = '', children = 'Home' }) {
  return (
    <Link className={`home-link${className ? ` ${className}` : ''}`} to="/">
      {children}
    </Link>
  );
}

export default HomeLink;
