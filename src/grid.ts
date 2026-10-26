import { projects } from "./data/projects";

interface Project {
  title: string;
  description: string;
  short_desc: string;
  thumbnail: string;
  image?: string;
  video?: string;
  github?: string;
  link?: string;
  tools: string[];
}

const typedProjects = projects as Project[];

const grid = document.getElementById("projects-grid") as HTMLElement;
const modal = document.getElementById("project-modal") as HTMLElement;
const modalBody = document.getElementById("modal-body") as HTMLElement;

function renderTools(tools: string[]) {
  return tools.map((t) => `<span class="tool">${t}</span>`).join(`<span class="tool-sep" aria-hidden="true">·</span>`);
}


grid.innerHTML = typedProjects
  .map((p) => `
    <div class="project-entry" tabindex="0" role="button" aria-label="View details for ${p.title}">
      <h3>${p.title}</h3>
      <p>${p.short_desc}</p>
    </div>
  `)
  .join("");

// Warm the browser cache for a project's hero media before the modal opens.
// Fired on hover/focus so the file is usually in flight (or done) by click time.
const prefetched = new Set<string>();
function prefetch(url?: string) {
  if (!url || prefetched.has(url)) return;
  prefetched.add(url);
  fetch(url, { priority: "low" } as RequestInit).catch(() => prefetched.delete(url));
}

function prefetchProject(project: Project) {
  prefetch(project.image);
  prefetch(project.video);
}

function renderHero(project: Project) {
  if (project.video) {
    return `<video src="${project.video}" poster="${project.image ?? ""}" autoplay muted loop playsinline preload="auto" aria-label="${project.title}"></video>`;
  }
  return project.image ? `<img src="${project.image}" alt="${project.title}" />` : "";
}

grid.querySelectorAll(".project-entry").forEach((el, i) => {
  const entry = el as HTMLElement;

  entry.addEventListener("click", () => openModal(typedProjects[i]));
  entry.addEventListener("pointerenter", () => prefetchProject(typedProjects[i]));
  entry.addEventListener("focus", () => prefetchProject(typedProjects[i]));

  entry.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModal(typedProjects[i]);
    }
  });
});

let currentTiltCleanup: (() => void) | null = null;

function openModal(project: Project) {
  modalBody.innerHTML = `
    <div class="modal-hero">
      ${renderHero(project)}
    </div>
    <div class="modal-detail">
      <div class="modal-head">
        <h2>${project.title}</h2>
        <button class="modal-close" type="button" aria-label="Close">esc</button>
      </div>
      <p>${project.description}</p>
      <div class="tools">${renderTools(project.tools)}</div>
      <div class="actions">
        ${project.link ? `<a href="${project.link}" target="_blank" rel="noopener">live ↗</a>` : ""}
        ${project.github ? `<a href="${project.github}" target="_blank" rel="noopener">github ↗</a>` : ""}
      </div>
    </div>
  `;

  const content = document.querySelector(".modal-content") as HTMLElement;
  let rafId = 0;
  let lastEvent: PointerEvent | null = null;

  function updateFromEvent() {
    if (!lastEvent) return;
    const rect = content.getBoundingClientRect();
    const x = (lastEvent.clientX - rect.left) / rect.width;
    const y = (lastEvent.clientY - rect.top) / rect.height;
    const nx = x - 0.5;
    const ny = y - 0.5;
    content.style.transform = `perspective(1000px) rotateX(${(-ny * 5).toFixed(2)}deg) rotateY(${(nx * 5).toFixed(2)}deg)`;
  }

  function onMove(e: PointerEvent) {
    lastEvent = e;
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      updateFromEvent();
    });
  }

  function onLeave() {
    lastEvent = null;
    content.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
  }

  content.addEventListener("pointermove", onMove);
  content.addEventListener("pointerleave", onLeave);

  currentTiltCleanup = () => {
    content.removeEventListener("pointermove", onMove);
    content.removeEventListener("pointerleave", onLeave);
    cancelAnimationFrame(rafId);
    content.style.transform = "";
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    modalBody.querySelector("video")?.removeAttribute("autoplay");
  }

  modal.classList.remove("hidden");
}

function closeModal() {
  if (currentTiltCleanup) {
    currentTiltCleanup();
    currentTiltCleanup = null;
  }

  // Hidden modal content isn't removed until the next open; stop the
  // looping video so it doesn't keep decoding in the background.
  modalBody.querySelector("video")?.pause();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    modal.classList.add("hidden");
    return;
  }
  modal.classList.add("closing");
  window.setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("closing");
  }, 200);
}

modal.addEventListener("click", (e: MouseEvent) => {
  if (e.target === modal || (e.target as HTMLElement).classList.contains("modal-close")) {
    closeModal();
  }
});

document.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
});
