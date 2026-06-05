/* ============================================================
   smbautomation.ai — Interactions
   ============================================================ */
(function () {
  'use strict';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile nav ---------- */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  function closeNav() {
    if (!navLinks) return;
    navLinks.classList.remove('mobile-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
  }
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('mobile-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    // Close nav when a link inside it is clicked
    navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeNav));
    // Close nav when clicking outside
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('mobile-open') &&
          !navLinks.contains(e.target) &&
          !navToggle.contains(e.target)) {
        closeNav();
      }
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => io.observe(el));
    // Safety net: guarantee everything is visible even if IO misfires.
    setTimeout(() => { reveals.forEach((el) => el.classList.add('in')); }, 2600);
  }

  /* ---------- Count-up numbers ---------- */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const dur = 1600;
    if (prefersReduced) { el.textContent = prefix + target.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix; return; }
    let start = null;
    function tick(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = target * eased;
      el.textContent = prefix + val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + target.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
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

  /* ---------- Hero transcript animation ---------- */
  const transcript = document.querySelector('.transcript');
  const timerEl = document.querySelector('.phone-topbar .timer .t');
  if (transcript) {
    // Industry-specific demo scripts. The switcher swaps these live.
    const scripts = {
      hvac: {
        agent: 'Ava · AI Agent', spec: 'HVAC after-hours',
        lines: [
          { who: 'caller', tag: 'Caller', text: "Hi, my AC just died and it's 96 degrees in here." },
          { who: 'ai', text: "I'm sorry to hear that. I can get a technician out today. Are you in the Torrance area?" },
          { who: 'caller', tag: 'Caller', text: "Yeah, Torrance." },
          { who: 'ai', text: "Perfect. I have a 2:00 PM and a 4:30 PM slot open. Which works better?" },
          { who: 'caller', tag: 'Caller', text: "2 o'clock." },
          { who: 'ai', text: "Done — you're booked for 2:00 PM today. I've texted a confirmation to this number. Anything else?" }
        ]
      },
      dental: {
        agent: 'Maya · AI Agent', spec: 'Dental front desk',
        lines: [
          { who: 'caller', tag: 'Caller', text: "Hi, I chipped a tooth and I'm in a lot of pain." },
          { who: 'ai', text: "That sounds painful — let's get you seen. Are you an existing patient with us?" },
          { who: 'caller', tag: 'Caller', text: "No, first time." },
          { who: 'ai', text: "No problem. Dr. Patel has an emergency slot at 11:30 today. Shall I book it and text you the new-patient forms?" },
          { who: 'caller', tag: 'Caller', text: "Yes please." },
          { who: 'ai', text: "You're booked for 11:30. Forms are on their way by text. Feel better soon." }
        ]
      },
      restaurant: {
        agent: 'Leo · AI Agent', spec: 'Restaurant line',
        lines: [
          { who: 'caller', tag: 'Caller', text: "Hi, do you have a table for six tonight around 7?" },
          { who: 'ai', text: "Let me check — yes, I can seat six at 7:15 on the patio. Want me to hold it?" },
          { who: 'caller', tag: 'Caller', text: "Perfect, and one's gluten-free." },
          { who: 'ai', text: "Noted — I've flagged a gluten-free guest for the kitchen. Can I get a name for the reservation?" },
          { who: 'caller', tag: 'Caller', text: "Jordan." },
          { who: 'ai', text: "All set, Jordan — six at 7:15, gluten-free noted. Confirmation texted. See you tonight." }
        ]
      }
    };
    let current = 'hvac';
    function buildScript() {
      const v = scripts[current];
      return v.lines.map((l) => ({ who: l.who, tag: l.tag || v.agent, text: l.text }));
    }
    let script = buildScript();
    let i = 0;
    let started = false;
    let runToken = 0; // invalidates pending timeouts when the vertical changes
    function clearTranscript() { transcript.innerHTML = ''; }
    function addTyping(who) {
      const t = document.createElement('div');
      t.className = 'bubble ' + who + ' show typing-bubble';
      t.innerHTML = '<span class="typing"><span></span><span></span><span></span></span>';
      transcript.appendChild(t);
      return t;
    }
    function addBubble(item) {
      const b = document.createElement('div');
      b.className = 'bubble ' + item.who + ' show';
      b.innerHTML = '<span class="tag">' + item.tag + '</span>' + item.text;
      transcript.appendChild(b);
    }
    function next(token) {
      if (token !== runToken) return; // a vertical switch superseded this run
      if (i >= script.length) {
        setTimeout(() => { if (token !== runToken) return; clearTranscript(); i = 0; next(token); }, 3600);
        return;
      }
      const item = script[i];
      const typing = addTyping(item.who);
      const thinkTime = item.who === 'ai' ? 850 : 650;
      setTimeout(() => {
        if (token !== runToken) { typing.remove(); return; }
        typing.remove();
        addBubble(item);
        i++;
        const readTime = Math.min(1100 + item.text.length * 22, 2600);
        setTimeout(() => next(token), readTime);
      }, thinkTime);
    }
    function runStep() { startRun(); }
    function startRun() {
      started = true;
      runToken++;        // any prior chain sees a stale token and bails
      i = 0;
      clearTranscript();
      next(runToken);
    }

    // Industry switcher
    const avatarEl = document.querySelector('.phone-topbar .avatar');
    const roleEl = document.querySelector('.phone-topbar .who .role');
    const specEl = document.querySelector('.phone-spec.s1 .spec-label');
    function paintTabs(v) {
      document.querySelectorAll('[data-vertical]').forEach((x) => {
        const on = x.dataset.vertical === v;
        x.classList.toggle('active', on);
        x.style.setProperty('background-color', on ? '#F5A623' : 'transparent', 'important');
        x.style.setProperty('color', on ? '#1A1206' : '#8A9BAD', 'important');
      });
    }
    function switchVertical(v) {
      if (!scripts[v] || v === current) return;
      current = v;
      script = buildScript();
      paintTabs(v);
      if (avatarEl) avatarEl.textContent = scripts[v].agent.charAt(0);
      if (roleEl) roleEl.textContent = 'AI receptionist · ' + scripts[v].agent.split(' ')[0];
      if (specEl) specEl.textContent = scripts[v].spec;
      startRun(); // bumps token, resets index, clears, restarts cleanly
    }
    document.querySelectorAll('[data-vertical]').forEach((b) => {
      b.addEventListener('click', () => {
        switchVertical(b.dataset.vertical);
      });
    });
    paintTabs('hvac'); // initial active state, painted from the single source of truth

    // call timer
    let secs = 0;
    if (timerEl && !prefersReduced) {
      setInterval(() => {
        secs++;
        const m = String(Math.floor(secs / 60)).padStart(2, '0');
        const s = String(secs % 60).padStart(2, '0');
        timerEl.textContent = m + ':' + s;
      }, 1000);
    }

    if (prefersReduced) {
      script.forEach((item) => addBubble(item));
    } else {
      function kick() { if (started) return; startRun(); }
      // The hero phone is above the fold — start shortly after load.
      setTimeout(kick, 600);
      // Safety net: also start if/when it scrolls into view.
      const tio = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { kick(); tio.disconnect(); } });
      }, { threshold: 0.15 });
      tio.observe(transcript);
    }
  }

  /* ---------- Hero particle grid (lightweight canvas) ---------- */
  const canvas = document.querySelector('canvas.particles');
  if (canvas && !prefersReduced) {
    const ctx = canvas.getContext('2d');
    let w, h, dots, raf;
    const COUNT = 38;
    function resize() {
      const r = canvas.parentElement.getBoundingClientRect();
      w = canvas.width = r.width * devicePixelRatio;
      h = canvas.height = r.height * devicePixelRatio;
      canvas.style.width = r.width + 'px';
      canvas.style.height = r.height + 'px';
    }
    function init() {
      dots = Array.from({ length: COUNT }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12 * devicePixelRatio,
        vy: (Math.random() - 0.5) * 0.12 * devicePixelRatio,
        r: (Math.random() * 1.4 + 0.6) * devicePixelRatio
      }));
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(138,155,173,0.45)';
        ctx.fill();
      }
      // connect nearby
      for (let a = 0; a < dots.length; a++) {
        for (let b = a + 1; b < dots.length; b++) {
          const dx = dots[a].x - dots[b].x, dy = dots[a].y - dots[b].y;
          const dist = Math.hypot(dx, dy);
          const max = 120 * devicePixelRatio;
          if (dist < max) {
            ctx.beginPath();
            ctx.moveTo(dots[a].x, dots[a].y);
            ctx.lineTo(dots[b].x, dots[b].y);
            ctx.strokeStyle = 'rgba(138,155,173,' + (0.14 * (1 - dist / max)) + ')';
            ctx.lineWidth = devicePixelRatio * 0.6;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }
    resize(); init(); draw();
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { cancelAnimationFrame(raf); resize(); init(); draw(); }, 200); });
    // pause when offscreen
    const pio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { if (!raf) draw(); }
        else { cancelAnimationFrame(raf); raf = null; }
      });
    }, { threshold: 0 });
    pio.observe(canvas);
  }

  /* ---------- Pricing annual/monthly toggle ---------- */
  const priceToggle = document.querySelector('.price-toggle');
  if (priceToggle) {
    priceToggle.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      priceToggle.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const annual = btn.dataset.cycle === 'annual';
      document.querySelectorAll('[data-monthly]').forEach((el) => {
        const m = parseFloat(el.dataset.monthly);
        if (!m) return;
        const shown = annual ? Math.round(m * 0.9) : m;
        el.textContent = '$' + shown.toLocaleString('en-US');
      });
      document.querySelectorAll('[data-cycle-label]').forEach((el) => {
        el.textContent = annual ? '/mo · billed annually' : '/mo';
      });
    });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-q').forEach((q) => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const a = item.querySelector('.faq-a');
      const isOpen = item.classList.contains('open');
      if (isOpen) {
        a.style.maxHeight = '0px';
        item.classList.remove('open');
        q.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
        q.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- ROI Calculator ---------- */
  const roi = document.getElementById('roi');
  if (roi) {
    const state = {
      biz: 'home',          // home | pro | restaurant | retail
      calls: 60,            // calls/week
      hours: 6,             // hours/week manual follow-up
      jobValue: 350         // avg job value
    };
    // per-vertical assumptions: missed-call rate, close rate on recovered call
    const verticals = {
      home:       { miss: 0.27, close: 0.42, label: 'Home services' },
      pro:        { miss: 0.22, close: 0.38, label: 'Professional' },
      restaurant: { miss: 0.30, close: 0.30, label: 'Restaurant' },
      retail:     { miss: 0.24, close: 0.34, label: 'Retail / other' }
    };
    const HOURLY = 38; // loaded cost of staff time

    const out = {
      revenue: roi.querySelector('[data-out="revenue"]'),
      jobs: roi.querySelector('[data-out="jobs"]'),
      hours: roi.querySelector('[data-out="hours"]')
    };

    function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }

    function compute() {
      const v = verticals[state.biz];
      const missedPerWk = state.calls * v.miss;
      const recoveredJobs = missedPerWk * v.close * 52;
      const recoveredRevenue = recoveredJobs * state.jobValue;
      const timeValue = state.hours * 52 * HOURLY;
      const totalAnnual = recoveredRevenue + timeValue;
      // animate the big number
      animateTo(out.revenue, totalAnnual, (val) => money(val));
      if (out.jobs) out.jobs.textContent = Math.round(recoveredJobs).toLocaleString('en-US');
      if (out.hours) out.hours.textContent = Math.round(state.hours * 52).toLocaleString('en-US');
    }

    let animRaf;
    function animateTo(el, target, fmt) {
      if (!el) return;
      if (prefersReduced) { el.textContent = fmt(target); return; }
      cancelAnimationFrame(animRaf);
      const from = parseFloat(el.dataset.cur || '0');
      const start = performance.now();
      const dur = 600;
      function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = from + (target - from) * eased;
        el.textContent = fmt(val);
        if (p < 1) animRaf = requestAnimationFrame(tick);
        else { el.dataset.cur = target; }
      }
      animRaf = requestAnimationFrame(tick);
    }

    // business-type segmented control
    roi.querySelectorAll('[data-biz]').forEach((b) => {
      b.addEventListener('click', () => {
        roi.querySelectorAll('[data-biz]').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        state.biz = b.dataset.biz;
        compute();
      });
    });
    // sliders
    const callsSlider = roi.querySelector('#roi-calls');
    const hoursSlider = roi.querySelector('#roi-hours');
    const jobSlider = roi.querySelector('#roi-job');
    function bindSlider(slider, key, labelEl, fmt) {
      if (!slider) return;
      slider.addEventListener('input', () => {
        state[key] = parseFloat(slider.value);
        if (labelEl) labelEl.textContent = fmt(state[key]);
        compute();
      });
    }
    bindSlider(callsSlider, 'calls', roi.querySelector('[data-val="calls"]'), (v) => v + '/wk');
    bindSlider(hoursSlider, 'hours', roi.querySelector('[data-val="hours"]'), (v) => v + ' hrs/wk');
    bindSlider(jobSlider, 'jobValue', roi.querySelector('[data-val="job"]'), (v) => '$' + v);

    // email capture
    const roiForm = roi.querySelector('.roi-capture form');
    if (roiForm) {
      roiForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const wrap = roi.querySelector('.roi-capture');
        const emailInput = roiForm.querySelector('input[type="email"]');
        const email = emailInput ? emailInput.value : '';
        // Submit to Netlify Forms (fire-and-forget)
        fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(roiForm)).toString()
        }).catch(() => {});
        wrap.innerHTML = '<div style="display:flex;align-items:center;gap:12px;color:var(--green);font-weight:600;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>Report on its way to ' + email + '</div><p class="note" style="margin-top:8px;">We\u2019ll send a full breakdown plus the 5 automations to run this week. No spam.</p>';
      });
    }

    compute();
  }

  /* ---------- Booking modal ---------- */
  const modal = document.getElementById('booking-modal');
  if (modal) {
    const openers = document.querySelectorAll('[data-open-booking]');
    const closers = modal.querySelectorAll('[data-close-booking]');
    let lastFocus = null;
    function openModal() { lastFocus = document.activeElement; modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); const f = modal.querySelector('input,select,button'); if (f) setTimeout(() => f.focus(), 60); }
    function closeModal() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); if (lastFocus) lastFocus.focus(); }
    openers.forEach((o) => o.addEventListener('click', (e) => { e.preventDefault(); openModal(); }));
    closers.forEach((c) => c.addEventListener('click', closeModal));
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
    const form = modal.querySelector('form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        // Submit to Netlify Forms (fire-and-forget)
        fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString()
        }).catch(() => {});
        // Show success state
        const body = modal.querySelector('.modal-body');
        const successDiv = document.createElement('div');
        successDiv.className = 'modal-success';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.innerHTML = '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>';
        const h3 = document.createElement('h3');
        h3.textContent = 'You\u2019re on the list.';
        const p = document.createElement('p');
        p.textContent = 'We\u2019ll reach out within one business day to lock in your 30-minute audit. Talk soon.';
        successDiv.appendChild(svg);
        successDiv.appendChild(h3);
        successDiv.appendChild(p);
        body.textContent = '';
        body.appendChild(successDiv);
      });
    }
  }

  /* ---------- Scroll progress + scroll-spy ---------- */
  const progress = document.querySelector('.scroll-progress');
  const spyLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  const spySections = spyLinks
    .map((a) => document.getElementById(a.getAttribute('href').slice(1)))
    .filter(Boolean);
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const st = window.scrollY || document.documentElement.scrollTop;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.width = (docH > 0 ? (st / docH) * 100 : 0) + '%';
      // scroll-spy: last section whose top has passed 40% of viewport
      let activeId = null;
      const mark = window.innerHeight * 0.4;
      for (const sec of spySections) {
        if (sec.getBoundingClientRect().top <= mark) activeId = sec.id;
      }
      spyLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + activeId));
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Lucide icons ---------- */
  if (window.lucide) window.lucide.createIcons();
})();
