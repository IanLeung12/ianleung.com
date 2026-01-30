import data from '../data.json';

const Hero = () => {
  const { profile, skills, projects, experience } = data;

  return (
    <section className="hero" id="hero">
      <div className="hero-content">
        <h1 className="hero-name">{profile.name}</h1>
        <p className="hero-location">{profile.location || "Your Location"}</p>
        
        <p className="hero-bio">{profile.tagline}</p>

        <div className="hero-section">
          <h3 className="hero-section-title">what I've been building:</h3>
          <ul className="hero-list">
            {projects.map((project) => (
              <li key={project.id}>
                <span className="list-icon">↳</span>
                <a href={project.link} className="hero-link">{project.title}</a>
                <span className="hero-dash"> - </span>
                <span className="hero-desc">{project.description}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="hero-section">
          <h3 className="hero-section-title">previously:</h3>
          <ul className="hero-list">
            {experience.map((exp) => (
              <li key={exp.id}>
                <span className="list-icon">↳</span>
                <span className="hero-role">{exp.role}</span>
                <span className="hero-at"> @ </span>
                <a href="#" className="hero-link">{exp.company}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="hero-section">
          <h3 className="hero-section-title">skills:</h3>
          <p className="hero-skills">{skills.join(' · ')}</p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
