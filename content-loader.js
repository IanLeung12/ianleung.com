// Load and populate content from data.json
class ContentManager {
    constructor() {
        this.data = null;
        this.init();
    }

    async init() {
        try {
            const response = await fetch('data.json');
            this.data = await response.json();
            this.populateContent();
        } catch (error) {
            console.error('Error loading data.json:', error);
        }
    }

    populateContent() {
        if (!this.data) return;

        // Populate about section
        this.populateAbout();
        
        // Populate projects
        this.populateProjects();
        
        // Populate experience
        this.populateExperience();
        
        // Populate contact
        this.populateContact();
    }

    populateAbout() {
        const aboutText = document.querySelector('.about-text');
        if (!aboutText || !this.data.profile) return;

        const skillsHtml = `
            <div class="skills">
                <h3>My Constellation of Skills</h3>
                <div class="skill-tags">
                    ${this.data.skills.map(skill => 
                        `<span class="skill-tag">${skill}</span>`
                    ).join('')}
                </div>
            </div>
        `;

        aboutText.innerHTML = `
            <p>${this.data.profile.bio}</p>
            <p>${this.data.profile.description}</p>
            ${skillsHtml}
        `;
    }

    populateProjects() {
        const projectsGrid = document.querySelector('.projects-grid');
        if (!projectsGrid || !this.data.projects) return;

        projectsGrid.innerHTML = this.data.projects.map(project => `
            <div class="project-card">
                <div class="project-icon">${project.icon}</div>
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <div class="project-meta">
                    <span class="project-date">${project.date}</span>
                </div>
                <div class="project-tags">
                    ${project.tools.map(tool => 
                        `<span>${tool}</span>`
                    ).join('')}
                </div>
                <a href="${project.link}" class="project-link">Explore →</a>
            </div>
        `).join('');
    }

    populateExperience() {
        const experienceSection = document.getElementById('experience');
        if (!experienceSection || !this.data.experience) return;

        const experienceHtml = `
            <div class="section-container">
                <h2 class="section-title">
                    <span class="star">✦</span> Experience
                </h2>
                <div class="experience-container">
                    ${this.data.experience.map(exp => `
                        <div class="experience-item">
                            <div class="experience-header">
                                <h3>${exp.role}</h3>
                                <span class="experience-date">${exp.date}</span>
                            </div>
                            <div class="experience-company">${exp.company}</div>
                            <p class="experience-description">${exp.description}</p>
                            <ul class="experience-highlights">
                                ${exp.highlights.map(highlight => 
                                    `<li>${highlight}</li>`
                                ).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        experienceSection.innerHTML = experienceHtml;
    }

    populateContact() {
        const contactMethods = document.querySelector('.contact-methods');
        if (!contactMethods || !this.data.profile) return;

        const contacts = [
            { icon: '📧', label: 'Email', href: `mailto:${this.data.profile.email}`, target: '' },
            { icon: '💻', label: 'GitHub', href: this.data.profile.github, target: '_blank' },
            { icon: '💼', label: 'LinkedIn', href: this.data.profile.linkedin, target: '_blank' }
        ];

        contactMethods.innerHTML = contacts.map(contact => `
            <a href="${contact.href}" ${contact.target ? `target="${contact.target}"` : ''} class="contact-card">
                <span class="contact-icon">${contact.icon}</span>
                <span class="contact-label">${contact.label}</span>
            </a>
        `).join('');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load content from data.json
    new ContentManager();
});
