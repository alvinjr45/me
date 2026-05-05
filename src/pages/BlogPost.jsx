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
      <main className="blog-post-page">
        <article className="blog-post-page__article">
          <section className="blog-post-page__content">
            <h1>Loading post</h1>
          </section>
        </article>
      </main>
    );
  }

  if (status === 'error' || !post) {
    return (
      <main className="blog-post-page">
        <article className="blog-post-page__article">
          <section className="blog-post-page__content">
            <h1>{status === 'error' ? 'Post unavailable' : 'Post not found'}</h1>
            <p>{status === 'error' ? error : 'The blog entry you requested does not exist.'}</p>
            <p>
              <Link to="/blog">Back to /blog</Link>
            </p>
          </section>
        </article>
      </main>
    );
  }

  return <BlogPostArticle post={post} />;
}

export default BlogPost;
