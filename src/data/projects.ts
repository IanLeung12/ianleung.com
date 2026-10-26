import type { Project } from "./project";


export const projects: Project[] = [
    {
        title: "Jevis",
        short_desc: "Jev for Browser Use",
        description: "Browser use that actually works. Several times faster and 250x cheaper than GPT-6 Astra on comparable tasks. Hack the North Winner ($2000)",
        tools: ["Python", "Jev", "DOM", "OpenAI"],
        thumbnail: "/videos/jevis.mp4",
        video: "/videos/jevis.mp4",
    },
    {
        title: "Trust No Ghost",
        short_desc: "3D Maze Exploration Game",
        description: "Maze exploration game built in Unity where your objective is to find and feed a friendly ghost among several other evil ones. Includes custom animations, pathfinding mechanics, effects, and more.",
        github: "https://github.com/IanLeung12/Trust-No-Ghost",
        tools: ["Unity", "C#", "Itch.io"],
        thumbnail: "/images/trustnoghost.png",
        image: "/images/trustnoghost.png",
        video: "/videos/trustnoghost.mp4",
    },
    {
        title: "OuterwoRLd",
        short_desc: "2D Physics Game + Reinforcement Learning",
        description: "2D spaceflight physics game built in C++ and OpenGL with procedural level generation & gravitational fields. Trained a custom PPO RL model to play the game from scratch using PyTorch, achieving a 97% success rate at max difficulty.",
        github: "https://github.com/IanLeung12/outerworld",
        tools: ["C++", "Python", "OpenGL", "PyTorch", "TensorBoard"],
        thumbnail: "/images/outerworld.png",
        image: "/images/outerworld.png",
        video: "/videos/outerworld.mp4",
    },
    {
        title: "Pharmagotchi",
        short_desc: "Your virtual pharmacy friend.",
        description: "Tamagotchi-inspired Android app where your virtual pet (pharmagotchi) provides regular reminders and health recommendations to keep you on top of your health. Graph your metrics, receive AI-powered feedback, and automatically connect with health care providers when needed.",
        github: "https://github.com/dilhrm/Pharmagotchi",
        tools: ["Android Studio", "Kotlin", "Openrouter", "Figma", "JavaMail"],
        thumbnail: "/images/pharmagotchi.png",
        image: "/images/pharmagotchi.png",
    },
    {
        title: "Portfolio Advisor",
        short_desc: "Mathematical Portfolio Selection",
        description: "A quantitative, model-driven investment portfolio designed to systematically outperform market benchmarks. 2nd Place in CFM Competition.",
        github: "https://github.com/IanLeung12/CFM-Group-Project",
        tools: ["Python", "Pandas", "Numpy", "Matplotlib"],
        thumbnail: "/videos/cfm-poster.jpg",
        image: "/videos/cfm-poster.jpg",
        video: "/videos/cfm.mp4",
    },
]
