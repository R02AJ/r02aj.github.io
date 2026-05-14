import { PaperKineticVisual } from "../Web_assets/PaperKineticVisual.js";

const mounted = new WeakMap();

function mountPaperVisuals() {
  document.querySelectorAll("[data-paper-visual]").forEach((element) => {
    if (mounted.has(element)) return;
    const requestedVariant = element.dataset.paperVisual;
    const variant = ["hamjepa", "chebyshev", "foliation"].includes(requestedVariant)
      ? requestedVariant
      : "hamjepa";
    PaperKineticVisual({
      container: element,
      variant,
      fit: element.dataset.paperFit || "default",
    })
      .then((handle) => {
        mounted.set(element, handle);
      })
      .catch(() => {
        element.classList.add("paper-kinetic-slot--fallback");
      });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountPaperVisuals);
} else {
  mountPaperVisuals();
}
