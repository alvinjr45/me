import React from 'react';
import { Link } from 'react-router-dom';
import './BlogPostArticle.css';

function BlogPostArticle({ post }) {
  return (
    <main className="blog-post-page">
      <article className="blog-post-page__article">
        <header className="blog-post-page__hero">
          <div className="blog-post-page__image-wrap">
            <img src={post.image} alt={post.title} className="blog-post-page__image" />
          </div>
          <div className="blog-post-page__hero-copy">
            <p className="blog-post-page__eyebrow">{post.eyebrow}</p>
            <h1>{post.title}</h1>
            <p className="blog-post-page__meta">{post.date}</p>
            <p className="blog-post-page__excerpt">{post.excerpt}</p>
          </div>
        </header>

        <div className="blog-post-page__content">
          {post.sections.map((section) => (
            <section key={section.heading} className="blog-post-page__section">
              <h2>{section.heading}</h2>
              {section.paragraphs
                ? section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
                : null}
              {section.bullets ? (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <footer className="blog-post-page__footer">
          <Link to="/blog">Back to /blog</Link>
        </footer>
      </article>
    </main>
  );
}

export default BlogPostArticle;
