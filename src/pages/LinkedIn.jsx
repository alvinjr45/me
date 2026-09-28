import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { DeviceSettingsContext } from '../components/deviceSettings';
import './LinkedIn.css';

const experience = [
  {
    marker: 'PE',
    title: 'Product engineering',
    meta: 'Current focus',
    copy: 'Turning ambiguous ideas into useful, resilient software with a sharp eye on the people using it.'
  },
  {
    marker: 'CS',
    title: 'Creative systems',
    meta: 'Ongoing practice',
    copy: 'Exploring the overlap between code, design, automation, and the tools that make an idea feel inevitable.'
  },
  {
    marker: 'CX',
    title: 'Continuous experiments',
    meta: 'Always in progress',
    copy: 'Prototypes, hardware, AI, and whatever else is interesting enough to deserve a late-night build.'
  }
];

const skills = ['React', 'JavaScript', 'Product engineering', 'UI systems', 'Prototyping', 'Automation', 'AI', 'Creative technology'];

function ProfileIcon({ name }) {
  const paths = {
    search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    network: <><circle cx="8" cy="7" r="3" /><circle cx="17" cy="6" r="2" /><path d="M2 20c0-5 2-8 6-8s6 3 6 8M14 12c4 0 6 3 6 7" /></>,
    work: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V4h8v3m-13 5h18M10 12v2h4v-2" /></>,
    message: <path d="M4 4h16v12H9l-5 4Z" />,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v6H5V6h6" /></>,
    pin: <><path d="M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12Z" /><circle cx="12" cy="9" r="2" /></>,
    link: <><path d="m9 15 6-6" /><path d="M7 17H5a4 4 0 0 1 0-8h3M17 7h2a4 4 0 0 1 0 8h-3" /></>
  };

  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}

