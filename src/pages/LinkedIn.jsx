import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { DeviceSettingsContext } from '../components/deviceSettings';
import './LinkedIn.css';

const experience = [
  {
    marker: 'IBM',
    title: 'API Connect End-to-End Automation',
    meta: 'Software · 2021–Present',
    current: true,
    highlights: [
      'Python automation for installs, upgrades, and end-to-end API Connect flows, running 700–1,000 tests nightly through Jenkins.',
      'Build AI-assisted workflows with IBM Bob, including Jira and TestRail MCP servers for issue and test management.'
    ],
    platforms: ['Kubernetes', 'OpenShift', 'VMware', 'Cloud Pak for Integration', 'AWS']
  },
  {
    marker: 'Fidelity Investments',
    title: 'Process Automation',
    meta: '2019–2021',
    highlights: [
      'Built a data-access tool that let internal teams retrieve the IBM Db2 records they needed for daily work.',
      'Built an operations dashboard that consolidated server health, CPU usage, and networking into one high-level view.'
    ],
    technologies: ['SQL', 'JavaScript', 'Java', 'Ruby']
  }
];

const projects = [
  { marker: '</>', name: 'Build', type: 'Developer tools', copy: 'Centralizes client access, project briefs, update requests, and delivery workflows.' },
  { marker: 'NT', name: 'New Trinity', type: 'Community', copy: 'Helps members find worship details, church resources, ministry news, and ways to connect.' },
  { marker: 'LW', name: 'Lattaco Welding', type: 'Business', copy: 'Showcases welding services, decades of experience, and custom metalwork across the Triangle.' },
  { marker: 'J&J', name: 'Jazzed To Be Jones', type: 'Lifestyle', copy: 'Brings wedding details, the couple’s story, and the guest experience into one private destination.' }
];

const skillGroups = [
  { title: 'Automation & AI', skills: ['Jenkins', 'CI/CD', 'MCP', 'IBM Bob'] },
  { title: 'Cloud & infrastructure', skills: ['Kubernetes', 'OpenShift', 'VMware', 'AWS'] },
  { title: 'Languages', skills: ['Python', 'React', 'JavaScript', 'Java', 'Ruby', 'SQL'] }
];

function ProfileIcon({ name }) {
  const paths = {
    network: <><circle cx="8" cy="7" r="3" /><circle cx="17" cy="6" r="2" /><path d="M2 20c0-5 2-8 6-8s6 3 6 8M14 12c4 0 6 3 6 7" /></>,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v6H5V6h6" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    education: <><path d="m2.5 8.5 9.5-5 9.5 5-9.5 5Z" /><path d="M6.5 11.5v4.25c1.45 1.55 3.3 2.25 5.5 2.25s4.05-.7 5.5-2.25V11.5" /><path d="M21.5 8.5v6" /><circle cx="21.5" cy="16.25" r="1" /></>
  };

  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}

function LinkedIn() {
  const settings = useContext(DeviceSettingsContext);
  const profileImage = settings?.adminProfile?.imageUrl || settings?.accountImage || '';

  return (
    <main className="linkedin-page app-view" aria-label="AJ Thompson professional profile">
      <div className="linkedin-scroll app-scroll" id="profile-top">
        <div className="linkedin-layout">
          <div className="linkedin-primary">
            <section className="linkedin-hero" aria-labelledby="linkedin-name">
              <div className="linkedin-hero__art" aria-hidden="true">
                <span className="linkedin-hero__monogram">AJ</span>
                <span className="linkedin-hero__orbit" />
                <span className="linkedin-hero__signal"><i /><i /><i /><i /></span>
              </div>
              <div className="linkedin-hero__body">
                <div className="linkedin-profile__photo">
                  <img
                    className={profileImage ? 'linkedin-profile__photo-image--account' : undefined}
                    src={profileImage || '/images/Home Banner.png'}
                    alt="AJ Thompson"
                  />
                </div>
                <div className="linkedin-hero__identity">
                  <p className="linkedin-hero__role"><i aria-hidden="true" /> Software Engineer · IBM</p>
                  <h1 id="linkedin-name">AJ Thompson <span aria-label="Profile verified">&#10003;</span></h1>
                  <p className="linkedin-profile__headline">Automation, Dev Ops, and AI.</p>
                  <div className="linkedin-hero__education">
                    <span className="linkedin-hero__education-mark"><ProfileIcon name="education" /></span>
                    <div><strong>North Carolina State University</strong><small>B.S. in Computer Science · College of Engineering</small><em>Class of 2021</em></div>
                  </div>
                </div>
                <div className="linkedin-profile__actions">
                  <Link className="linkedin-button linkedin-button--primary" to="/app-store">Projects <ProfileIcon name="network" /></Link>
                  <Link className="linkedin-button" to="/mail"><ProfileIcon name="mail" /> Contact</Link>
                </div>
              </div>
            </section>

            <section className="linkedin-section linkedin-section--experience" id="experience" aria-labelledby="linkedin-experience">
              <header className="linkedin-section__intro">
                <div><p>CAREER</p><h2 id="linkedin-experience">Experience</h2></div>
              </header>
              <div className="linkedin-timeline">
                {experience.map((item) => (
                  <article key={item.marker}>
                    <span className="linkedin-timeline__node" aria-hidden="true" />
                    <div className="linkedin-timeline__role-content">
                      <div className="linkedin-timeline__header">
                        <div>
                          <span className="linkedin-timeline__company">
                            {item.marker}
                            {item.current && <em><i aria-hidden="true" /> Current role</em>}
                          </span>
                          <h3>{item.title}</h3>
                          <p>{item.meta}</p>
                        </div>
                      </div>
                      <ul className="linkedin-timeline__highlights">
                        {item.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
                      </ul>
                      {item.platforms && <p className="linkedin-timeline__platforms">{item.platforms.join(' · ')}</p>}
                      {item.technologies && <p className="linkedin-timeline__platforms">{item.technologies.join(' · ')}</p>}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="linkedin-section linkedin-section--projects" id="projects" aria-labelledby="linkedin-projects">
              <div className="linkedin-section__heading linkedin-section__intro">
                <div><p>SELECTED WORK</p><h2 id="linkedin-projects">Projects</h2></div>
                <Link to="/app-store">View app store <ProfileIcon name="external" /></Link>
              </div>
              <div className="linkedin-projects">
                {projects.map((project, index) => (
                  <Link to="/app-store" key={project.name}>
                    <span className="linkedin-projects__number" aria-hidden="true">0{index + 1}</span>
                    <span className="linkedin-projects__glyph" aria-hidden="true">{project.marker}</span>
                    <span className="linkedin-projects__copy"><small>React / {project.type}</small><strong>{project.name}</strong><span>{project.copy}</span></span>
                    <span className="linkedin-projects__arrow" aria-hidden="true">&#8599;</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="linkedin-section linkedin-section--skills" id="skills" aria-labelledby="linkedin-skills">
              <header className="linkedin-section__intro">
                <div><p>TOOLBOX</p><h2 id="linkedin-skills">Core skills</h2></div>
              </header>
              <div className="linkedin-skill-index">
                <div className="linkedin-skill-index__rows">
                  {skillGroups.map((group, index) => (
                    <article key={group.title}>
                      <span aria-hidden="true">0{index + 1}</span>
                      <h3>{group.title}</h3>
                      <p>{group.skills.join(' / ')}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
        <footer className="linkedin-footer"><span>AJT / 2026</span> Designed and built by AJ Thompson.</footer>
      </div>
    </main>
  );
}

export default LinkedIn;
