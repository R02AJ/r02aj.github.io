document.addEventListener("DOMContentLoaded", function () {
  const mobileToggle = document.querySelector(".mobile-menu-toggle");
  const mobileMenu = document.getElementById("site-mobile-menu");
  if (mobileToggle && mobileMenu) {
    const mobileQuery = window.matchMedia("(max-width: 769px)");

    function syncMobileMenuVisibility() {
      if (mobileQuery.matches) {
        mobileMenu.setAttribute("aria-hidden", document.body.classList.contains("nav-open") ? "false" : "true");
      } else {
        mobileMenu.removeAttribute("aria-hidden");
      }
    }

    function closeMobileMenu() {
      document.body.classList.remove("nav-open");
      mobileMenu.classList.remove("is-open");
      mobileToggle.classList.remove("is-open");
      mobileToggle.setAttribute("aria-expanded", "false");
      mobileToggle.setAttribute("aria-label", "Open menu");
      syncMobileMenuVisibility();
    }

    function openMobileMenu() {
      document.body.classList.add("nav-open");
      mobileMenu.classList.add("is-open");
      mobileToggle.classList.add("is-open");
      mobileToggle.setAttribute("aria-expanded", "true");
      mobileToggle.setAttribute("aria-label", "Close menu");
      syncMobileMenuVisibility();
    }

    syncMobileMenuVisibility();

    mobileToggle.addEventListener("click", function () {
      if (document.body.classList.contains("nav-open")) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMobileMenu);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMobileMenu();
    });

    window.addEventListener("resize", function () {
      if (!mobileQuery.matches) closeMobileMenu();
      syncMobileMenuVisibility();
    });
  }

  document.querySelectorAll(".nav-container .menu").forEach(function (menu) {
    const dot = menu.querySelector(".menu-dot");
    const links = Array.from(menu.querySelectorAll("a"));
    const active = menu.querySelector("a.active");

    if (!dot || !active) return;

    function moveDot(target) {
      const left = target.offsetLeft + target.offsetWidth / 2 - dot.offsetWidth / 2;
      dot.style.left = `${left}px`;
      dot.style.opacity = "1";
      dot.style.backgroundColor = target.dataset.dotColor || getComputedStyle(document.body).getPropertyValue("--nav-dot-color") || "#ff9800";
    }

    moveDot(active);

    links.forEach(function (link) {
      link.addEventListener("mouseenter", function () {
        moveDot(link);
      });
    });

    menu.addEventListener("mouseleave", function () {
      moveDot(active);
    });

    window.addEventListener("resize", function () {
      moveDot(active);
    });
  });

  document.querySelectorAll(".project-tabs").forEach(function (tabs) {
    const links = Array.from(tabs.querySelectorAll("[data-tab]"));
    const panels = Array.from(document.querySelectorAll("[data-tab-panel]"));
    if (!links.length || !panels.length) return;

    function activate(id, updateHash) {
      const normalized = id === "visual-guide" ? "visual-guide" : "technical-summary";
      links.forEach(function (link) {
        link.classList.toggle("active", link.dataset.tab === normalized);
      });
      panels.forEach(function (panel) {
        const isActive = panel.dataset.tabPanel === normalized;
        panel.classList.toggle("active", isActive);
        panel.hidden = !isActive;
        if (isActive && window.MathJax && window.MathJax.Hub) {
          window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub, panel]);
        }
      });
      if (updateHash && window.location.hash !== `#${normalized}`) {
        history.pushState(null, "", `#${normalized}`);
      }
    }

    links.forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        activate(link.dataset.tab, true);
      });
    });

    window.addEventListener("hashchange", function () {
      activate(window.location.hash.replace("#", ""), false);
    });

    const initialTab = window.location.hash.replace("#", "");
    activate(initialTab, false);
    if (initialTab === "technical-summary" || initialTab === "visual-guide") {
      requestAnimationFrame(function () {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      });
    }
  });
});
