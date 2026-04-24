import React from 'react';
import './Blog.css';

const blogEntries = [
  {
    title: 'Logbook',
    copy: 'A running feed of experiments, product notes, design decisions, and whatever else survives the draft folder.'
  },
  {
    title: 'What Lives Here',
    copy: 'Build notes, gear thoughts, site updates, and longer-form writeups that do not fit cleanly into a social post.'
  },
  {
    title: 'Status',
    copy: 'The page is live now. The first proper entries come next.'
  }
];

function Blog() {
  return (
    <main className="blog-page">
      <section className="blog-page__hero">
        <p className="blog-page__eyebrow">AJT3.Me / Blog</p>
        <h1 className="blog-page__heading">/blog</h1>
        <p className="blog-page__subtitle">
          Notes from the lab. This is the new home for logs, build updates, and longer thoughts worth keeping.
        </p>
      </section>
      <section className="blog-page__grid">
        {blogEntries.map((entry) => (
          <article key={entry.title} className="blog-page__card">
            <h2>{entry.title}</h2>
            <p>{entry.copy}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default Blog;
