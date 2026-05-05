import React, { useEffect, useState } from 'react';
import VideoSection from '../components/VideoSection';
import BlogPostCard from '../components/BlogPostCard';
import { getBlogPostsByTag } from '../data/blogPosts';
import './Dogs.css';

function Dogs() {
  const [dogPosts, setDogPosts] = useState([]);

  useEffect(() => {
    let isMounted = true;

    getBlogPostsByTag('dogs').then((posts) => {
      if (isMounted) {
        setDogPosts(posts);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <VideoSection
        src={"video-dog.mov"}
        type={'type/mov'}
        header={"Drake and Josh"}
        message={"Meet the pups!"}
      />
      <section className="dogs-posts">
        <div className="dogs-posts__intro">
          <p className="dogs-posts__eyebrow">Drake and Josh / Posts</p>
          <h2 className="dogs-posts__heading">Stories from the dog side of the site</h2>
          <p className="dogs-posts__copy">
            These entries use the same blog system as the main blog page, filtered here for everything that belongs in
            the Drake and Josh orbit.
          </p>
        </div>
        <div className="dogs-posts__grid">
          {dogPosts.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </>
  );
}

export default Dogs;
