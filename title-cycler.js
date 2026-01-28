// Title Cycling Animation - Per-Letter Glow Sweep
// Add or remove titles from this array to customize what cycles
const titles = [
    "Software Developer",
    "Cat Lover",
    "Problem Solver",
    "Gamer"
];

class TitleCycler {
    constructor() {
        this.element = document.getElementById('cycling-title');
        this.titles = titles;
        this.currentIndex = 0;
        this.interval = 3000; // Time between transitions in ms
        this.letterDelay = 30; // Delay between each letter in ms
        this.isTransitioning = false;
        
        if (this.element) {
            this.setLetters(this.titles[0]);
            this.startCycling();
        }
    }

    setLetters(text) {
        this.element.innerHTML = text.split('').map(char => 
            char === ' ' ? '<span class="letter"> </span>' : `<span class="letter">${char}</span>`
        ).join('');
    }

    startCycling() {
        setInterval(() => {
            if (!this.isTransitioning) {
                this.transition();
            }
        }, this.interval);
    }

    transition() {
        this.isTransitioning = true;
        const nextIndex = (this.currentIndex + 1) % this.titles.length;
        const nextText = this.titles[nextIndex];
        const letters = this.element.querySelectorAll('.letter');
        const totalLetters = letters.length;
        
        // First pass: glow sweeps across and fades out letters
        letters.forEach((letter, i) => {
            setTimeout(() => {
                letter.classList.add('glow');
                
                setTimeout(() => {
                    letter.style.opacity = '0';
                }, 80);
            }, i * this.letterDelay);
        });
        
        // After all letters fade, replace with new word
        const fadeOutDuration = totalLetters * this.letterDelay + 150;
        
        setTimeout(() => {
            this.setLetters(nextText);
            const newLetters = this.element.querySelectorAll('.letter');
            
            // Set all new letters invisible initially
            newLetters.forEach(letter => {
                letter.style.opacity = '0';
            });
            
            // Second pass: glow sweeps across and fades in new letters
            newLetters.forEach((letter, i) => {
                setTimeout(() => {
                    letter.classList.add('glow');
                    letter.style.opacity = '1';
                    
                    setTimeout(() => {
                        letter.classList.remove('glow');
                    }, 100);
                }, i * this.letterDelay);
            });
            
            // Mark transition complete
            const fadeInDuration = newLetters.length * this.letterDelay + 150;
            setTimeout(() => {
                this.isTransitioning = false;
            }, fadeInDuration);
            
        }, fadeOutDuration);
        
        this.currentIndex = nextIndex;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TitleCycler();
});
