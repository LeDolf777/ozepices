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
    (function initCoverflow() {
      var items = Array.prototype.slice.call(track.children);
      var count = items.length;
      var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var spacing = 0;
      var centerOffset = Math.min(2, count - 1);
      var snapRaf = null;
      var snapTarget = null;

      function clampBounds(v) {
        return Math.max(0, Math.min(count - 1, v));
      }

      function layout() {
        var stageWidth = carousel.querySelector(".carousel3d__stage").clientWidth;
        var small = window.innerWidth < 640;
        var itemWidth = small
          ? Math.min(230, stageWidth * 0.64)
          : Math.min(340, stageWidth * 0.34);
        spacing = itemWidth * 0.8;
        items.forEach(function (item) {
          item.style.width = itemWidth + "px";
          item.style.marginLeft = (-itemWidth / 2) + "px";
        });
        render();
      }

      function render() {
        items.forEach(function (item, i) {
          var offset = i - centerOffset;
          var abs = Math.min(Math.abs(offset), 3);
          var x = offset * spacing;
          var rot = Math.max(-32, Math.min(32, offset * -20));
          var scale = 1 - abs * 0.09;
          var z = -abs * 60;
          item.style.transform =
            "translateX(" + x + "px) translateZ(" + z + "px) rotateY(" + rot + "deg) scale(" + scale + ")";
          item.style.zIndex = String(100 - Math.round(abs * 10));
          item.classList.toggle("is-center", abs < 0.5);
        });
      }

      var dragging = false;
      var startX = 0;
      var startOffset = 0;
      var lastX = 0;
      var lastT = 0;
      var velocity = 0;
      var moved = 0;
      var downItem = null;

      function stopSnap() {
        if (snapRaf) { cancelAnimationFrame(snapRaf); snapRaf = null; }
      }

      function snapTo(target) {
        stopSnap();
        snapTarget = clampBounds(target);
        if (reducedMotion) {
          centerOffset = snapTarget;
          render();
          return;
        }
        (function step() {
          var delta = snapTarget - centerOffset;
          if (Math.abs(delta) < 0.002) {
            centerOffset = snapTarget;
            render();
            snapRaf = null;
            return;
          }
          centerOffset += delta * 0.22;
          render();
          snapRaf = requestAnimationFrame(step);
        })();
      }

      function onPointerDown(e) {
        stopSnap();
        dragging = true;
        moved = 0;
        downItem = e.target.closest("[data-gallery-item]");
        startX = lastX = e.clientX;
        startOffset = centerOffset;
        lastT = performance.now();
        velocity = 0;
        track.setPointerCapture(e.pointerId);
      }

      function onPointerMove(e) {
        if (!dragging || !spacing) return;
        var now = performance.now();
        var dx = e.clientX - lastX;
        var dt = Math.max(1, now - lastT);
        velocity = dx / dt;
        moved += Math.abs(dx);
        lastX = e.clientX;
        lastT = now;

        var next = startOffset - (e.clientX - startX) / spacing;
        if (next < 0) next *= 0.4;
        if (next > count - 1) next = (count - 1) + (next - (count - 1)) * 0.4;
        centerOffset = next;
        render();
      }

      function onPointerUp() {
        if (!dragging) return;
        dragging = false;
        if (moved <= 6 && downItem) {
          downItem.click();
          snapTo(Math.round(centerOffset));
          return;
        }
        var flick = -velocity * 4.5;
        snapTo(Math.round(centerOffset + flick));
      }

      track.addEventListener("pointerdown", onPointerDown);
      track.addEventListener("pointermove", onPointerMove);
      track.addEventListener("pointerup", onPointerUp);
      track.addEventListener("pointercancel", onPointerUp);
      track.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") { snapTo(Math.round(centerOffset) - 1); e.preventDefault(); }
        if (e.key === "ArrowRight") { snapTo(Math.round(centerOffset) + 1); e.preventDefault(); }
      });

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

  // ---------- Custom cursor dot ----------
  if (window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.documentElement.classList.add("has-custom-cursor");
    var dot = document.createElement("div");
    dot.className = "cursor-dot";
    dot.setAttribute("aria-hidden", "true");
    document.body.appendChild(dot);

    var px = 0, py = 0, raf = null;
    var interactiveSelector = "a, button, [role='button'], input, textarea, select, summary";

    function paint() {
      raf = null;
      dot.style.transform = "translate(-50%, -50%) translate(" + px + "px," + py + "px)";
      var el = document.elementFromPoint(px, py);
      var zone = el && el.closest("[data-cursor]");
      dot.classList.toggle("is-dark", !!zone && zone.getAttribute("data-cursor") === "dark");
      dot.classList.toggle("is-pointer", !!(el && el.closest(interactiveSelector)));
    }

    document.addEventListener("mousemove", function (e) {
      px = e.clientX;
      py = e.clientY;
      dot.classList.add("is-visible");
      if (!raf) raf = requestAnimationFrame(paint);
    });
    document.addEventListener("mouseleave", function () { dot.classList.remove("is-visible"); });
  }
})();
