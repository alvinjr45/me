import React from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LetterGlitch from '../components/LetterGlitch';
import {
  formatIncidentDate,
  formatIncidentCount,
  getDaysSinceIncident,
  getLatestDogIncident
} from '../data/dogIncident';
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
  const [incidentPortraitFailed, setIncidentPortraitFailed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function loadIncident() {
      try {
        const incident = await getLatestDogIncident();

        if (isMounted) {
          setDogIncident(incident);
          setIncidentPortraitFailed(false);
        }
      } catch {
        if (isMounted) {
          setDogIncident(null);
          setIncidentPortraitFailed(false);
        }
      } finally {
        if (isMounted) {
          setIsContentReady(true);
        }
      }
    }

    loadIncident();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const secret = ['a', 'd', 'm', 'i', 'n'];
    let buffer = '';
    let timeoutId = null;

    function resetBuffer() {
      buffer = '';
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    }

    function handleKeyDown(event) {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key.length !== 1) {
        return;
      }

      buffer = `${buffer}${key}`.slice(-secret.length);

      if (buffer === secret.join('')) {
        resetBuffer();
        navigate('/admin');
        return;
      }

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(resetBuffer, 1500);
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [navigate]);

  useEffect(() => {
    async function refreshIncidentIfVisible() {
      if (document.visibilityState !== 'visible') {
        return;
      }

      try {
        const incident = await getLatestDogIncident();
        setDogIncident(incident);
        setIncidentPortraitFailed(false);
      } catch {
        setDogIncident(null);
        setIncidentPortraitFailed(false);
      }
    }

    function handleStorage(event) {
      if (event.key === 'ajt3_dog_incident_updated_at') {
        void refreshIncidentIfVisible();
      }
    }

    function handleFocus() {
      void refreshIncidentIfVisible();
    }

    document.addEventListener('visibilitychange', refreshIncidentIfVisible);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', refreshIncidentIfVisible);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const incidentDays = dogIncident ? getDaysSinceIncident(dogIncident.incidentAt) : null;
  const incidentDate = dogIncident ? formatIncidentDate(dogIncident.incidentAt) : '';
  const incidentCountText = dogIncident ? formatIncidentCount(dogIncident.incidentCount) : '';
  const hasIncident = Boolean(dogIncident);

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
              <h1 className="home-page__heading">.me( )</h1>
              <p className="home-page__lede">Me and all the things I've built</p>
              <p className="home-page__subcopy">
                Someone asked me why I love software development. The truth is because its never been all that hard.
                I think software development loves me.
              </p>
            </div>
          </section>

          <section className="home-page__incident" aria-label="Latest dog incident">
            {hasIncident ? (
              <Link className="home-page__incident-card" to="/dogs" aria-label="Open the Drake and Josh page">
                <p className="home-page__incident-kicker">Days since last incident</p>
                <div className="home-page__incident-copy">
                  <h2 className="home-page__incident-days">
                    {incidentDays === null ? '—' : incidentDays}
                    <span>days</span>
                  </h2>
                  <div className="home-page__incident-meta">
                    <span>{incidentDate}</span>
                    {incidentCountText ? <span>{incidentCountText}</span> : null}
                  </div>
                  <p className="home-page__incident-label">{dogIncident.culprit}</p>
                  <p className="home-page__incident-text">{dogIncident.incident}</p>
                </div>
                <figure className="home-page__incident-portrait">
                  {!incidentPortraitFailed && dogIncident.portraitUrl ? (
                    <img
                      src={dogIncident.portraitUrl}
                      alt={dogIncident.portraitAlt || `${dogIncident.culprit} portrait`}
                      onError={() => setIncidentPortraitFailed(true)}
                    />
                  ) : (
                    <div
                      className="home-page__incident-portrait-fallback"
                      role="img"
                      aria-label={`${dogIncident.culprit || 'Dog'} portrait unavailable`}
                    >
                      <span>{dogIncident.culprit || 'Dog'}</span>
                    </div>
                  )}
                  <figcaption>{dogIncident.culprit} did it.</figcaption>
                </figure>
              </Link>
            ) : (
              <div className="home-page__incident-card home-page__incident-card--empty" aria-live="polite">
                <p className="home-page__incident-kicker">Days since last incident</p>
                <div className="home-page__incident-empty">
                  <p className="home-page__incident-empty-title">No incident data seeded yet.</p>
                  <p className="home-page__incident-empty-copy">
                    Add the latest incident in admin to populate this widget.
                  </p>
                </div>
              </div>
            )}
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
