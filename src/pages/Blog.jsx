import React from 'react';
import BlogPostCard from '../components/BlogPostCard';
import { getBlogPosts } from '../data/blogPosts';
import './Blog.css';

function Blog() {
  const posts = getBlogPosts();

  return (
    <main className="blog-page">
      <section className="blog-page__hero">
        <h1 className="blog-page__heading">.blog()</h1>
        <p className="blog-page__subtitle">
          Notes from the lab. This is the new home for logs, build updates, and longer thoughts worth keeping.
        </p>
      </section>
      <section className="blog-page__grid">
        {posts.map((post) => (
          <BlogPostCard key={post.slug} post={post} />
        ))}
      </section>
    </main>
  );
}

export default Blog;
