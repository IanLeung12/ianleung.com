import data from '../data.json';

const Contact = () => {
  const { profile } = data;

  const contacts = [
    { icon: '📧', label: 'Email', href: `mailto:${profile.email}`, target: '' },
    { icon: '💻', label: 'GitHub', href: profile.github, target: '_blank' },
    { icon: '💼', label: 'LinkedIn', href: profile.linkedin, target: '_blank' },
  ];

  return (
    <section id="contact" className="contact">
      <div className="section-container">
        <h2 className="section-title">Contact</h2>
        <div className="contact-content">
          <p className="contact-intro">
            Feel free to reach out for collaborations, opportunities, or just to say hello.
          </p>
          <div className="contact-methods">
            {contacts.map((contact, index) => (
              <a
                key={index}
                href={contact.href}
                target={contact.target || undefined}
                rel={contact.target ? 'noopener noreferrer' : undefined}
                className="contact-card"
              >
                <span className="contact-icon">{contact.icon}</span>
                <span className="contact-label">{contact.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
