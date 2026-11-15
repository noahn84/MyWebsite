/*
  scrollicon.js
  Replaces the browser's scrollbar with one small, subtle icon that slides
  along the right edge as you scroll.
    - scrolling down -> a little lunar lander
    - scrolling up   -> a little rocket
  You can still scroll with the mouse wheel, touch, or keyboard, and you can
  drag the icon like a normal scrollbar.
*/
(function () {
  "use strict";

  var SIZE = 28;      // icon size in pixels
  var MARGIN = 6;     // gap from the screen edges
  var IDLE_MS = 900;  // how long after scrolling stops before the icon fades back

  // ---- Styles (kept here so no other file needs to change) ----
  var css =
    "html{scrollbar-width:none;-ms-overflow-style:none;}" +
    "html::-webkit-scrollbar,body::-webkit-scrollbar{display:none;width:0;height:0;}" +
    "#scroll-icon{position:fixed;right:" + MARGIN + "px;top:" + MARGIN + "px;" +
      "width:" + SIZE + "px;height:" + SIZE + "px;color:#4a4a4a;opacity:.3;" +
      "z-index:9999;cursor:grab;touch-action:none;user-select:none;" +
      "-webkit-user-select:none;transition:opacity .4s ease;display:none;}" +
    "#scroll-icon.si-active,#scroll-icon:hover{opacity:.85;}" +
    "#scroll-icon.si-drag{cursor:grabbing;}" +
    "#scroll-icon span{display:block;width:100%;height:100%;}" +
    "#scroll-icon svg{display:block;width:100%;height:100%;}" +
    "#scroll-icon .si-up{display:none;}" +
    "#scroll-icon.si-goingup .si-up{display:block;}" +
    "#scroll-icon.si-goingup .si-down{display:none;}" +
    "@media (prefers-reduced-motion:reduce){#scroll-icon{transition:none;}}";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ---- Icons (simple shapes, drawn in the current text color) ----
  var lander =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
      // cabin with a round window cut out
      '<path fill="currentColor" fill-rule="evenodd" d="M8 3H16L18 6V12H6V6Z' +
        'M10.4 7.6a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0-3.2 0Z"/>' +
      // engine bell
      '<path fill="currentColor" d="M10.5 12.5H13.5L14.8 16H9.2Z"/>' +
      // legs and foot pads
      '<path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" ' +
        'd="M7 12.5L3.5 20M17 12.5L20.5 20M9.5 12.5L8 19M14.5 12.5L16 19' +
        'M1.8 20.5H5.2M18.8 20.5H22.2"/>' +
    '</svg>';

  var rocket =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
      // body with a round window cut out
      '<path fill="currentColor" fill-rule="evenodd" d="M12 1C15 4 16 8 16 12V17H8V12C8 8 9 4 12 1Z' +
        'M10.4 9a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0-3.2 0Z"/>' +
      // fins
      '<path fill="currentColor" d="M8 13L4 19L8 18ZM16 13L20 19L16 18Z"/>' +
      // small flame
      '<path fill="currentColor" opacity=".55" d="M10 17.8L12 23L14 17.8Z"/>' +
    '</svg>';

  var icon = document.createElement("div");
  icon.id = "scroll-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML =
    '<span class="si-down">' + lander + "</span>" +
    '<span class="si-up">' + rocket + "</span>";
  document.body.appendChild(icon);

  // ---- Behavior ----
  var lastY = window.pageYOffset;
  var idleTimer = null;
  var dragging = false;
  var ticking = false;

  function maxScroll() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  function trackLength() {
    return Math.max(1, window.innerHeight - SIZE - MARGIN * 2);
  }

  function place() {
    var max = maxScroll();
    if (max <= 0) {            // page fits on screen: nothing to scroll, hide the icon
      icon.style.display = "none";
      return;
    }
    icon.style.display = "block";
    var y = (window.pageYOffset / max) * trackLength() + MARGIN;
    icon.style.top = Math.max(MARGIN, Math.min(y, MARGIN + trackLength())) + "px";
  }

  function fadeLater() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
      if (!dragging) icon.classList.remove("si-active");
    }, IDLE_MS);
  }

  function onScroll() {
    var y = window.pageYOffset;
    if (y > lastY) icon.classList.remove("si-goingup");   // down -> lander
    else if (y < lastY) icon.classList.add("si-goingup"); // up   -> rocket
    lastY = y;
    icon.classList.add("si-active");
    fadeLater();
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        place();
      });
    }
  }

  // Dragging the icon scrolls the page
  icon.addEventListener("pointerdown", function (e) {
    dragging = true;
    icon.classList.add("si-drag", "si-active");
    icon.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  icon.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var ratio = (e.clientY - MARGIN - SIZE / 2) / trackLength();
    ratio = Math.max(0, Math.min(1, ratio));
    window.scrollTo(0, ratio * maxScroll());
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    icon.classList.remove("si-drag");
    try { icon.releasePointerCapture(e.pointerId); } catch (err) { /* already released */ }
    fadeLater();
  }
  icon.addEventListener("pointerup", endDrag);
  icon.addEventListener("pointercancel", endDrag);

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", place);
  window.addEventListener("load", place);
  if (window.ResizeObserver) {
    new ResizeObserver(place).observe(document.body);   // page height changes (images, videos)
  }
  place();
})();
