import React, { useEffect, useState } from 'react';
import BlogPostCard from '../components/BlogPostCard';
import {
  formatIncidentCount,
  formatIncidentDate,
  getDaysSinceIncident,
  getLatestDogIncident
} from '../data/dogIncident';
import { getBlogPostsByTag } from '../data/blogPosts';
import './Dogs.css';

const dogs = [
  { name: 'Drake', role: 'Head of security', image: '/images/dogs/drake.jpg' },
  { name: 'Josh', role: 'Chaos operations', image: '/images/dogs/josh.jpg' }
];

function Dogs() {
  const [dogPosts, setDogPosts] = useState([]);
  const [incident, setIncident] = useState(null);

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([getBlogPostsByTag('dogs'), getLatestDogIncident()]).then(([postsResult, incidentResult]) => {
      if (!isMounted) {
        return;
      }

      if (postsResult.status === 'fulfilled') {
        setDogPosts(postsResult.value);
      }

      if (incidentResult.status === 'fulfilled') {
        setIncident(incidentResult.value);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const incidentDays = incident ? getDaysSinceIncident(incident.incidentAt) : null;

  return (
    <main className="dogs-page app-view app-view--scroll" aria-label="Dogs">
      <section className="dogs-page__profiles" aria-label="Drake and Josh">
        <div className="dogs-page__portraits">
          {dogs.map((dog, index) => (
            <figure key={dog.name} className={`dogs-page__portrait dogs-page__portrait--${index + 1}`}>
              <img src={dog.image} alt={`${dog.name} portrait`} />
              <figcaption>
                <span>0{index + 1}</span>
                <div><strong>{dog.name}</strong><small>{dog.role}</small></div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="dogs-page__incident" aria-labelledby="incident-title">
        <div className="dogs-page__incident-heading">
          <h2 id="incident-title">Days since last incident</h2>
        </div>
        <strong className="dogs-page__incident-count">{incidentDays === null ? '--' : incidentDays}</strong>
        <div className="dogs-page__incident-detail">
          {incident ? (
            <>
              <span>{incident.culprit} / {formatIncidentDate(incident.incidentAt)}</span>
              <p>{incident.incident}</p>
              {formatIncidentCount(incident.incidentCount) ? <small>{formatIncidentCount(incident.incidentCount)}</small> : null}
            </>
          ) : (
            <><span>STATUS / ALL CLEAR</span><p>No incident has been filed yet. Suspicious.</p></>
          )}
        </div>
      </section>

      <section className="dogs-page__logs" aria-labelledby="dog-logs-title">
        <h2 id="dog-logs-title">Incident notes</h2>
        <div className="dogs-page__post-grid">
          {dogPosts.map((post) => <BlogPostCard key={post.slug} post={post} />)}
        </div>
      </section>
    </main>
  );
}

export default Dogs;
