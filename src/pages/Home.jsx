import React from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LetterGlitch from '../components/LetterGlitch';
import { defaultDogIncident, formatIncidentDate, getDaysSinceIncident, getLatestDogIncident } from '../data/dogIncident';
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
  },
  {
    title: '.build( )',
    label: 'Bring a tech idea to life',
    copy: "Let's get creative.",
    to: WEBSITE_URL,
    external: true
  }
];

function Home() {
  const [dogIncident, setDogIncident] = useState(null);
  const [isContentReady, setIsContentReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getLatestDogIncident()
      .then((incident) => {
        if (isMounted) {
          setDogIncident(incident);
          setIsContentReady(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setDogIncident(defaultDogIncident);
          setIsContentReady(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const incident = dogIncident || defaultDogIncident;
  const incidentDays = dogIncident ? getDaysSinceIncident(incident.incidentAt) : null;
  const incidentDate = dogIncident ? formatIncidentDate(incident.incidentAt) : '';

  return (
    <main className={`home-page${isContentReady ? ' home-page--ready' : ''}`} role="main" aria-busy={!isContentReady}>
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
      {isContentReady ? (
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

          <section className="home-page__incident" aria-label="Latest dog incident">
            <Link className="home-page__incident-card" to="/dogs" aria-label="Open the Drake and Josh page">
              <p className="home-page__incident-kicker">Days since last incident</p>
              <div className="home-page__incident-copy">
                <h2 className="home-page__incident-days">
                  {incidentDays === null ? '—' : incidentDays}
                  <span>days</span>
                </h2>
                <div className="home-page__incident-meta">
                  <span>{incidentDate}</span>
                </div>
                <p className="home-page__incident-label">{incident.culprit}</p>
                <p className="home-page__incident-text">{incident.incident}</p>
              </div>
              <figure className="home-page__incident-portrait">
                <img src={incident.portraitUrl} alt={incident.portraitAlt || `${incident.culprit} portrait`} />
                <figcaption>{incident.culprit} did it.</figcaption>
              </figure>
            </Link>
          </section>

          <section className="home-page__highlights" aria-label="Featured pages">
            {homeHighlights.map((highlight) => {
              const cardContent = (
                <>
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
      ) : null}
    </main>
  );
}

export default Home;
