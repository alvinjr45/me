import React, { useEffect, useState } from 'react';
import VideoSection from '../components/VideoSection';
import BlogPostCard from '../components/BlogPostCard';
import HomeLink from '../components/HomeLink';
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
      <section className="dogs-posts" aria-labelledby="dogs-posts-title">
        <div className="dogs-posts__header">
          <h2 id="dogs-posts-title" className="dogs-posts__title">Dog Blogs</h2>
          <HomeLink className="home-link--compact">Home</HomeLink>
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
