import React, { useEffect, useState } from 'react';
import BlogPostCard from '../components/BlogPostCard';
import HomeLink from '../components/HomeLink';
import { getBlogPosts } from '../data/blogPosts';
import './Blog.css';

function Blog() {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    getBlogPosts()
      .then((nextPosts) => {
        if (!isMounted) {
          return;
        }

        setPosts(nextPosts.filter((post) => !post.tags.includes('dogs')));
        setStatus('ready');
      })
      .catch((nextError) => {
        if (!isMounted) {
          return;
        }

        setError(nextError.message || 'Unable to load blog posts.');
        setStatus('error');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const [featuredPost, ...archivePosts] = posts;

  return (
    <main className="blog-page">
      <section className="blog-page__hero" aria-labelledby="blog-page-title">
        <div className="blog-page__hero-copy">
          <p className="blog-page__eyebrow">AJT3 Journal</p>
          <h1 id="blog-page-title" className="blog-page__heading">
            <span>.blog</span>
            <span className="blog-page__heading-call">()</span>
          </h1>
          <p className="blog-page__subtitle">
            Field notes on code, product ideas, experiments, music, and the parts of life that keep the build moving.
          </p>
          <div className="blog-page__hero-actions">
            <HomeLink className="home-link--compact">Home</HomeLink>
            <a className="blog-page__primary-link" href="#latest-post">
              Read latest
            </a>
            <span>{status === 'loading' ? 'Loading entries' : `${posts.length} entries live`}</span>
          </div>
        </div>
        <aside className="blog-page__terminal" aria-label="Blog status">
          <div className="blog-page__terminal-bar" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <dl className="blog-page__terminal-list">
            <div>
              <dt>Status</dt>
              <dd>Publishing</dd>
            </div>
            <div>
              <dt>Latest</dt>
              <dd>{featuredPost?.date}</dd>
            </div>
            <div>
              <dt>Focus</dt>
              <dd>Build logs, design notes, daily systems</dd>
            </div>
          </dl>
        </aside>
      </section>

      {status === 'error' ? <p className="blog-page__notice">{error}</p> : null}

      {featuredPost ? (
        <section id="latest-post" className="blog-page__featured" aria-label="Latest blog post">
          <div className="blog-page__section-heading">
            <p>Latest Dispatch</p>
            <h2>Start here</h2>
          </div>
          <BlogPostCard post={featuredPost} featured />
        </section>
      ) : null}

      <section className="blog-page__archive" aria-label="Blog archive">
        <div className="blog-page__section-heading">
          <p>Archive</p>
          <h2>More notes</h2>
        </div>
        <div className="blog-page__grid">
          {archivePosts.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </main>
  );
}

export default Blog;
