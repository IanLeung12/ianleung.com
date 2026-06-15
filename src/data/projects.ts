import type { Project } from "./project";


export const projects: Project[] = [
    {
        title: "Pharmagotchi",
        short_desc: "Your virtual pharmacy friend.",
        description: "Download Pharmagotchi and adopt your own pharmacy friend! Your pharmagotchi provides regular reminders and health recommendations to keep you on top of your health. Graph your health, receive AI-powered feedback, and automatically connect with health care providers when needed!",
        github: "https://github.com/dilhrm/Pharmagotchi",
        tools: ["Android Studio", "Kotlin", "Openrouter", "Figma", "JavaMail"],
        thumbnail: "/images/pharmagotchi.png",
        image: "/images/pharmagotchi.png",
    },
    {
        title: "Trust No Ghost",
        short_desc: "3D Maze Exploration Game",
        description: "There are several ghosts in this maze. One is friendly, the rest are not. You must figure out which one is which using their mixed signals.  Find the axe to kill the evil ones, then find the candy and give it to the good one to win! Don't get them mixed up though...",
        github: "https://github.com/IanLeung12/Trust-No-Ghost",
        tools: ["Unity", "C#", "Itch.io"],
        thumbnail: "/images/trustnoghost.png",
        image: "/images/trustnoghost.png",
    },
    {
        title: "PeerAssist",
        short_desc: "Peer Assistance Platform for Students",
        description: "PeerAssist is a desktop platform for students to publish, peer-edit, and review each other's assignments and work. Users sign up, upload PDF documents tagged by grade level and subject, and leave marks and comments on other students' work. Documents can be searched, sorted, and ranked by average review score.",
        github: "https://github.com/IanLeung12/PeerAssist",
        tools: ["Java", "Supabase", "PDFBox", "Gson", "FlatLaf", "Maven build"],
        thumbnail: "/images/peerassist.png",
        image: "/images/peerassist2.png",
    }
]