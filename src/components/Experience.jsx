import data from '../data.json';

const Experience = () => {
  const { experience } = data;

  return (
    <section id="experience" className="experience">
      <div className="section-container">
        <h2 className="section-title">
          <span className="star">✦</span> Experience
        </h2>
        <div className="experience-container">
          {experience.map((exp) => (
            <div key={exp.id} className="experience-item">
              <div className="experience-header">
                <h3>{exp.role}</h3>
                <span className="experience-date">{exp.date}</span>
              </div>
              <div className="experience-company">{exp.company}</div>
              <p className="experience-description">{exp.description}</p>
              <ul className="experience-highlights">
                {exp.highlights.map((highlight, i) => (
                  <li key={i}>{highlight}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;
