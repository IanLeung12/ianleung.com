import { useEffect, useRef } from 'react';
import data from '../data.json';

const Projects = () => {
  const { projects } = data;
  const cardsRef = useRef([]);

  useEffect(() => {
    const handleMouseMove = (e, card) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;
      card.style.transform = `translateY(-8px) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const handleMouseLeave = (card) => {
      card.style.transform = '';
    };

    cardsRef.current.forEach(card => {
      if (card) {
        const moveHandler = (e) => handleMouseMove(e, card);
        const leaveHandler = () => handleMouseLeave(card);
        card.addEventListener('mousemove', moveHandler);
        card.addEventListener('mouseleave', leaveHandler);
        card._moveHandler = moveHandler;
        card._leaveHandler = leaveHandler;
      }
    });

    return () => {
      cardsRef.current.forEach(card => {
        if (card && card._moveHandler) {
          card.removeEventListener('mousemove', card._moveHandler);
          card.removeEventListener('mouseleave', card._leaveHandler);
        }
      });
    };
  }, [projects]);

  return (
    <section id="projects" className="projects">
      <div className="section-container">
        <h2 className="section-title">Projects</h2>
        <div className="projects-grid">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className="project-card"
              ref={el => cardsRef.current[index] = el}
            >
              <div className="project-icon">{project.icon}</div>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <div className="project-meta">
                <span className="project-date">{project.date}</span>
              </div>
              <div className="project-tags">
                {project.tools.map((tool, i) => (
                  <span key={i}>{tool}</span>
                ))}
              </div>
              <a href={project.link} className="project-link">Explore →</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
