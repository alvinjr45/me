import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Tech.css';

const focusAreas = [
  {
    index: '01',
    title: 'Product engineering',
    copy: 'Turning ambiguous ideas into useful, resilient software with a sharp eye on the people using it.'
  },
  {
    index: '02',
    title: 'Creative systems',
    copy: 'Exploring the overlap between code, design, automation, and the tools that make an idea feel inevitable.'
  },
  {
    index: '03',
    title: 'Continuous experiments',
    copy: 'Prototypes, hardware, AI, and whatever else is interesting enough to deserve a late-night build.'
  }
];

function Tech() {
  const [selectedIndex, setSelectedIndex] = useState('01');
  const selected = focusAreas.find((area) => area.index === selectedIndex);

  return (
    <main className="tech-page app-view" aria-label="Tech">
      <nav className="app-toolbar" aria-label="Tech actions">
        <a href="https://ajt3.website" target="_blank" rel="noreferrer" className="app-control">AJT3.website <span aria-hidden="true">&nearr;</span></a>
        <Link to="/blog" className="app-control">Build notes</Link>
      </nav>
      <div className="tech-page__workspace">
        <nav className="tech-page__sidebar" aria-label="Areas of focus">
          {focusAreas.map((area) => (
            <button key={area.index} type="button" aria-pressed={selectedIndex === area.index}
              aria-controls="tech-detail" onClick={() => setSelectedIndex(area.index)}>
              <span>{area.index}</span>{area.title}
            </button>
          ))}
        </nav>
        <section className="tech-page__detail app-scroll" id="tech-detail" aria-label={selected.title}>
          <h2>{selected.title}</h2>
          <p>{selected.copy}</p>
          <img src="/images/tech-week-24.jpg" alt="AJ Thompson at a technology event" />
        </section>
      </div>
    </main>
  );
}

export default Tech;
