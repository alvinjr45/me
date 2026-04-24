import React from 'react';
import { Link } from 'react-router-dom';
import './BlogPostCard.css';

function BlogPostCard({ post, featured = false }) {
  return (
    <article className={`blog-post-card${featured ? ' blog-post-card--featured' : ''}`}>
      <Link className="blog-post-card__media" to={`/blog/${post.slug}`}>
        <img src={post.image} alt={post.title} />
      </Link>
      <div className="blog-post-card__body">
        <p className="blog-post-card__eyebrow">{post.eyebrow}</p>
        <h2>
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>
        <p className="blog-post-card__meta">{post.date}</p>
        <p className="blog-post-card__excerpt">{post.excerpt}</p>
        <Link className="blog-post-card__read-link" to={`/blog/${post.slug}`}>
          Read entry
        </Link>
      </div>
    </article>
  );
}

export default BlogPostCard;
