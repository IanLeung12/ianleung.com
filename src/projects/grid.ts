import { projects } from "../data/projects";

interface Project {
  title: string;
  description: string;
  short_desc: string;
  thumbnail: string;
  image?: string;
  github?: string;
  link?: string;
  tools: string[];
}

const typedProjects = projects as Project[];

const grid = document.getElementById("projects-grid") as HTMLElement;
const modal = document.getElementById("project-modal") as HTMLElement;
const modalBody = document.getElementById("modal-body") as HTMLElement;
const modalClose = modal.querySelector(".modal-close") as HTMLButtonElement;

function renderTools(tools: string[]) {
  return tools.map((t) => `<span class="tool">${t}</span>`).join("");
}

function openModal(project: Project) {
  modalBody.innerHTML = `
    <h2>${project.title}</h2>
    <p>${project.description}</p>
    ${project.image ? `<img src="${project.image}" alt="${project.title}" />` : ""}
  `;
  modal.classList.remove("hidden");
}

grid.innerHTML = typedProjects
  .map((p) => `
    <article class="project-card" data-title="${p.title}">
      <img src="${p.thumbnail}" alt="${p.title}" />
      <h3>${p.title}</h3>
      <p>${p.short_desc}</p>
      <div class="tools">${renderTools(p.tools)}</div>
      <div class="actions">
        ${p.github ? `<a href="${p.github}" target="_blank">GitHub</a>` : ""}
        ${p.link ? `<a href="${p.link}" target="_blank">Live</a>` : ""}
      </div>
    </article>
  `)
  .join("");

grid.querySelectorAll(".project-card").forEach((card, i) => {
  card.addEventListener("click", () => openModal(typedProjects[i]));

  const maxTilt = 20;
  let rafId = 0;
  let lastEvent: PointerEvent | null = null;

  const updateFromEvent = () => {
    if (!lastEvent) return;
    const rect = card.getBoundingClientRect();
    const x = (lastEvent.clientX - rect.left) / rect.width;
    const y = (lastEvent.clientY - rect.top) / rect.height;
    const nx = x - 0.5;
    const ny = y - 0.5;

    card.style.setProperty("--rx", `${(-ny * maxTilt).toFixed(2)}deg`);
    card.style.setProperty("--ry", `${(nx * maxTilt).toFixed(2)}deg`);
  };

  card.addEventListener("pointermove", (e: PointerEvent) => {
    lastEvent = e;
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      updateFromEvent();
    });
  });

  card.addEventListener("pointerleave", () => {
    lastEvent = null;
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  });
});

modal.addEventListener("click", (e: MouseEvent) => {
  if (e.target === modal || (e.target as HTMLElement).classList.contains("modal-close")) {
    modal.classList.add("hidden");
  }
});

document.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key === "Escape") modal.classList.add("hidden");
});