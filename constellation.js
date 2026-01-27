// Constellation Background Animation
class ConstellationBackground {
    constructor() {
        this.canvas = document.getElementById('constellation-bg');
        this.ctx = this.canvas.getContext('2d');
        this.stars = [];
        this.mouse = { x: null, y: null };
        this.connectionDistance = 80;
        this.numStars = 150;
        
        this.init();
        this.animate();
        this.addEventListeners();
    }

    init() {
        this.resize();
        this.createStars();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createStars() {
        this.stars = [];
        for (let i = 0; i < this.numStars; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 1.5 + 0.3,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                opacity: Math.random() * 0.4 + 0.35,
                twinkleSpeed: Math.random() * 0.02 + 0.01,
                twinklePhase: Math.random() * Math.PI * 2,
                color: this.getStarColor()
            });
        }
    }

    getStarColor() {
        const colors = [
            'rgba(212, 175, 55,',       // Gold
            'rgba(244, 208, 63,',       // Light gold
            'rgba(255, 255, 255,',      // White
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    addEventListeners() {
        window.addEventListener('resize', () => {
            this.resize();
            this.createStars();
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mouseout', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }

    drawStars() {
        this.stars.forEach(star => {
            // Update twinkle
            star.twinklePhase += star.twinkleSpeed;
            const twinkle = (Math.sin(star.twinklePhase) + 1) / 2;
            const currentOpacity = star.opacity * (0.5 + twinkle * 0.5);

            // Draw star glow
            const gradient = this.ctx.createRadialGradient(
                star.x, star.y, 0,
                star.x, star.y, star.radius * 2
            );
            gradient.addColorStop(0, star.color + (currentOpacity * 0.8) + ')');
            gradient.addColorStop(1, star.color + '0)');

            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.radius * 2, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // Draw star core
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = star.color + currentOpacity + ')';
            this.ctx.fill();

            // Update position
            star.x += star.vx;
            star.y += star.vy;

            // Wrap around edges
            if (star.x < 0) star.x = this.canvas.width;
            if (star.x > this.canvas.width) star.x = 0;
            if (star.y < 0) star.y = this.canvas.height;
            if (star.y > this.canvas.height) star.y = 0;
        });
    }

    drawConstellations() {
        this.stars.forEach((star1, i) => {
            this.stars.slice(i + 1).forEach(star2 => {
                const distance = Math.hypot(star1.x - star2.x, star1.y - star2.y);
                
                if (distance < this.connectionDistance) {
                    const opacity = (1 - distance / this.connectionDistance) * 0.15;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(star1.x, star1.y);
                    this.ctx.lineTo(star2.x, star2.y);
                    this.ctx.strokeStyle = `rgba(212, 175, 55, ${opacity})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            });

            // Connect to mouse
            if (this.mouse.x && this.mouse.y) {
                const mouseDistance = Math.hypot(star1.x - this.mouse.x, star1.y - this.mouse.y);
                
                if (mouseDistance < this.connectionDistance * 1.5) {
                    const opacity = (1 - mouseDistance / (this.connectionDistance * 1.5)) * 0.2;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(star1.x, star1.y);
                    this.ctx.lineTo(this.mouse.x, this.mouse.y);
                    this.ctx.strokeStyle = `rgba(244, 208, 63, ${opacity})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();

                    // Attract stars slightly towards mouse
                    const angle = Math.atan2(this.mouse.y - star1.y, this.mouse.x - star1.x);
                    star1.vx += Math.cos(angle) * 0.012;
                    star1.vy += Math.sin(angle) * 0.012;

                    // Limit velocity
                    const maxVel = 1;
                    star1.vx = Math.max(-maxVel, Math.min(maxVel, star1.vx));
                    star1.vy = Math.max(-maxVel, Math.min(maxVel, star1.vy));
                }
            }
        });
    }

    drawNebula() {
        // Create subtle nebula effect
        const gradient1 = this.ctx.createRadialGradient(
            this.canvas.width * 0.3, this.canvas.height * 0.3, 0,
            this.canvas.width * 0.3, this.canvas.height * 0.3, this.canvas.width * 0.4
        );
        gradient1.addColorStop(0, 'rgba(139, 92, 246, 0.03)');
        gradient1.addColorStop(1, 'rgba(139, 92, 246, 0)');
        
        this.ctx.fillStyle = gradient1;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const gradient2 = this.ctx.createRadialGradient(
            this.canvas.width * 0.7, this.canvas.height * 0.7, 0,
            this.canvas.width * 0.7, this.canvas.height * 0.7, this.canvas.width * 0.3
        );
        gradient2.addColorStop(0, 'rgba(6, 182, 212, 0.02)');
        gradient2.addColorStop(1, 'rgba(6, 182, 212, 0)');
        
        this.ctx.fillStyle = gradient2;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    animate() {
        // Clear canvas completely
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw elements
        this.drawNebula();
        this.drawStars();
        this.drawConstellations();

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ConstellationBackground();

    // Add scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });

    // Add visible class styles
    const style = document.createElement('style');
    style.textContent = `
        section.visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
