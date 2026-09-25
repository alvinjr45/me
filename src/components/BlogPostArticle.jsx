import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './BlogPostArticle.css';

function BlogPostArticle({ post, embedded = false, onBack, backLabel = 'Blogs' }) {
  const [lightboxImage, setLightboxImage] = useState(null);
  const isNote = embedded || !post.tags?.includes('dogs');
  const Container = embedded ? 'section' : 'main';

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
    <Container className={`blog-post-page${embedded ? ' blog-post-page--embedded' : ' app-view'}${isNote ? ' blog-post-page--note' : ''}`} aria-label="Article reader">
      <nav className="app-toolbar" aria-label="Article navigation">
        {embedded ? <>
          <button type="button" className="blog-post-page__back" onClick={onBack}><span aria-hidden="true">&lsaquo;</span> {backLabel}</button>
          <span className="blog-post-page__notebook">{post.eyebrow || 'Blogs'}</span>
          <Link to={`/blog/${post.slug}`} className="blog-post-page__open" aria-label={`Open ${post.title} blog`}>Open blog <span aria-hidden="true">&nearr;</span></Link>
        </> : <><Link to={post.tags?.includes('dogs') ? '/dogs' : '/blog'} className="app-control">
          <span aria-hidden="true">&larr;</span> {post.tags?.includes('dogs') ? 'Dogs' : 'All blogs'}
        </Link>
        <span>{post.date}</span></>}
      </nav>
      <div className="app-scroll" key={post.slug}>
      <article className="blog-post-page__article">
        {isNote ? <p className="blog-post-page__note-date">{post.date}</p> : null}
        <header className="blog-post-page__hero">
          <div className="blog-post-page__hero-copy">
            <p className="blog-post-page__eyebrow">{post.eyebrow}</p>
            <h1 tabIndex={embedded ? -1 : undefined}>{post.title}</h1>
            <p className="blog-post-page__meta">{post.date}</p>
            <p className="blog-post-page__excerpt">{post.excerpt}</p>
          </div>
          {post.image ? <div className="blog-post-page__image-wrap">
            <button
              type="button"
              className="blog-post-page__image-button"
              onClick={() => openLightbox(post.image, post.imageAlt || post.title, post.title)}
              aria-label={`Enlarge ${post.title} image`}
            >
              <img src={post.image} alt={post.imageAlt || post.title} className="blog-post-page__image" />
            </button>
          </div> : null}
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

      </article>
      </div>

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
    </Container>
  );
}

export default BlogPostArticle;
