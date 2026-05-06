import React from 'react';
import { Link } from 'react-router-dom';
import LetterGlitch from '../components/LetterGlitch';
import './NotFound.css';

const glitchColors = ['#fb7f33', '#33affb', '#f9f9f9'];

function NotFound() {
  return (
    <main className="not-found-page" role="main">
      <div className="not-found-page__background" aria-hidden="true">
        <LetterGlitch
          className="not-found-page__glitch"
          glitchColors={glitchColors}
          glitchSpeed={52}
          centerVignette={true}
          outerVignette={true}
          smooth={true}
        />
      </div>
      <div className="not-found-page__overlay" aria-hidden="true"></div>
      <section className="not-found-page__content" aria-labelledby="not-found-title">
        <p className="not-found-page__eyebrow">404</p>
        <h1 id="not-found-title">.missing( )</h1>
        <p className="not-found-page__copy">
          This page slipped out of the route table.
        </p>
        <Link className="not-found-page__link" to="/">
          Return home
        </Link>
      </section>
    </main>
  );
}

export default NotFound;
