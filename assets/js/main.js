(function () {
  "use strict";

  // ---------- Burger / mobile menu ----------
  var burger = document.querySelector("[data-burger]");
  var mobileMenu = document.querySelector("[data-mobile-menu]");
  var mobileClose = document.querySelector("[data-mobile-close]");

  function openMenu() {
    if (!mobileMenu) return;
    mobileMenu.hidden = false;
    burger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    var firstLink = mobileMenu.querySelector("a, button");
    if (firstLink) firstLink.focus();
  }

  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.hidden = true;
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  if (burger && mobileMenu) {
    burger.addEventListener("click", function () {
      if (mobileMenu.hidden) openMenu(); else closeMenu();
    });
    if (mobileClose) mobileClose.addEventListener("click", closeMenu);
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !mobileMenu.hidden) closeMenu();
    });
  }

  // ---------- Scroll reveal ----------
  var revealEls = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  if (revealEls.length) {
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    }
  }

  // ---------- Gallery lightbox ----------
  var galleryItems = Array.prototype.slice.call(document.querySelectorAll("[data-gallery-item]"));
  var lightbox = document.querySelector("[data-lightbox]");
  if (galleryItems.length && lightbox) {
    var lbImg = lightbox.querySelector("[data-lightbox-img]");
    var lbCaption = lightbox.querySelector("[data-lightbox-caption]");
    var lbClose = lightbox.querySelector("[data-lightbox-close]");
    var lbPrev = lightbox.querySelector("[data-lightbox-prev]");
    var lbNext = lightbox.querySelector("[data-lightbox-next]");
    var currentIndex = 0;
    var lastFocused = null;

    function show(index) {
      currentIndex = (index + galleryItems.length) % galleryItems.length;
      var item = galleryItems[currentIndex];
      var fullSrc = item.getAttribute("data-full") || item.querySelector("img").src;
      lbImg.src = fullSrc;
      lbImg.alt = item.querySelector("img").alt || "";
      lbCaption.textContent = item.querySelector("img").alt || "";
    }

    function openLightbox(index) {
      lastFocused = document.activeElement;
      show(index);
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
      lbClose.focus();
    }

    function closeLightbox() {
      lightbox.hidden = true;
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    }

    galleryItems.forEach(function (item, index) {
      item.addEventListener("click", function () { openLightbox(index); });
    });
    lbClose.addEventListener("click", closeLightbox);
    lbPrev.addEventListener("click", function () { show(currentIndex - 1); });
    lbNext.addEventListener("click", function () { show(currentIndex + 1); });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (lightbox.hidden) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") show(currentIndex - 1);
      if (e.key === "ArrowRight") show(currentIndex + 1);
    });
  }

  // ---------- Active nav link ----------
  var here = document.body.getAttribute("data-page");
  if (here) {
    document.querySelectorAll("[data-nav-for]").forEach(function (link) {
      if (link.getAttribute("data-nav-for") === here) {
        link.setAttribute("aria-current", "page");
      }
    });
  }
})();
