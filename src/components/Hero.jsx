import { useState, useEffect, useRef } from 'react';

const titles = [
  "Software Developer",
  "Dino Enthusiast",
  "Problem Solver",
  "Fossil Hunter"
];

const Hero = () => {
  const [letters, setLetters] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isTransitioning = useRef(false);
  const letterDelay = 30;
  const interval = 3000;

  const createLetters = (text) => {
    return text.split('').map((char, i) => ({
      char: char === ' ' ? '\u00A0' : char,
      id: i,
      glow: false,
      opacity: 1,
    }));
  };

  useEffect(() => {
    setLetters(createLetters(titles[0]));
  }, []);

  useEffect(() => {
    const cycleInterval = setInterval(() => {
      if (!isTransitioning.current) {
        transition();
      }
    }, interval);

    return () => clearInterval(cycleInterval);
  }, [currentIndex]);

  const transition = () => {
    isTransitioning.current = true;
    const nextIndex = (currentIndex + 1) % titles.length;
    const nextText = titles[nextIndex];

    // Fade out with glow sweep
    letters.forEach((_, i) => {
      setTimeout(() => {
        setLetters(prev => prev.map((letter, idx) =>
          idx === i ? { ...letter, glow: true } : letter
        ));
        setTimeout(() => {
          setLetters(prev => prev.map((letter, idx) =>
            idx === i ? { ...letter, opacity: 0 } : letter
          ));
        }, 80);
      }, i * letterDelay);
    });

    // Replace with new letters
    const fadeOutDuration = letters.length * letterDelay + 150;
    setTimeout(() => {
      const newLetters = createLetters(nextText).map(l => ({ ...l, opacity: 0, glow: false }));
      setLetters(newLetters);

      // Fade in with glow sweep
      newLetters.forEach((_, i) => {
        setTimeout(() => {
          setLetters(prev => prev.map((letter, idx) =>
            idx === i ? { ...letter, glow: true, opacity: 1 } : letter
          ));
          setTimeout(() => {
            setLetters(prev => prev.map((letter, idx) =>
              idx === i ? { ...letter, glow: false } : letter
            ));
          }, 100);
        }, i * letterDelay);
      });

      const fadeInDuration = newLetters.length * letterDelay + 150;
      setTimeout(() => {
        isTransitioning.current = false;
      }, fadeInDuration);

      setCurrentIndex(nextIndex);
    }, fadeOutDuration);
  };

  return (
    <section className="hero" id="hero">
      <div className="hero-content">
        <h1 className="hero-name">Ian Leung</h1>
        <p className="hero-title">
          {letters.map((letter, i) => (
            <span
              key={`${currentIndex}-${i}`}
              className={`letter ${letter.glow ? 'glow' : ''}`}
              style={{ opacity: letter.opacity }}
            >
              {letter.char}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
};

export default Hero;
