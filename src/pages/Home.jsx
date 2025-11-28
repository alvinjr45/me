import React from 'react';
import { Link } from 'react-router-dom';
import heroTexture from '../assets/313eb4ad-e70a-471b-862f-65725a8dde06-Picsart-BackgroundRemover.png';
import './Home.css';

const funFacts = [
  '27 years young and counting',
  'Software developer by day, everything else by night',
  'North Carolina State University — B.S. Computer Science under College of Engineering',
  'Piano every single day keeps the code blues away',
  'Obsessed with testing new tech and writing up honest takes'
];

function Home() {
  return (
    <main className="home-hero" role="main" style={{ '--home-texture': `url(${heroTexture})` }}>
      <div className="home-hero__overlay"></div>
      <div className="home-hero__content">
        <p className="home-hero__eyebrow">AJT3.Me</p>
        <h1 className="home-hero__heading">.me( )</h1>
        <p className="home-hero__subtitle">
          I’m A.J., a 27-year-old software developer who loves reviewing the latest tech, trying new things,
          and channeling piano energy into every project. If you like playful experimentation with a
          dash of Drake &amp; Josh nostalgia, you’ve landed in the right orbit.
        </p>
        <div className="home-hero__actions">
          <Link className="home-hero__button home-hero__button--primary" to="/dogs">
            Meet Drake &amp; Josh
          </Link>
          <Link className="home-hero__button home-hero__button--outline" to="/techstuff">
            Explore Tech Stuff
          </Link>
        </div>
      </div>
      <section className="home-hero__info">
          <div className="home-hero__info-card">
            <h2>Why AJT3?</h2>
          <p>
            Software by day, everything else by night. NC State engineering grad with a passion for every emerging
            gadget, every sticker-worthy idea, and daily piano runs that keep the imagination in tune with the code.
          </p>
        </div>
        <div className="home-hero__info-card home-hero__info-card--accent">
          <h3>Fun facts</h3>
          <ul>
            {funFacts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

export default Home;
