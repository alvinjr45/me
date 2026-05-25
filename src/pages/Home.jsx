import React from 'react';
import { Link } from 'react-router-dom';
import LetterGlitch from '../components/LetterGlitch';
import './Home.css';

const homeGlitchColors = ['#fb7f33', '#33affb', '#f9f9f9'];
const WEBSITE_URL = 'https://ajt3.website';
const homeHighlights = [
  {
    index: '01',
    title: '.blog( )',
    label: 'Build notes and longer-form posts',
    copy: 'Fresh logs from the AJT3 side of the internet.',
    to: '/blog'
  },
  {
    index: '02',
    title: '.music( )',
    label: 'Tracks, embeds, and piano energy',
    copy: 'The part of the site that lives closest to the keys.',
    to: '/music'
  },
  {
    index: '03',
    title: '.drakeAndJosh( )',
    label: 'A page for the two main characters',
    copy: 'Their own lane on the site.',
    to: '/dogs'
  },
  {
    index: '04',
    title: '.build( )',
    label: 'Bring a tech idea to life',
    copy: "Let's get creative.",
    to: WEBSITE_URL,
    external: true
  }
];

function Home() {
  return (
    <main className="home-page" role="main">
      <div className="home-page__background" aria-hidden="true">
        <LetterGlitch
          className="home-page__glitch"
          glitchColors={homeGlitchColors}
          glitchSpeed={45}
          centerVignette={true}
          outerVignette={true}
          smooth={true}
        />
      </div>
      <div className="home-page__overlay" />
      <div className="home-page__frame">
        <section className="home-page__hero">
          <div className="home-page__hero-copy">
            <p className="home-page__eyebrow">AJT3 / portfolio interface</p>
            <h1 className="home-page__heading">.me()</h1>
            <p className="home-page__lede">Me and all the things I've built</p>
            <p className="home-page__subcopy">
              A layered collection of code, sound, reviews, and experiments, presented with cleaner structure and a
              sharper edge.
            </p>
          </div>
        </section>

        <section className="home-page__highlights" aria-label="Featured pages">
          {homeHighlights.map((highlight) => {
            const cardContent = (
              <>
                <div className="home-page__highlight-top">
                  <span className="home-page__highlight-index">{highlight.index}</span>
                  <span className="home-page__highlight-type">
                    {highlight.external ? 'Widget' : 'Featured'}
                  </span>
                </div>
                <div className="home-page__highlight-body">
                  <h2>{highlight.title}</h2>
                  <p className="home-page__highlight-label">{highlight.label}</p>
                  <p className="home-page__highlight-copy">{highlight.copy}</p>
                </div>
                <span className="home-page__highlight-action">
                  {highlight.external ? 'Open site' : 'Explore page'}
                </span>
              </>
            );

            if (highlight.external) {
              return (
                <a
                  key={highlight.title}
                  className="home-page__highlight-card home-page__highlight-card--build"
                  href={highlight.to}
                  target="_blank"
                  rel="noreferrer"
                >
                  {cardContent}
                </a>
              );
            }

            return (
              <Link key={highlight.title} className="home-page__highlight-card" to={highlight.to}>
                {cardContent}
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}

export default Home;
