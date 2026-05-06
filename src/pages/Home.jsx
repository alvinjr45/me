import React from 'react';
import { Link } from 'react-router-dom';
import LetterGlitch from '../components/LetterGlitch';
import './Home.css';

const homeGlitchColors = ['#fb7f33', '#33affb', '#f9f9f9'];
const WEBSITE_URL = 'https://ajt3.website';
const homeHighlights = [
  {
    title: '.blog( )',
    label: 'Build notes and longer-form posts',
    copy: 'Fresh logs from the AJT3 side of the internet.',
    to: '/blog'
  },
  {
    title: '.music( )',
    label: 'Tracks, embeds, and piano energy',
    copy: 'The part of the site that lives closest to the keys.',
    to: '/music'
  },
  {
    title: '.drakeAndJosh( )',
    label: 'A page for the two main characters',
    copy: 'Their own lane on the site.',
    to: '/dogs'
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
          I’m A.J., a software developer who reviews tech, builds experiments, and channels piano energy into
          every project.
        </p>
      </div>
      <section className="home-hero__highlights" aria-label="Featured pages">
        {homeHighlights.map((highlight) => (
          <Link key={highlight.title} className="home-hero__highlight-card" to={highlight.to}>
            <div>
              <p className="home-hero__highlight-kicker">Featured</p>
              <h2>{highlight.title}</h2>
            </div>
            <p className="home-hero__highlight-label">{highlight.label}</p>
            <p className="home-hero__highlight-copy">{highlight.copy}</p>
          </Link>
        ))}
        <a className="home-hero__highlight-card home-hero__highlight-card--build" href={WEBSITE_URL}>
          <div>
            <p className="home-hero__highlight-kicker">Widget</p>
            <h2>.build( )</h2>
          </div>
          <p className="home-hero__highlight-label">Bring a tech idea to life</p>
          <p className="home-hero__highlight-copy">Lets get creative.</p>
        </a>
      </section>
    </main>
  );
}

export default Home;
