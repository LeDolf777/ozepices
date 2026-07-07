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

  // ---------- 3D gallery carousel ----------
  var carousel = document.querySelector("[data-carousel3d]");
  var track = carousel && carousel.querySelector("[data-carousel3d-track]");

  if (carousel && track) {
    (function initCarousel3d() {
      var items = Array.prototype.slice.call(track.children);
      var count = items.length;
      var rotation = 0;
      var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      function layout() {
        var cylinderWidth = window.innerWidth < 640 ? 900 : 1500;
        var faceWidth = cylinderWidth / count;
        var radius = cylinderWidth / (2 * Math.PI);
        track.style.width = cylinderWidth + "px";
        items.forEach(function (item, i) {
          item.style.width = faceWidth + "px";
          item.style.marginLeft = (-faceWidth / 2) + "px";
          item.style.transform = "rotateY(" + (i * (360 / count)) + "deg) translateZ(" + radius + "px)";
        });
        applyRotation();
      }

      function applyRotation() {
        track.style.transform = "rotateY(" + rotation + "deg)";
      }

      var dragging = false;
      var startX = 0;
      var startRotation = 0;
      var lastX = 0;
      var lastT = 0;
      var velocity = 0;
      var moved = 0;
      var rafId = null;
      var downItem = null;

      function stopInertia() {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      }

      function onPointerDown(e) {
        stopInertia();
        dragging = true;
        moved = 0;
        downItem = e.target.closest("[data-gallery-item]");
        startX = lastX = e.clientX;
        startRotation = rotation;
        lastT = performance.now();
        velocity = 0;
        track.setPointerCapture(e.pointerId);
      }

      function onPointerMove(e) {
        if (!dragging) return;
        var now = performance.now();
        var dx = e.clientX - lastX;
        var dt = Math.max(1, now - lastT);
        velocity = (dx / dt) * 16;
        rotation = startRotation + (e.clientX - startX) * 0.06;
        moved += Math.abs(dx);
        lastX = e.clientX;
        lastT = now;
        applyRotation();
      }

      function onPointerUp() {
        if (!dragging) return;
        dragging = false;
        // Pointer capture retargets the native click event to the track
        // itself, so a real tap is dispatched manually on the item that
        // was under the finger/cursor at pointerdown.
        if (moved <= 6 && downItem) {
          downItem.click();
        }
        if (!reducedMotion && Math.abs(velocity) > 0.5) {
          var angularVelocity = velocity * 0.06;
          (function step() {
            angularVelocity *= 0.95;
            rotation += angularVelocity;
            applyRotation();
            if (Math.abs(angularVelocity) > 0.02) {
              rafId = requestAnimationFrame(step);
            } else {
              rafId = null;
            }
          })();
        }
      }

      track.addEventListener("pointerdown", onPointerDown);
      track.addEventListener("pointermove", onPointerMove);
      track.addEventListener("pointerup", onPointerUp);
      track.addEventListener("pointercancel", onPointerUp);

      var resizeTimer;
      window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(layout, 150);
      });

      layout();
    })();
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
