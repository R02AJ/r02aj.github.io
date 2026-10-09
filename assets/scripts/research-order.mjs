const priorityProjects = {
  all: [],
  "quantitative-finance": [
    "research/hamiltonian-alpha.html",
    "research/chebyshev-surface-engine.html",
    "research/chebyshev-option-surfaces.html",
  ],
  "machine-learning": [
    "research/hamjepa.html",
    "research/prediction-memory.html",
  ],
  "geometric-analysis": [
    "research/foliation-rigidity-1d.html",
    "research/minimizing-foliations-common-volume.html",
    "research/self-minkowski-rigidity.html",
  ],
};

// Always start from the original order, never the previously selected category.
export function orderResearchProjects(originalOrder, category = "all") {
  const priorities = priorityProjects[category] || [];
  const leading = priorities.filter((href) => originalOrder.includes(href));
  const promoted = new Set(leading);
  return [...leading, ...originalOrder.filter((href) => !promoted.has(href))];
}

export function initializeResearchOrder(root) {
  const grid = root.querySelector("#research-projects");
  const buttons = Array.from(root.querySelectorAll("[data-research-order]"));
  if (!grid || !buttons.length) return;

  const originalCards = Array.from(grid.children).filter((card) =>
    card.matches(".project-container")
  );
  const originalOrder = originalCards.map((card) =>
    card.querySelector(".project-title a").getAttribute("href")
  );
  const cardsByHref = new Map(
    originalOrder.map((href, index) => [href, originalCards[index]])
  );

  function activate(category) {
    const orderedCards = orderResearchProjects(originalOrder, category).map(
      (href) => cardsByHref.get(href)
    );
    // Move the existing nodes, preserving each cover canvas and its animation.
    grid.append(...orderedCards);
    buttons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.researchOrder === category)
      );
    });
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => activate(button.dataset.researchOrder));
  });
  activate("all");
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initializeResearchOrder(document));
  } else {
    initializeResearchOrder(document);
  }
}