function LinkedIn() {
  const settings = useContext(DeviceSettingsContext);
  const profileImage = settings?.adminProfile?.imageUrl || settings?.accountImage || '';

  return (
    <main className="linkedin-page app-view" aria-label="AJ Thompson professional profile">
      <header className="linkedin-bar">
        <Link to="/" className="linkedin-bar__mark" aria-label="Return to desktop">in</Link>
        <label className="linkedin-search">
          <ProfileIcon name="search" />
          <input type="search" aria-label="Search profile" placeholder="Search AJ's profile" />
        </label>
        <nav className="linkedin-nav" aria-label="Profile navigation">
          <a href="#profile-top"><ProfileIcon name="home" /><span>Profile</span></a>
          <a href="#experience"><ProfileIcon name="work" /><span>Experience</span></a>
          <a href="#projects"><ProfileIcon name="network" /><span>Projects</span></a>
        </nav>
        <span className="linkedin-bar__avatar" aria-label="AJ Thompson">AJ</span>
      </header>

      <div className="linkedin-scroll app-scroll" id="profile-top">
        <div className="linkedin-layout">
          <div className="linkedin-primary">
            <section className="linkedin-card linkedin-profile" aria-labelledby="linkedin-name">
              <div className="linkedin-profile__cover" aria-hidden="true"><span>A/3</span><i /></div>
              <div className="linkedin-profile__body">
                <div className="linkedin-profile__photo">
                  <img
                    className={profileImage ? 'linkedin-profile__photo-image--account' : undefined}
                    src={profileImage || '/images/Home Banner.png'}
                    alt="AJ Thompson"
                  />
                </div>
                <p className="linkedin-profile__status"><i aria-hidden="true" /> Open to professional conversations</p>
                <h1 id="linkedin-name">AJ Thompson <span aria-label="Profile verified">&#10003;</span></h1>
                <p className="linkedin-profile__headline">Product engineer building useful systems at the intersection of code, design, and automation.</p>
                <p className="linkedin-profile__meta"><ProfileIcon name="pin" /> Product engineering · Creative systems · Automation</p>
                <div className="linkedin-profile__actions">
                  <a className="linkedin-button linkedin-button--primary" href="https://ajt3.website" target="_blank" rel="noreferrer">View portfolio <ProfileIcon name="external" /></a>
                  <Link className="linkedin-button" to="/blog"><ProfileIcon name="work" /> Read build notes</Link>
                </div>
              </div>
            </section>

            <section className="linkedin-card linkedin-section" aria-labelledby="linkedin-about">
              <h2 id="linkedin-about">About</h2>
              <p>I build digital products that balance practical engineering with a strong point of view. My work lives where software, design, automation, and experimentation overlap—and where a thoughtful detail can turn a working idea into something people want to use.</p>
              <p>This profile brings together selected work, core capabilities, and a record of the product-building process.</p>
            </section>

            <section className="linkedin-card linkedin-section" id="experience" aria-labelledby="linkedin-experience">
              <h2 id="linkedin-experience">Experience</h2>
              <div className="linkedin-experience">
                {experience.map((item) => (
                  <article key={item.marker}>
                    <span className="linkedin-experience__mark" aria-hidden="true">{item.marker}</span>
                    <div>
                      <h3>{item.title}</h3>
                      <p className="linkedin-experience__meta">Independent practice · {item.meta}</p>
                      <p>{item.copy}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="linkedin-card linkedin-section" id="projects" aria-labelledby="linkedin-projects">
              <div className="linkedin-section__heading">
                <div><p>SELECTED WORK</p><h2 id="linkedin-projects">Featured projects</h2></div>
                <a href="https://ajt3.website" target="_blank" rel="noreferrer">See all <ProfileIcon name="external" /></a>
              </div>
              <div className="linkedin-projects">
                <a href="https://ajt3.website" target="_blank" rel="noreferrer">
                  <span className="linkedin-projects__visual linkedin-projects__visual--build" aria-hidden="true">&lt;/&gt;</span>
                  <span><strong>AJT3.website</strong><small>Projects, prototypes, and experiments.</small></span>
                </a>
                <Link to="/blog">
                  <span className="linkedin-projects__visual linkedin-projects__visual--notes" aria-hidden="true">//</span>
                  <span><strong>Build notes</strong><small>A running log of decisions and ideas.</small></span>
                </Link>
              </div>
            </section>

            <section className="linkedin-card linkedin-section" aria-labelledby="linkedin-skills">
              <h2 id="linkedin-skills">Skills</h2>
              <div className="linkedin-skills">
                {skills.map((skill) => <span key={skill}>{skill}</span>)}
              </div>
            </section>
          </div>

          <aside className="linkedin-secondary" aria-label="Profile details">
            <section className="linkedin-card linkedin-snapshot">
              <p>PROFILE SNAPSHOT</p>
              <dl>
                <div><dt>Focus</dt><dd>Product engineering</dd></div>
                <div><dt>Mode</dt><dd>Always building</dd></div>
                <div><dt>Based on</dt><dd>Curiosity + iteration</dd></div>
              </dl>
            </section>
            <section className="linkedin-card linkedin-contact">
              <h2>Professional links</h2>
              <a href="https://ajt3.website" target="_blank" rel="noreferrer"><ProfileIcon name="link" /><span><strong>Portfolio</strong><small>ajt3.website</small></span></a>
              <Link to="/blog"><ProfileIcon name="work" /><span><strong>Build notes</strong><small>Process, decisions, and ideas</small></span></Link>
            </section>
            <section className="linkedin-card linkedin-open-to">
              <span aria-hidden="true">OPEN TO</span>
              <h2>Interesting problems and thoughtful collaborations.</h2>
              <a href="https://ajt3.website" target="_blank" rel="noreferrer">View professional work <span aria-hidden="true">&nearr;</span></a>
            </section>
          </aside>
        </div>
        <footer className="linkedin-footer">A LinkedIn-inspired resume · Built inside AJ's personal system.</footer>
      </div>
    </main>
  );
}

export default LinkedIn;
