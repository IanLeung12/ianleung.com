import { useEffect, useRef } from 'react';

const Constellation = () => {
  const canvasRef = useRef(null);
  const starsRef = useRef([]);
  const mouseRef = useRef({ x: null, y: null });
  const animationRef = useRef(null);

  const connectionDistance = 80;
  const numStars = 200;

  const getStarColor = () => {
    const colors = [
      'rgba(212, 175, 55,',
      'rgba(244, 208, 63,',
      'rgba(255, 255, 255,',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const createStars = (width, height) => {
    const stars = [];
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.3,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.4 + 0.35,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
        color: getStarColor(),
      });
    }
    return stars;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      starsRef.current = createStars(canvas.width, canvas.height);
    };

    const drawNebula = () => {
      const gradient1 = ctx.createRadialGradient(
        canvas.width * 0.3, canvas.height * 0.3, 0,
        canvas.width * 0.3, canvas.height * 0.3, canvas.width * 0.4
      );
      gradient1.addColorStop(0, 'rgba(139, 92, 246, 0.03)');
      gradient1.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = gradient1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const gradient2 = ctx.createRadialGradient(
        canvas.width * 0.7, canvas.height * 0.7, 0,
        canvas.width * 0.7, canvas.height * 0.7, canvas.width * 0.3
      );
      gradient2.addColorStop(0, 'rgba(6, 182, 212, 0.02)');
      gradient2.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = gradient2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const drawStars = () => {
      starsRef.current.forEach(star => {
        star.twinklePhase += star.twinkleSpeed;
        const twinkle = (Math.sin(star.twinklePhase) + 1) / 2;
        const currentOpacity = star.opacity * (0.5 + twinkle * 0.5);

        const gradient = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.radius * 2
        );
        gradient.addColorStop(0, star.color + (currentOpacity * 0.8) + ')');
        gradient.addColorStop(1, star.color + '0)');

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color + currentOpacity + ')';
        ctx.fill();

        star.x += star.vx;
        star.y += star.vy;

        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;
      });
    };

    const drawConstellations = () => {
      const mouse = mouseRef.current;
      const stars = starsRef.current;

      stars.forEach((star1, i) => {
        stars.slice(i + 1).forEach(star2 => {
          const distance = Math.hypot(star1.x - star2.x, star1.y - star2.y);
          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.25;
            ctx.beginPath();
            ctx.moveTo(star1.x, star1.y);
            ctx.lineTo(star2.x, star2.y);
            ctx.strokeStyle = `rgba(212, 175, 55, ${opacity})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        });

        if (mouse.x && mouse.y) {
          const mouseDistance = Math.hypot(star1.x - mouse.x, star1.y - mouse.y);

          if (mouseDistance < connectionDistance * 1.5) {
            const opacity = (1 - mouseDistance / (connectionDistance * 1.5)) * 0.35;
            ctx.beginPath();
            ctx.moveTo(star1.x, star1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(244, 208, 63, ${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();

            const angle = Math.atan2(mouse.y - star1.y, mouse.x - star1.x);
            star1.vx += Math.cos(angle) * 0.012;
            star1.vy += Math.sin(angle) * 0.012;

            star1.vx = Math.max(-1, Math.min(1, star1.vx));
            star1.vy = Math.max(-1, Math.min(1, star1.vy));
          }
        }
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawNebula();
      drawStars();
      drawConstellations();
      animationRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseOut = () => {
      mouseRef.current.x = null;
      mouseRef.current.y = null;
    };

    resize();
    animate();

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  return (
    <div className="constellation-container">
      <canvas ref={canvasRef} id="constellation-bg" />
    </div>
  );
};

export default Constellation;
