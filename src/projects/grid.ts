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
    <div class="modal-hero">
      ${project.image ? `<img src="${project.image}" alt="${project.title}" />` : ""}
      <h2>${project.title}</h2>
    </div>
    <div class="modal-detail">
      <p>${project.description}</p>
      <div class="tools">${renderTools(project.tools)}</div>
      <div class="actions">
        ${project.link ? `<a class="action-primary" href="${project.link}" target="_blank" rel="noopener">${EXT_ICON}Live</a>` : ""}
        ${project.github ? `<a href="${project.github}" target="_blank" rel="noopener">${GH_ICON}GitHub</a>` : ""}
      </div>
    </div>
  `;
  modal.classList.remove("hidden");
}

// Official GitHub brand mark (Simple Icons) and a simple external-link arrow.
const GH_ICON = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`;
const EXT_ICON = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 10.5 10.5 5.5M6.5 5.5h4v4"/></svg>`;

grid.innerHTML = typedProjects
  .map((p) => `
    <article class="project-card" data-title="${p.title}" tabindex="0" role="button" aria-label="View details for ${p.title}">
      <div class="project-thumb">
        <img src="${p.thumbnail}" alt="${p.title}" />
        <h3>${p.title}</h3>
      </div>
      <div class="project-body">
        <p>${p.short_desc}</p>
        <div class="actions">
          ${p.link ? `<a class="action-primary" href="${p.link}" target="_blank" rel="noopener">${EXT_ICON}Live</a>` : ""}
          ${p.github ? `<a href="${p.github}" target="_blank" rel="noopener">${GH_ICON}GitHub</a>` : ""}
        </div>
      </div>
    </article>
  `)
  .join("");

grid.querySelectorAll(".project-card").forEach((card, i) => {
  const el = card as HTMLElement;

  el.addEventListener("click", () => openModal(typedProjects[i]));

  el.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModal(typedProjects[i]);
    }
  });

  // Action links open their own URL; don't also trigger the card modal.
  el.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", (e) => e.stopPropagation()),
  );

  const maxTilt = 8;
  let rafId = 0;
  let lastEvent: PointerEvent | null = null;

  const updateFromEvent = () => {
    if (!lastEvent) return;
    const rect = el.getBoundingClientRect();
    const x = (lastEvent.clientX - rect.left) / rect.width;
    const y = (lastEvent.clientY - rect.top) / rect.height;
    const nx = x - 0.5;
    const ny = y - 0.5;

    el.style.setProperty("--rx", `${(-ny * maxTilt).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(nx * maxTilt).toFixed(2)}deg`);
    el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);

    // Parallax: the image drifts opposite the cursor for a sense of depth.
    el.style.setProperty("--img-x", `${(-nx * 8).toFixed(1)}px`);
    el.style.setProperty("--img-y", `${(-ny * 8).toFixed(1)}px`);
  };

  el.addEventListener("pointermove", (e: PointerEvent) => {
    lastEvent = e;
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      updateFromEvent();
    });
  });

  el.addEventListener("pointerleave", () => {
    lastEvent = null;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--mx", "50%");
    el.style.setProperty("--my", "50%");
    el.style.setProperty("--img-x", "0px");
    el.style.setProperty("--img-y", "0px");
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