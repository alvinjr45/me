import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './BlogPostArticle.css';

function BlogPostArticle({ post }) {
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    if (!lightboxImage) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setLightboxImage(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('blog-post-page--modal-open');

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('blog-post-page--modal-open');
    };
  }, [lightboxImage]);

  const openLightbox = (src, alt, caption) => {
    setLightboxImage({ src, alt, caption });
  };

  return (
    <main className="blog-post-page">
      <article className="blog-post-page__article">
        <header className="blog-post-page__hero">
          <div className="blog-post-page__hero-copy">
            <p className="blog-post-page__eyebrow">{post.eyebrow}</p>
            <h1>{post.title}</h1>
            <p className="blog-post-page__meta">{post.date}</p>
            <p className="blog-post-page__excerpt">{post.excerpt}</p>
          </div>
          <div className="blog-post-page__image-wrap">
            <button
              type="button"
              className="blog-post-page__image-button"
              onClick={() => openLightbox(post.image, post.imageAlt || post.title, post.title)}
              aria-label={`Enlarge ${post.title} image`}
            >
              <img src={post.image} alt={post.imageAlt || post.title} className="blog-post-page__image" />
            </button>
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
                  <button
                    type="button"
                    className="blog-post-page__image-button blog-post-page__image-button--media"
                    onClick={() => openLightbox(item.src, item.alt || post.title, item.caption || item.alt || post.title)}
                    aria-label={`Enlarge ${item.alt || post.title}`}
                  >
                    <img src={item.src} alt={item.alt || ''} />
                  </button>
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

      {lightboxImage ? (
        <div
          className="blog-post-page__lightbox"
          role="presentation"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="blog-post-page__lightbox-panel"
            role="dialog"
            aria-modal="true"
            aria-label={lightboxImage.alt}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="blog-post-page__lightbox-close"
              onClick={() => setLightboxImage(null)}
              aria-label="Close enlarged image"
            >
              Close
            </button>
            <img src={lightboxImage.src} alt={lightboxImage.alt} className="blog-post-page__lightbox-image" />
            {lightboxImage.caption ? <p className="blog-post-page__lightbox-caption">{lightboxImage.caption}</p> : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default BlogPostArticle;
