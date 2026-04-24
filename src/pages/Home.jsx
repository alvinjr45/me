import React from 'react';
import { Link } from 'react-router-dom';
import LetterGlitch from '../components/LetterGlitch';
import './Home.css';

const homeGlitchColors = ['#fb7f33', '#33affb', '#f9f9f9'];
const WEBSITE_URL = 'http://localhost:5173';
const homeHighlights = [
  {
    title: '.blog( )',
    copy: 'Fresh logs, build notes, and longer-form posts from the AJT3 side of the internet.',
    to: '/blog'
  },
  {
    title: '.drakeAndJosh( )',
    copy: 'The full page for the two main characters, with their own lane on the site.',
    to: '/dogs'
  },
  {
    title: '.music( )',
    copy: 'A dedicated page for tracks, player embeds, and the part of the site that lives closest to the keys.',
    to: '/music'
  }
];

function Home() {
  return (
    <main className="home-hero" role="main">
      <div className="home-hero__background" aria-hidden="true">
        <LetterGlitch
          className="home-hero__glitch"
          glitchColors={homeGlitchColors}
          glitchSpeed={45}
          centerVignette={true}
          outerVignette={true}
          smooth={true}
        />
      </div>
      <div className="home-hero__overlay"></div>
      <div className="home-hero__content">
        <p className="home-hero__eyebrow">AJT3.Me</p>
        <h1 className="home-hero__heading">.me( )</h1>
        <p className="home-hero__subtitle">
          I’m A.J., a 27-year-old software developer who loves reviewing the latest tech, trying new things,
          and channeling piano energy into every project. If you like playful experimentation with a
          dash of Drake &amp; Josh nostalgia, you’ve landed in the right orbit.
        </p>
      </div>
      <section className="home-hero__highlights" aria-label="Featured pages">
        {homeHighlights.map((highlight) => (
          <Link key={highlight.title} className="home-hero__highlight-card" to={highlight.to}>
            <p className="home-hero__highlight-kicker">Featured</p>
            <h2>{highlight.title}</h2>
            <p>{highlight.copy}</p>
          </Link>
        ))}
        <a className="home-hero__highlight-card home-hero__highlight-card--build" href={WEBSITE_URL}>
          <p className="home-hero__highlight-kicker">Widget</p>
          <h2>.build( )</h2>
          <p>Got a tech idea you want to build? Lets get creative!</p>
        </a>
      </section>
    </main>
  );
}

export default Home;
