(function () {
  "use strict";

  // Header shadow on scroll
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Mobile navigation
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Accessible tabs (schedule days, submission modes)
  document.querySelectorAll("[role='tablist']").forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll("[role='tab']"));

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute("aria-selected", String(selected));
        t.tabIndex = selected ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !selected;
      });
      if (focus) tab.focus();
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        select(tab, false);
      });
      tab.addEventListener("keydown", function (event) {
        var next = null;
        if (event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
        if (event.key === "ArrowLeft") next = tabs[(index - 1 + tabs.length) % tabs.length];
        if (event.key === "Home") next = tabs[0];
        if (event.key === "End") next = tabs[tabs.length - 1];
        if (next) {
          event.preventDefault();
          select(next, true);
        }
      });
    });

    // Open the tab whose data-date matches today, if any
    var today = new Date();
    var iso = today.getFullYear() + "-" +
      String(today.getMonth() + 1).padStart(2, "0") + "-" +
      String(today.getDate()).padStart(2, "0");
    var current = tabs.filter(function (t) { return t.dataset.date === iso; })[0];
    select(current || tabs[0], false);
  });

  // Countdown
  var countdown = document.getElementById("countdown");
  if (countdown) {
    var target = new Date(countdown.dataset.target).getTime();
    var fields = {
      days: countdown.querySelector("[data-unit='days']"),
      hours: countdown.querySelector("[data-unit='hours']"),
      minutes: countdown.querySelector("[data-unit='minutes']"),
      seconds: countdown.querySelector("[data-unit='seconds']")
    };
    var timer = null;

    var tick = function () {
      var diff = target - Date.now();
      if (diff <= 0) {
        clearInterval(timer);
        countdown.outerHTML = '<p class="countdown-done">¡Las Jornadas están en curso!</p>';
        return;
      }
      var s = Math.floor(diff / 1000);
      fields.days.textContent = Math.floor(s / 86400);
      fields.hours.textContent = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
      fields.minutes.textContent = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      fields.seconds.textContent = String(s % 60).padStart(2, "0");
    };
    tick();
    timer = setInterval(tick, 1000);
  }

  // Photo carousel: one dot per page of visible slides
  document.querySelectorAll(".carousel").forEach(function (carousel) {
    var track = carousel.querySelector(".carousel-track");
    var dots = carousel.querySelector(".carousel-dots");
    var prev = carousel.querySelector("[data-dir='-1']");
    var next = carousel.querySelector("[data-dir='1']");
    var pages = 1;

    var perView = function () {
      return parseInt(getComputedStyle(carousel).getPropertyValue("--per-view"), 10) || 1;
    };

    var currentPage = function () {
      var max = track.scrollWidth - track.clientWidth;
      if (max <= 0) return 0;
      return Math.round((track.scrollLeft / max) * (pages - 1));
    };

    var goTo = function (page) {
      page = Math.max(0, Math.min(pages - 1, page));
      var slides = track.children;
      var index = Math.min(page * perView(), slides.length - 1);
      track.scrollTo({ left: slides[index].offsetLeft - track.offsetLeft });
    };

    var update = function () {
      var page = currentPage();
      Array.prototype.forEach.call(dots.children, function (dot, i) {
        dot.setAttribute("aria-current", String(i === page));
      });
      prev.disabled = page === 0;
      next.disabled = page === pages - 1;
    };

    var build = function () {
      pages = Math.max(1, Math.ceil(track.children.length / perView()));
      dots.innerHTML = "";
      for (var i = 0; i < pages; i++) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", "Ir a la página " + (i + 1) + " de " + pages);
        dot.addEventListener("click", goTo.bind(null, i));
        dots.appendChild(dot);
      }
      update();
    };

    prev.addEventListener("click", function () { goTo(currentPage() - 1); });
    next.addEventListener("click", function () { goTo(currentPage() + 1); });

    var scrollTimer = null;
    track.addEventListener("scroll", function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(update, 60);
    }, { passive: true });

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 150);
    });

    build();
  });

  // Gallery lightbox
  var gallery = document.querySelector(".gallery");
  var lightbox = document.getElementById("lightbox");
  if (gallery && lightbox && typeof lightbox.showModal === "function") {
    var items = Array.prototype.slice.call(gallery.querySelectorAll("button"));
    var image = lightbox.querySelector("img");
    var position = 0;

    var show = function (i) {
      position = (i + items.length) % items.length;
      image.src = items[position].dataset.full;
      image.alt = items[position].querySelector("img").alt;
    };

    items.forEach(function (item, i) {
      item.addEventListener("click", function () {
        show(i);
        lightbox.showModal();
      });
    });

    lightbox.querySelector("[data-action='prev']").addEventListener("click", function () { show(position - 1); });
    lightbox.querySelector("[data-action='next']").addEventListener("click", function () { show(position + 1); });
    lightbox.querySelector("[data-action='close']").addEventListener("click", function () { lightbox.close(); });
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) lightbox.close();
    });
    lightbox.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") show(position + 1);
      if (event.key === "ArrowLeft") show(position - 1);
    });
  }
})();
