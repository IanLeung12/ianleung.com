import data from '../data.json';

const About = () => {
  const { profile, skills } = data;

  return (
    <section id="about" className="about">
      <div className="section-container">
        <h2 className="section-title">About Me</h2>
        <div className="about-content">
          <div className="about-text">
            <p>{profile.bio}</p>
            <p>{profile.description}</p>
            <div className="skills">
              <h3>My Constellation of Skills</h3>
              <div className="skill-tags">
                {skills.map((skill, index) => (
                  <span key={index} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="about-image">
            <div className="image-frame">
              <div className="placeholder-avatar">IL</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
