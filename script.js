(function () {
  "use strict";

  document.documentElement.classList.add("js-ready");

  /* ------------------------------------------------------------------
     Theme Toggle (Light / Dark with localStorage persistence)
  ------------------------------------------------------------------ */
  const themeBtn = document.getElementById("theme-toggle");
  const metaTheme = document.getElementById("meta-theme-color");

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      if (metaTheme) {
        metaTheme.setAttribute("content", next === "dark" ? "#0E1014" : "#FAF9F6");
      }
      try {
        localStorage.setItem("zy-theme", next);
      } catch (e) {}
    });
  }

  /* ------------------------------------------------------------------
     Toast Notification Helper
  ------------------------------------------------------------------ */
  const toastEl = document.getElementById("toast");
  let toastTimer = null;

  function showToast(message, duration) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastEl.classList.remove("is-visible");
      window.setTimeout(() => {
        if (!toastEl.classList.contains("is-visible")) {
          toastEl.textContent = "";
        }
      }, 240);
    }, duration || 2400);
  }

  async function copyText(text, successMsg) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      showToast(successMsg);
    } catch (e) {
      showToast(text, 3500);
    }
  }

  /* ------------------------------------------------------------------
     Crawler-Resistant Email Action (assembled only on user click)
  ------------------------------------------------------------------ */
  function resolveContactAddress() {
    const codes = [121, 122, 114, 50, 50, 51, 52, 64, 103, 109, 97, 105, 108, 46, 99, 111, 109];
    return String.fromCharCode.apply(null, codes);
  }

  document.querySelectorAll(".email-action").forEach((btn) => {
    btn.addEventListener("click", () => {
      const addr = resolveContactAddress();
      copyText(addr, `Email copied: ${addr}`);
    });
  });

  /* ------------------------------------------------------------------
     Copy BibTeX
  ------------------------------------------------------------------ */
  document.querySelectorAll("[data-copy-target]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-copy-target");
      const el = targetId ? document.getElementById(targetId) : null;
      if (el) {
        copyText(el.textContent.trim(), "BibTeX copied to clipboard");
      }
    });
  });

  /* ------------------------------------------------------------------
     Publication Inline BibTeX Drawers
  ------------------------------------------------------------------ */
  document.querySelectorAll(".pub-toggle[data-drawer]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const drawerId = btn.getAttribute("data-drawer");
      const drawer = drawerId ? document.getElementById(drawerId) : null;
      if (!drawer) return;

      const isOpen = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!isOpen));
      drawer.hidden = isOpen;
    });
  });

  /* ------------------------------------------------------------------
     Publication Category Filtering
  ------------------------------------------------------------------ */
  const filterTabs = document.querySelectorAll(".filter-tab[data-filter]");
  const pubItems = document.querySelectorAll("#pub-list .pub-item");

  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const filter = tab.getAttribute("data-filter");

      filterTabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", String(active));
      });

      pubItems.forEach((item) => {
        const cats = (item.getAttribute("data-categories") || "").split(/\s+/);
        const show = filter === "all" || cats.includes(filter);
        item.classList.toggle("is-hidden", !show);
        if (show) item.classList.add("is-visible");
      });
    });
  });

  /* ------------------------------------------------------------------
     Scroll Progress Bar, Brand Reveal & Active Nav Scroll-Spy
  ------------------------------------------------------------------ */
  const header = document.getElementById("site-header");
  const progressBar = document.getElementById("scroll-progress");
  const navLinks = Array.from(document.querySelectorAll('.site-nav .nav-link[href^="#"]'));
  const observedSections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  function updateScrollUI() {
    const y = window.scrollY || document.documentElement.scrollTop;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, y / maxScroll)) : 0;

    if (progressBar) {
      progressBar.style.transform = `scaleX(${ratio})`;
    }
    if (header) {
      header.classList.toggle("is-scrolled", y > 120);
    }

    let currentId = "";
    const offset = 120;
    for (const sec of observedSections) {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= offset) {
        currentId = sec.id;
      }
    }
    if (y + window.innerHeight >= document.documentElement.scrollHeight - 24 && observedSections.length) {
      currentId = observedSections[observedSections.length - 1].id;
    }

    navLinks.forEach((link) => {
      const target = link.getAttribute("href").slice(1);
      link.classList.toggle("is-active", target === currentId);
    });
  }

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScrollUI();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );
  updateScrollUI();

  /* ------------------------------------------------------------------
     Subtle Section Reveal on Scroll (jump-safe)
  ------------------------------------------------------------------ */
  const revealEls = Array.from(document.querySelectorAll(".reveal"));

  function revealVisibleOrPassed() {
    const cutoff = window.innerHeight + 80;
    for (const el of revealEls) {
      if (el.classList.contains("is-visible")) continue;
      if (el.getBoundingClientRect().top <= cutoff) {
        el.classList.add("is-visible");
      }
    }
  }

  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "80px 0px 80px 0px", threshold: 0 }
    );
    revealEls.forEach((el) => observer.observe(el));
    window.addEventListener("scroll", revealVisibleOrPassed, { passive: true });
    window.addEventListener("hashchange", () => window.setTimeout(revealVisibleOrPassed, 60));
    revealVisibleOrPassed();
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }
})();
