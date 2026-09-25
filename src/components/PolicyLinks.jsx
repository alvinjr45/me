import React from 'react';
import './PolicyLinks.css';

export default function PolicyLinks() {
  return <span className="policy-links">
    <a href="/terms" target="_blank" rel="noopener noreferrer">Terms and Conditions<span className="sr-only"> (opens in a new tab)</span></a>
    <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy<span className="sr-only"> (opens in a new tab)</span></a>
  </span>;
}
