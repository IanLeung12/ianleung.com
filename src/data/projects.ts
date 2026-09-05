import type { Project } from "./project";


export const projects: Project[] = [
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
        title: "Trust No Ghost",
        short_desc: "3D Maze Exploration Game",
        description: "Maze exploration game built in Unity where your objective is to find and feed a friendly ghost among several other evil ones. Includes custom animations, pathfinding mechanics, effects, and more.",
        github: "https://github.com/IanLeung12/Trust-No-Ghost",
        tools: ["Unity", "C#", "Itch.io"],
        thumbnail: "/images/trustnoghost.png",
        image: "/images/trustnoghost.gif",
    },
    {
        title: "PeerAssist",
        short_desc: "Peer Assistance Platform for Students",
        description: "Java-based desktop app for students to publish, peer-edit, and review each other's assignments and work. Users sign up, upload PDF documents tagged by grade level and subject, and leave marks and comments on other students' work.",
        github: "https://github.com/IanLeung12/PeerAssist",
        tools: ["Java", "Supabase", "PDFBox", "Gson", "FlatLaf", "Maven build"],
        thumbnail: "/images/peerassist.png",
        image: "/images/peerassist.gif",
    },
    {
        title: "Zombie Outbreak",
        short_desc: "Cellular Automata Simulation",
        description: "Cellular Automata Simulation of a Zombie Outbreak, with tunable variables and visualization. Also has a nuke button.",
        github: "https://github.com/IanLeung12/cheerville",
        tools: ["Java"],
        thumbnail: "/images/cheerville.gif",
        image: "/images/cheerville.gif"
    },
    {
        title: "Portfolio Advisor",
        short_desc: "Mathematical Portfolio Selection",
        description: "A quantitative, model-driven investment portfolio designed to systematically outperform market benchmarks. 2nd Place in CFM Competition.",
        github: "https://github.com/IanLeung12/CFM-Group-Project",
        tools: ["Python", "Pandas", "Numpy", "Matplotlib"],
        thumbnail: "/images/cfm.gif",
        image: "/images/cfm.gif"
    }
]