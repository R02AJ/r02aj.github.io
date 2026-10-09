import { ResearchKineticVisual } from "../Web_assets/ResearchKineticVisual.js?v=20261009";

const mounted = new WeakMap();
const variants = new Set(["minkowski", "attention", "alpha", "chebyshev-production"]);

function mountResearchVisuals() {
  document.querySelectorAll("[data-research-project-visual]").forEach((element) => {
    if (mounted.has(element)) return;
    const requested = element.dataset.researchProjectVisual;
    ResearchKineticVisual({
      container: element,
      variant: variants.has(requested) ? requested : "minkowski",
      fit: element.dataset.paperFit || "default",
    })
      .then((handle) => mounted.set(element, handle))
      .catch(() => element.classList.add("paper-kinetic-slot--fallback"));
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountResearchVisuals);
} else {
  mountResearchVisuals();
}
