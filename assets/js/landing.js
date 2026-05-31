/* ============================================================
   smbautomation.ai — Vertical landing-page interactions
   Self-contained. Reads window.LP (set inline per page).
   ============================================================ */
(function () {
  'use strict';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LP = window.LP || {};

  /* ---------- Reveal on scroll ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => io.observe(el));
    setTimeout(() => reveals.forEach((el) => el.classList.add('in')), 2600);
  }

  /* ---------- Count-up ---------- */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    if (prefersReduced) { el.textContent = prefix + target.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix; return; }
    const dur = 1600; let start = null;
    function tick(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const v = target * (1 - Math.pow(1 - p, 3));
      el.textContent = prefix + v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));
  }

  /* ---------- Transcript (single vertical) ---------- */
  const transcript = document.querySelector('.transcript');
  const timerEl = document.querySelector('.phone-topbar .timer .t');
  if (transcript && Array.isArray(LP.transcript)) {
    const script = LP.transcript;
    let i = 0, token = 0, started = false;
    function clear() { transcript.innerHTML = ''; }
    function addTyping(who) {
      const t = document.createElement('div');
      t.className = 'bubble ' + who + ' show';
      t.innerHTML = '<span class="typing"><span></span><span></span><span></span></span>';
      transcript.appendChild(t); return t;
    }
    function addBubble(item) {
      const b = document.createElement('div');
      b.className = 'bubble ' + item.who + ' show';
      b.innerHTML = '<span class="tag">' + item.tag + '</span>' + item.text;
      transcript.appendChild(b);
    }
    function next(tk) {
      if (tk !== token) return;
      if (i >= script.length) { setTimeout(() => { if (tk !== token) return; clear(); i = 0; next(tk); }, 3600); return; }
      const item = script[i];
      const typing = addTyping(item.who);
      const think = item.who === 'ai' ? 850 : 650;
      setTimeout(() => {
        if (tk !== token) { typing.remove(); return; }
        typing.remove(); addBubble(item); i++;
        setTimeout(() => next(tk), Math.min(1100 + item.text.length * 22, 2600));
      }, think);
    }
    function start() { if (started) return; started = true; token++; i = 0; clear(); next(token); }

    let secs = 0;
    if (timerEl && !prefersReduced) {
      setInterval(() => { secs++; timerEl.textContent = String(Math.floor(secs / 60)).padStart(2, '0') + ':' + String(secs % 60).padStart(2, '0'); }, 1000);
    }
    if (prefersReduced) { script.forEach(addBubble); }
    else {
      setTimeout(start, 600);
      const tio = new IntersectionObserver((entries) => { entries.forEach((e) => { if (e.isIntersecting) { start(); tio.disconnect(); } }); }, { threshold: 0.15 });
      tio.observe(transcript);
    }
  }

  /* ---------- Particle grid ---------- */
  const canvas = document.querySelector('canvas.particles');
  if (canvas && !prefersReduced) {
    const ctx = canvas.getContext('2d');
    let w, h, dots, raf; const COUNT = 34;
    function resize() {
      const r = canvas.parentElement.getBoundingClientRect();
      w = canvas.width = r.width * devicePixelRatio; h = canvas.height = r.height * devicePixelRatio;
      canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px';
    }
    function init() { dots = Array.from({ length: COUNT }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.12 * devicePixelRatio, vy: (Math.random() - 0.5) * 0.12 * devicePixelRatio, r: (Math.random() * 1.4 + 0.6) * devicePixelRatio })); }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) { d.x += d.vx; d.y += d.vy; if (d.x < 0 || d.x > w) d.vx *= -1; if (d.y < 0 || d.y > h) d.vy *= -1; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(138,155,173,0.45)'; ctx.fill(); }
      for (let a = 0; a < dots.length; a++) for (let b = a + 1; b < dots.length; b++) {
        const dx = dots[a].x - dots[b].x, dy = dots[a].y - dots[b].y, dist = Math.hypot(dx, dy), max = 120 * devicePixelRatio;
        if (dist < max) { ctx.beginPath(); ctx.moveTo(dots[a].x, dots[a].y); ctx.lineTo(dots[b].x, dots[b].y); ctx.strokeStyle = 'rgba(138,155,173,' + (0.14 * (1 - dist / max)) + ')'; ctx.lineWidth = devicePixelRatio * 0.6; ctx.stroke(); }
      }
      raf = requestAnimationFrame(draw);
    }
    resize(); init(); draw();
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { cancelAnimationFrame(raf); resize(); init(); draw(); }, 200); });
    const pio = new IntersectionObserver((entries) => { entries.forEach((e) => { if (e.isIntersecting) { if (!raf) draw(); } else { cancelAnimationFrame(raf); raf = null; } }); }, { threshold: 0 });
    pio.observe(canvas);
  }

  /* ---------- FAQ ---------- */
  document.querySelectorAll('.faq-q').forEach((q) => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item'); const a = item.querySelector('.faq-a');
      if (item.classList.contains('open')) { a.style.maxHeight = '0px'; item.classList.remove('open'); q.setAttribute('aria-expanded', 'false'); }
      else { item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; q.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* ---------- Booking modal ---------- */
  const modal = document.getElementById('booking-modal');
  if (modal) {
    let lastFocus = null;
    function open() { lastFocus = document.activeElement; modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); const f = modal.querySelector('input,select,button'); if (f) setTimeout(() => f.focus(), 60); }
    function close() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); if (lastFocus) lastFocus.focus(); }
    document.querySelectorAll('[data-open-booking]').forEach((o) => o.addEventListener('click', (e) => { e.preventDefault(); open(); }));
    modal.querySelectorAll('[data-close-booking]').forEach((c) => c.addEventListener('click', close));
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });
    const form = modal.querySelector('form');
    if (form) form.addEventListener('submit', (e) => {
      e.preventDefault();
      modal.querySelector('.modal-body').innerHTML = '<div class="modal-success"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg><h3>You\u2019re on the list.</h3><p>We\u2019ll reach out within one business day to lock in your 30-minute audit. Talk soon.</p></div>';
    });
  }

  /* ---------- Scroll progress ---------- */
  const progress = document.querySelector('.scroll-progress');
  if (progress) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const st = window.scrollY || document.documentElement.scrollTop;
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (docH > 0 ? (st / docH) * 100 : 0) + '%';
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Year + icons ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  if (window.lucide) window.lucide.createIcons();
})();
