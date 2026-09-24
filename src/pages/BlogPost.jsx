import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BlogPostArticle from '../components/BlogPostArticle';
import { getBlogPostBySlug } from '../data/blogPosts';
import '../components/BlogPostArticle.css';

function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    getBlogPostBySlug(slug)
      .then((nextPost) => {
        if (!isMounted) {
          return;
        }

        setPost(nextPost || null);
        setStatus(nextPost ? 'ready' : 'not-found');
      })
      .catch((nextError) => {
        if (!isMounted) {
          return;
        }

        setError(nextError.message || 'Unable to load this blog entry.');
        setStatus('error');
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (status === 'loading') {
    return (
      <main className="blog-post-page app-view" aria-label="Article reader">
        <nav className="app-toolbar" aria-label="Article navigation"><Link className="app-control" to="/blog">All entries</Link></nav>
        <p className="app-empty" role="status">Loading entry...</p>
      </main>
    );
  }

  if (status === 'error' || !post) {
    return (
      <main className="blog-post-page app-view" aria-label="Article reader">
        <nav className="app-toolbar" aria-label="Article navigation"><Link className="app-control" to="/blog">All entries</Link></nav>
        <p className="app-empty" role="alert">{status === 'error' ? error : 'Entry not found.'}</p>
      </main>
    );
  }

  return <BlogPostArticle post={post} />;
}

export default BlogPost;
