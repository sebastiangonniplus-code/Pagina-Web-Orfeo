/* ==========================================================================
   Carlos Emmanuel Flamenco — main.js
   Script clásico (sin módulos). Cada init va aislado: si uno falla, el resto sigue.
   Los datos editables viven en lib/manifest.js
   ========================================================================== */
(function () {
  "use strict";

  var D = window.__CARLOS__ || { images: {}, videos: {}, social: {}, whatsapp: "", email: "" };
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function safe(fn, name) {
    try { fn(); } catch (e) { if (window.console) console.warn("[init " + name + "]", e); }
  }

  /* ---------- Helpers de contacto ---------- */
  function waNumber() {
    var n = String(D.whatsapp || "").replace(/\D/g, "");
    return n.length >= 8 ? n : "";
  }
  function waLink(text) {
    return "https://wa.me/" + waNumber() + "?text=" + encodeURIComponent(text || "");
  }

  /* ---------- Año del pie ---------- */
  function initYear() {
    var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- Navegación ---------- */
  function initNav() {
    var nav = $("#nav"), btn = $("#nav-toggle"), links = $("#nav-links");
    if (!nav) return;
    function onScroll() { nav.classList.toggle("is-solid", window.scrollY > 24); }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (!btn || !links) return;
    function setOpen(open) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      links.classList.toggle("is-open", open);
      nav.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    }
    btn.addEventListener("click", function () { setOpen(btn.getAttribute("aria-expanded") !== "true"); });
    $$("a", links).forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") { setOpen(false); btn.focus(); }
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 820) setOpen(false); });
  }

  /* ---------- Espacios de imagen (placeholders / fotos reales) ---------- */
  var ICON = '<svg class="ph-ico" viewBox="0 0 48 48" aria-hidden="true"><path d="M6 14h9l3-4h12l3 4h9v24H6z"/><circle cx="24" cy="26" r="7"/></svg>';
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function initSlots() {
    $$(".ph[data-slot]").forEach(function (el) {
      if (el.dataset.ready) return;
      el.dataset.ready = "1";
      var ratio = el.dataset.ratio;
      if (ratio) el.style.setProperty("--ratio", ratio);
      var src = D.images && D.images[el.dataset.slot];
      var label = el.dataset.label || "Imagen";
      if (src) {
        var img = new Image();
        img.alt = label; img.decoding = "async";
        if (!el.classList.contains("hero-photo")) img.loading = "lazy";
        img.onload = function () { el.classList.add("has-img"); };
        img.onerror = function () { img.remove(); };
        img.src = src;
        el.appendChild(img);
        if (img.complete && img.naturalWidth) el.classList.add("has-img");
      }
      el.insertAdjacentHTML("beforeend",
        '<div class="ph-label">' + ICON +
        '<span class="ph-title">' + esc(label) + '</span>' +
        (el.dataset.note ? '<span class="ph-note">' + esc(el.dataset.note) + '</span>' : "") + "</div>");
    });
  }

  /* ---------- Videos (carga solo al hacer clic; sin autoplay al entrar) ---------- */
  function initVideos() {
    $$(".video[data-video]").forEach(function (box) {
      if (box.dataset.ready) return;
      box.dataset.ready = "1";
      var id = String((D.videos && D.videos[box.dataset.video]) || "").trim();
      var label = box.dataset.label || "Video";
      if (!/^[\w-]{6,20}$/.test(id)) {
        box.innerHTML = '<div class="video-ph"><span class="play" aria-hidden="true"></span>' +
          '<span class="video-label">' + esc(label) + '</span>' +
          '<span class="video-note">' + esc(box.dataset.note || "Video pendiente") + '</span></div>';
        return;
      }
      box.innerHTML = '<button class="video-btn" type="button" aria-label="Reproducir: ' + esc(label) + '">' +
        '<span class="play" aria-hidden="true"></span><span class="video-label">' + esc(label) + "</span></button>";
      $(".video-btn", box).addEventListener("click", function () {
        box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" title="' + esc(label) +
          '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>';
      });
    });
  }

  /* ---------- Enlaces de WhatsApp, correo y redes ---------- */
  function initContactLinks() {
    $$("[data-wa]").forEach(function (a) {
      if (!waNumber()) {
        // Sin número configurado: el botón lleva a la sección de contacto
        if (a.id === "ch-wa") { a.classList.add("is-pending"); a.textContent = "WhatsApp por definir"; }
        return;
      }
      a.href = waLink(a.getAttribute("data-wa"));
      a.target = "_blank"; a.rel = "noopener noreferrer";
    });

    var mail = $("#ch-mail");
    if (mail && D.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(D.email)) {
      mail.href = "mailto:" + D.email; mail.textContent = D.email;
    } else if (mail) { mail.classList.add("is-pending"); }

    $$("[data-social]").forEach(function (a) {
      var url = D.social && D.social[a.dataset.social];
      if (url && /^https?:\/\//i.test(url)) {
        a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
        a.classList.add("is-live");
        var em = $("em", a); if (em) em.textContent = "Ver";
      } else {
        a.classList.add("is-pending");
        a.setAttribute("aria-disabled", "true");
        a.addEventListener("click", function (e) { e.preventDefault(); var c = $("#contacto"); if (c) c.scrollIntoView({ behavior: "smooth" }); });
      }
    });
  }

  /* ---------- Revelado al hacer scroll ---------- */
  function initReveal() {
    var items = $$(".reveal");
    if (!("IntersectionObserver" in window)) { items.forEach(function (el) { el.classList.add("is-visible"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });
    items.forEach(function (el) { io.observe(el); });
    // Red de seguridad: nada queda oculto
    setTimeout(function () {
      $$(".reveal:not(.is-visible)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight * 1.2) el.classList.add("is-visible");
      });
    }, 6000);
  }

  /* ---------- Parallax suave en fotos (se desactiva si se pidió menos movimiento) ---------- */
  function initParallax() {
    if (reduced) return;
    var els = $$("[data-parallax]");
    if (!els.length) return;
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var f = parseFloat(el.dataset.parallax) || 0.05;
        var center = r.top + r.height / 2 - vh / 2;
        var y = Math.max(-40, Math.min(40, -center * f));
        el.style.translate = "0 " + y.toFixed(1) + "px";
      });
      ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- Modalidades (tabs accesibles) ---------- */
  function initTabs() {
    var tabs = $$(".seg-btn");
    if (!tabs.length) return;
    function select(t) {
      tabs.forEach(function (b) {
        var on = b === t;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
        b.tabIndex = on ? 0 : -1;
        var p = document.getElementById(b.getAttribute("aria-controls"));
        if (p) { p.hidden = !on; p.classList.toggle("is-on", on); }
      });
    }
    tabs.forEach(function (b, i) {
      b.addEventListener("click", function () { select(b); });
      b.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) { e.preventDefault(); select(n); n.focus(); }
      });
    });
  }

  /* ---------- Contacto: motivos + formulario ---------- */
  function initContact() {
    var form = $("#form");
    if (!form) return;
    var motivo = $("#f-motivo"), status = $("#form-status");

    $$(".intent").forEach(function (b) {
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () {
        $$(".intent").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        motivo.value = b.dataset.intent;
        clearErr(motivo);
        var n = $("#f-nombre"); if (n) n.focus({ preventScroll: window.innerWidth < 820 });
      });
    });

    function setErr(el, msg) {
      var f = el.closest(".field"), e = $("#e-" + el.name);
      if (f) f.classList.add("is-bad");
      if (e) e.textContent = msg;
      el.setAttribute("aria-invalid", "true");
    }
    function clearErr(el) {
      var f = el.closest(".field"), e = $("#e-" + el.name);
      if (f) f.classList.remove("is-bad");
      if (e) e.textContent = "";
      el.removeAttribute("aria-invalid");
    }
    ["nombre", "motivo", "mensaje"].forEach(function (n) {
      var el = form.elements[n];
      el.addEventListener("input", function () { clearErr(el); });
      el.addEventListener("change", function () { clearErr(el); });
    });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var f = form.elements, bad = null;
      var nombre = f.nombre.value.trim(), mot = f.motivo.value, msg = f.mensaje.value.trim();
      if (nombre.length < 2) { setErr(f.nombre, "Escribí tu nombre."); bad = bad || f.nombre; }
      if (!mot) { setErr(f.motivo, "Elegí un motivo de consulta."); bad = bad || f.motivo; }
      if (msg.length < 10) { setErr(f.mensaje, "Contanos un poco más (mínimo 10 caracteres)."); bad = bad || f.mensaje; }
      if (bad) { bad.focus(); status.textContent = ""; status.className = "status"; return; }

      var text = "Hola Carlos, soy " + nombre + ".\nMotivo: " + mot + ".\n\n" + msg;
      if (!waNumber()) {
        status.className = "status is-warn";
        status.textContent = "El formulario está listo, pero falta cargar el número de WhatsApp en lib/manifest.js. Todavía no se puede enviar.";
        return;
      }
      status.className = "status";
      status.textContent = "Abriendo WhatsApp con tu mensaje…";
      window.open(waLink(text), "_blank", "noopener");
    });
  }

  /* ---------- Arranque ---------- */
  function boot() {
    safe(initYear, "year");
    safe(initNav, "nav");
    safe(initSlots, "slots");
    safe(initVideos, "videos");
    safe(initContactLinks, "links");
    safe(initReveal, "reveal");
    safe(initParallax, "parallax");
    safe(initTabs, "tabs");
    safe(initContact, "contact");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
