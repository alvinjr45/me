import React from 'react';
import { Link } from 'react-router-dom';
import './BlogPostArticle.css';

function BlogPostArticle({ post }) {
  return (
    <main className="blog-post-page">
      <article className="blog-post-page__article">
        <header className="blog-post-page__hero">
          <div className="blog-post-page__image-wrap">
            <img src={post.image} alt={post.imageAlt || post.title} className="blog-post-page__image" />
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

        {post.media?.length ? (
          <section className="blog-post-page__media" aria-label="Post media">
            {post.media.map((item) => (
              <figure key={`${item.src}-${item.caption || item.alt || item.type}`} className="blog-post-page__media-item">
                {item.type === 'video' ? (
                  <video controls src={item.src} poster={item.poster || undefined} />
                ) : (
                  <img src={item.src} alt={item.alt || ''} />
                )}
                {item.caption ? <figcaption>{item.caption}</figcaption> : null}
              </figure>
            ))}
          </section>
        ) : null}

        <footer className="blog-post-page__footer">
          <Link to="/blog">Back to /blog</Link>
        </footer>
      </article>
    </main>
  );
}

export default BlogPostArticle;
