/* =========================================================
   THE SAMYRAH EXPERIENCE — script
   ========================================================= */
(() => {
  "use strict";

  const rand = (a, b) => a + Math.random() * (b - a);
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  const easeInOutSine = t => -(Math.cos(Math.PI * t) - 1) / 2;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const PALETTE = ['#ff2e7e','#e8a3a3','#ff3d54','#9b5de5','#c8a8f0','#ffb38a','#ff7e6b','#ffd166','#ef3fa6','#6ec6ff','#ffd6e0','#ffffff'];
  const HEART_EMOJI = ['❤️','💖','💗','💓','💞','💕','💘','💝','💜','💙','💛','💚'];
  const GARDEN_EMOJI = ['❤️','🌹','✨','💫','🦋','💌','⭐'];
  const GARDEN_LABELS = ['I Love You','My Queen','Beautiful Samyrah','Forever Yours','My Happiness','My Everything','My Future','My Heart'];

  /* =========================================================
     0. HEART MATH (used by intro canvas)
     ========================================================= */
  function heartPoint(t) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return { x, y: -y };
  }

  /* =========================================================
     1. CINEMATIC INTRO
     ========================================================= */
  const introCanvas = document.getElementById('introCanvas');
  const ictx = introCanvas.getContext('2d');
  let iw, ih, iscale, icx, icy;

  function sizeIntro() {
    iw = introCanvas.width = window.innerWidth * devicePixelRatio;
    ih = introCanvas.height = window.innerHeight * devicePixelRatio;
    introCanvas.style.width = window.innerWidth + 'px';
    introCanvas.style.height = window.innerHeight + 'px';
    icx = iw / 2; icy = ih / 2;
    iscale = Math.min(iw, ih) / 26;
  }
  sizeIntro();
  window.addEventListener('resize', sizeIntro);

  const PCOUNT = prefersReducedMotion ? 0 : (window.innerWidth < 700 ? 160 : 320);
  const particles = [];
  for (let i = 0; i < PCOUNT; i++) {
    const t = rand(0, Math.PI * 2);
    const r = Math.sqrt(Math.random());
    const hp = heartPoint(t);
    particles.push({
      x: rand(0, iw), y: ih + rand(0, ih * 0.6),
      tx: icx + hp.x * iscale * r, ty: icy + hp.y * iscale * r,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      size: rand(1.5, 4) * devicePixelRatio,
      phase: rand(0, Math.PI * 2),
      converged: false
    });
  }

  let introStage = 'flow'; // flow -> converge -> beat -> explode -> done
  let stageStart = performance.now();
  let beatScale = 1;
  let explodeVel = [];

  function introLoop(now) {
    const t = now - stageStart;
    ictx.clearRect(0, 0, iw, ih);

    if (introStage === 'flow') {
      const prog = Math.min(t / 1800, 1);
      particles.forEach(p => {
        p.y -= (2.2 + Math.sin(p.phase) * 0.6) * devicePixelRatio;
        p.x += Math.sin((now / 800) + p.phase) * 0.6 * devicePixelRatio;
        if (p.y < -20) p.y = ih + rand(0, 100);
        drawDot(p.x, p.y, p.size, p.color, 0.85);
      });
      if (prog >= 1) { introStage = 'converge'; stageStart = now; }
    }

    else if (introStage === 'converge') {
      const prog = Math.min(t / 1500, 1);
      const e = easeOutCubic(prog);
      particles.forEach(p => {
        const cx = lerp(p.x0 ?? (p.x0 = p.x), p.tx, e);
        const cy = lerp(p.y0 ?? (p.y0 = p.y), p.ty, e);
        drawDot(cx, cy, p.size, p.color, 0.95);
        p._cx = cx; p._cy = cy;
      });
      if (prog >= 1) {
        introStage = 'beat'; stageStart = now;
        document.getElementById('whisperLine').classList.add('show-text');
      }
    }

    else if (introStage === 'beat') {
      const cyc = (t % 1600) / 1600;
      const pulse = 1 + Math.sin(cyc * Math.PI * 2) * 0.06 * easeInOutSine(Math.min(t / 600, 1));
      particles.forEach(p => {
        const dx = p.tx - icx, dy = p.ty - icy;
        const x = icx + dx * pulse, y = icy + dy * pulse;
        drawDot(x, y, p.size, p.color, 1);
        p._cx = x; p._cy = y;
      });
      if (t > 1900) document.getElementById('loveLine').classList.add('show-text');
      if (t > 3600) { introStage = 'explode'; stageStart = now;
        particles.forEach(p => {
          const ang = Math.atan2(p.ty - icy, p.tx - icx) + rand(-0.4, 0.4);
          const speed = rand(4, 13) * devicePixelRatio;
          explodeVel.push({ vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed });
        });
      }
    }

    else if (introStage === 'explode') {
      const prog = Math.min(t / 1700, 1);
      particles.forEach((p, i) => {
        const v = explodeVel[i];
        const x = p._cx + v.vx * (t / 16);
        const y = p._cy + v.vy * (t / 16) + (t * t) * 0.00002;
        drawDot(x, y, p.size, p.color, 1 - prog);
      });
      if (prog >= 1) { introStage = 'done'; finishIntro(); return; }
    }

    if (introStage !== 'done') requestAnimationFrame(introLoop);
  }

  function drawDot(x, y, size, color, alpha) {
    ictx.save();
    ictx.globalAlpha = alpha;
    ictx.fillStyle = color;
    ictx.shadowColor = color;
    ictx.shadowBlur = size * 3;
    ictx.beginPath();
    ictx.arc(x, y, size, 0, Math.PI * 2);
    ictx.fill();
    ictx.restore();
  }

  let introFinished = false;
  function finishIntro() {
    if (introFinished) return;
    introFinished = true;
    const intro = document.getElementById('intro');
    intro.classList.add('fade-out');
    setTimeout(() => {
      intro.style.display = 'none';
      revealMain();
    }, 1100);
  }

  document.getElementById('skipIntro').addEventListener('click', () => {
    introStage = 'done';
    finishIntro();
  });

  if (prefersReducedMotion) {
    finishIntro();
  } else {
    requestAnimationFrame(introLoop);
  }

  /* =========================================================
     2. REVEAL MAIN EXPERIENCE
     ========================================================= */
  function revealMain() {
    const main = document.getElementById('main');
    main.classList.remove('hidden');
    document.body.classList.remove('intro-active');
    document.body.style.overflow = '';
    startAmbientAudio();
    initScrollReveals();
    initTimelineReveal();
    initHeroTypewriter();
    initCounter();
    initGarden();
    initEnvelope();
    initSurprise();
    initFinaleStars();
    initCursorFX();
  }

  /* =========================================================
     3. AMBIENT AUDIO (synthesized — no external file needed)
     ========================================================= */
  let audioCtx, masterGain, analyser, osc1, osc2, lfo, lfoGain, isPlaying = false;

  function buildAudioGraph() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = document.getElementById('volumeSlider').value / 100 * 0.18;

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;

    osc1 = audioCtx.createOscillator();
    osc1.type = 'sine'; osc1.frequency.value = 220;
    osc2 = audioCtx.createOscillator();
    osc2.type = 'sine'; osc2.frequency.value = 277.18; // major third — warm pad
    const osc3 = audioCtx.createOscillator();
    osc3.type = 'sine'; osc3.frequency.value = 329.63;

    lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.12;
    lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 6;
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    const mix = audioCtx.createGain();
    mix.gain.value = 0.33;
    osc1.connect(mix); osc2.connect(mix); osc3.connect(mix);
    mix.connect(masterGain);
    masterGain.connect(analyser);
    analyser.connect(audioCtx.destination);

    osc1.start(); osc2.start(); osc3.start(); lfo.start();
  }

  function startAmbientAudio() {
    if (prefersReducedMotion) return;
    try {
      if (!audioCtx) buildAudioGraph();
      audioCtx.resume().then(() => {
        isPlaying = true;
        updatePlayIcon();
        drawVisualizer();
      }).catch(() => { armGestureStart(); });
    } catch (e) { /* audio unavailable — silently continue */ }
  }

  function armGestureStart() {
    const start = () => {
      if (audioCtx) audioCtx.resume().then(() => { isPlaying = true; updatePlayIcon(); drawVisualizer(); });
      document.removeEventListener('pointerdown', start);
    };
    document.addEventListener('pointerdown', start, { once: true });
  }

  function updatePlayIcon() {
    document.getElementById('iconPlay').style.display = isPlaying ? 'none' : 'block';
    document.getElementById('iconPause').style.display = isPlaying ? 'block' : 'none';
  }

  document.getElementById('audioToggle').addEventListener('click', () => {
    if (!audioCtx) buildAudioGraph();
    if (isPlaying) { audioCtx.suspend(); isPlaying = false; }
    else { audioCtx.resume(); isPlaying = true; drawVisualizer(); }
    updatePlayIcon();
  });

  document.getElementById('volumeSlider').addEventListener('input', e => {
    if (masterGain) masterGain.gain.value = (e.target.value / 100) * 0.18;
  });

  const vizCanvas = document.getElementById('visualizer');
  const vctx = vizCanvas.getContext('2d');
  function drawVisualizer() {
    if (!analyser || !isPlaying) { vctx.clearRect(0, 0, 60, 22); return; }
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    vctx.clearRect(0, 0, 60, 22);
    const bars = 8;
    for (let i = 0; i < bars; i++) {
      const v = data[i] / 255;
      const h = Math.max(2, v * 20);
      vctx.fillStyle = PALETTE[i % PALETTE.length];
      vctx.fillRect(i * 7.5, 22 - h, 5, h);
    }
    requestAnimationFrame(drawVisualizer);
  }

  /* =========================================================
     4. SCROLL REVEALS (GSAP if available, else IO fallback)
     ========================================================= */
  function initScrollReveals() {
    const items = document.querySelectorAll('[data-reveal]');
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      items.forEach(el => {
        gsap.to(el, {
          opacity: 1, y: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%' }
        });
      });
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.style.transition = 'opacity .9s ease, transform .9s ease';
            e.target.style.opacity = 1;
            e.target.style.transform = 'translateY(0)';
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.2 });
      items.forEach(el => io.observe(el));
    }
  }

  function initTimelineReveal() {
    const cards = document.querySelectorAll('.timeline-card');
    if (window.gsap && window.ScrollTrigger) {
      cards.forEach(card => {
        const fromX = card.dataset.side === 'left' ? -60 : 60;
        gsap.fromTo(card, { opacity: 0, x: fromX }, {
          opacity: 1, x: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 85%' }
        });
      });
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.style.transition = 'opacity .9s ease, transform .9s ease';
            e.target.style.opacity = 1;
            e.target.style.transform = 'translateX(0)';
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.2 });
      cards.forEach(el => io.observe(el));
    }
  }

  /* =========================================================
     5. HERO TYPEWRITER
     ========================================================= */
  function initHeroTypewriter() {
    const text = `Distance may separate us,
but never our hearts.

Every smile you give me
becomes a beautiful memory.

Every message from you
brightens my day.

You are my happiness.
You are my peace.
You are my favorite person.

And every day, I love you more.`;
    const el = document.getElementById('heroTypewriter');
    let started = false;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !started) {
          started = true;
          typeText(el, text, 28);
          io.disconnect();
        }
      });
    }, { threshold: 0.4 });
    io.observe(document.getElementById('heroMessage'));
  }

  function typeText(el, text, speed) {
    let i = 0;
    el.textContent = '';
    const id = setInterval(() => {
      el.textContent += text[i];
      i++;
      if (i >= text.length) clearInterval(id);
    }, speed);
  }

  /* =========================================================
     6. LOVE COUNTER
     ========================================================= */
  function initCounter() {
    const numEl = document.getElementById('counterNumber');
    const resultEl = document.getElementById('counterResult');
    const milestones = [1, 10, 100, 1000, 1000000];
    let started = false;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !started) {
          started = true;
          runCounter();
          io.disconnect();
        }
      });
    }, { threshold: 0.5 });
    io.observe(document.getElementById('counterSection'));

    function runCounter() {
      let idx = 0;
      function step() {
        if (idx >= milestones.length) {
          numEl.textContent = '∞';
          resultEl.textContent = 'The number is too large to calculate.';
          return;
        }
        animateNumber(numEl, milestones[idx], 700, () => {
          idx++;
          setTimeout(step, 260);
        });
      }
      step();
    }
  }

  function animateNumber(el, target, duration, done) {
    const start = parseInt(el.textContent.replace(/[^\d]/g, '')) || 0;
    const t0 = performance.now();
    function frame(now) {
      const p = Math.min((now - t0) / duration, 1);
      const val = Math.round(lerp(start, target, easeOutCubic(p)));
      el.textContent = val.toLocaleString();
      if (p < 1) requestAnimationFrame(frame); else done && done();
    }
    requestAnimationFrame(frame);
  }

  /* =========================================================
     7. INTERACTIVE LOVE GARDEN
     ========================================================= */
  function initGarden() {
    const field = document.getElementById('gardenField');
    let lastSpawn = 0;

    function spawnBurst(x, y, withLabel) {
      const count = 6 + Math.floor(Math.random() * 5);
      for (let i = 0; i < count; i++) {
        const span = document.createElement('span');
        span.className = 'garden-spark';
        span.textContent = GARDEN_EMOJI[Math.floor(Math.random() * GARDEN_EMOJI.length)];
        const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        span.style.color = color;
        span.style.left = x + 'px';
        span.style.top = y + 'px';
        field.appendChild(span);

        const ang = rand(0, Math.PI * 2);
        const dist = rand(40, 140);
        const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 40;

        span.animate([
          { transform: 'translate(-50%,-50%) scale(0.3)', opacity: 0 },
          { transform: `translate(${dx * 0.4 - 50}%,${dy * 0.4 - 50}%) scale(1.1)`, opacity: 1, offset: 0.3 },
          { transform: `translate(calc(${dx}px - 50%), calc(${dy - 60}px - 50%)) scale(0.8)`, opacity: 0 }
        ], { duration: 1400 + Math.random() * 600, easing: 'cubic-bezier(.2,.8,.3,1)' });

        setTimeout(() => span.remove(), 2100);
      }

      if (withLabel) {
        const label = document.createElement('span');
        label.className = 'garden-label';
        label.textContent = GARDEN_LABELS[Math.floor(Math.random() * GARDEN_LABELS.length)];
        label.style.left = x + 'px';
        label.style.top = y + 'px';
        label.style.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        field.appendChild(label);
        label.animate([
          { transform: 'translate(-50%,-50%)', opacity: 0 },
          { transform: 'translate(-50%,-150%)', opacity: 1, offset: 0.25 },
          { transform: 'translate(-50%,-260%)', opacity: 0 }
        ], { duration: 1800, easing: 'ease-out' });
        setTimeout(() => label.remove(), 1850);
      }
    }

    function getPos(e, rect) {
      const point = e.touches ? e.touches[0] : e;
      return { x: point.clientX - rect.left, y: point.clientY - rect.top };
    }

    field.addEventListener('pointerdown', (e) => {
      const rect = field.getBoundingClientRect();
      const { x, y } = getPos(e, rect);
      spawnBurst(x, y, true);
    });
    field.addEventListener('pointermove', (e) => {
      if (e.buttons !== 1 && e.pointerType !== 'touch') return;
      const now = performance.now();
      if (now - lastSpawn < 90) return;
      lastSpawn = now;
      const rect = field.getBoundingClientRect();
      const { x, y } = getPos(e, rect);
      spawnBurst(x, y, false);
    });

    // gentle ambient sparkle even without interaction
    if (!prefersReducedMotion) {
      setInterval(() => {
        const rect = field.getBoundingClientRect();
        if (rect.width === 0) return;
        spawnBurst(rand(rect.width * 0.1, rect.width * 0.9), rand(rect.height * 0.3, rect.height * 0.8), false);
      }, 1800);
    }
  }

  /* =========================================================
     8. LOVE LETTER ENVELOPE
     ========================================================= */
  function initEnvelope() {
    const envelope = document.getElementById('envelope');
    const letterBody = document.getElementById('letterBody');
    const text = `Wherever you are, my heart already knows the way to you.

Every laugh you share, every little message you send, every quiet moment we spend together — I keep them all like treasures.

You make ordinary days feel like something worth remembering.

This letter won't be the last. There will be many more, for as long as you'll have me.

I love you, today and always.`;
    let opened = false;

    function toggle() {
      opened = !opened;
      envelope.classList.toggle('open', opened);
      envelope.setAttribute('aria-expanded', String(opened));
      if (opened && !letterBody.dataset.typed) {
        letterBody.dataset.typed = '1';
        setTimeout(() => typeText(letterBody, text, 18), 600);
      }
    }
    envelope.addEventListener('click', toggle);
    envelope.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  }

  /* =========================================================
     9. SURPRISE BUTTON — fireworks + confetti + shake
     ========================================================= */
  function initSurprise() {
    const btn = document.getElementById('surpriseBtn');
    const overlay = document.getElementById('surpriseOverlay');
    const closeBtn = document.getElementById('closeSurprise');
    const canvas = document.getElementById('fireworksCanvas');
    const ctx = canvas.getContext('2d');
    let fwParticles = [];
    let raf;

    function sizeFw() {
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    }
    sizeFw();
    window.addEventListener('resize', sizeFw);

    function burstFirework() {
      const x = rand(canvas.width * 0.2, canvas.width * 0.8);
      const y = rand(canvas.height * 0.2, canvas.height * 0.55);
      const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      const n = 40;
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2;
        const speed = rand(2, 7) * devicePixelRatio;
        fwParticles.push({
          x, y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
          color, life: 1, isHeart: Math.random() < 0.3
        });
      }
    }

    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      fwParticles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.04 * devicePixelRatio;
        p.life -= 0.012;
        ctx.save();
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        if (p.isHeart) {
          ctx.font = `${14 * devicePixelRatio}px serif`;
          ctx.fillText('❤', p.x, p.y);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.6 * devicePixelRatio, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
      fwParticles = fwParticles.filter(p => p.life > 0);
      if (overlay.classList.contains('open')) {
        if (Math.random() < 0.04) burstFirework();
        raf = requestAnimationFrame(loop);
      }
    }

    function spawnConfettiDOM() {
      for (let i = 0; i < 40; i++) {
        const c = document.createElement('div');
        const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        c.textContent = Math.random() < 0.5 ? '🌹' : (Math.random() < 0.5 ? '✨' : '❤️');
        c.style.cssText = `position:fixed;top:-30px;left:${rand(0,100)}vw;font-size:${rand(14,26)}px;z-index:201;pointer-events:none;color:${color};`;
        document.body.appendChild(c);
        c.animate([
          { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
          { transform: `translateY(110vh) rotate(${rand(180,720)}deg)`, opacity: 0.9 }
        ], { duration: rand(2200, 4200), easing: 'ease-in' });
        setTimeout(() => c.remove(), 4300);
      }
    }

    btn.addEventListener('click', () => {
      overlay.classList.add('open');
      document.body.classList.add('screen-shake');
      setTimeout(() => document.body.classList.remove('screen-shake'), 520);
      burstFirework(); burstFirework();
      spawnConfettiDOM();
      cancelAnimationFrame(raf);
      loop();
    });

    closeBtn.addEventListener('click', () => {
      overlay.classList.remove('open');
      fwParticles = [];
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { overlay.classList.remove('open'); fwParticles = []; }
    });
  }

  /* =========================================================
     10. STARRY NIGHT FINALE — stars converge into text
     ========================================================= */
  function initFinaleStars() {
    const canvas = document.getElementById('starCanvas');
    const ctx = canvas.getContext('2d');
    let w, h;

    function size() {
      const rect = canvas.parentElement.getBoundingClientRect();
      w = canvas.width = rect.width * devicePixelRatio;
      h = canvas.height = rect.height * devicePixelRatio;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    }
    size();
    window.addEventListener('resize', size);

    // sample target points from offscreen text render
    function getTextPoints(text, fontSize, maxPoints) {
      const off = document.createElement('canvas');
      off.width = w; off.height = h;
      const octx = off.getContext('2d');
      octx.fillStyle = '#fff';
      octx.font = `700 ${fontSize}px Playfair Display, serif`;
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.fillText(text, w / 2, h / 2);
      const data = octx.getImageData(0, 0, w, h).data;
      const points = [];
      const step = Math.max(2, Math.floor(devicePixelRatio));
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const a = data[(y * w + x) * 4 + 3];
          if (a > 120) points.push({ x, y });
        }
      }
      // shuffle + sample
      for (let i = points.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [points[i], points[j]] = [points[j], points[i]];
      }
      return points.slice(0, maxPoints);
    }

    const STAR_COUNT = prefersReducedMotion ? 0 : (window.innerWidth < 700 ? 220 : 420);
    let stars = [];
    let targets = [];
    let phase = 'scatter';
    let phaseStart = performance.now();
    let started = false;

    function buildStars() {
      const fontSize = Math.min(w, h * 1.6) * 0.085;
      targets = getTextPoints('AZIRY ❤ SAMYRAH', fontSize, STAR_COUNT);
      stars = targets.map(t => ({
        x: rand(0, w), y: rand(0, h),
        tx: t.x, ty: t.y,
        twinklePhase: rand(0, Math.PI * 2),
        size: rand(1, 2.4) * devicePixelRatio
      }));
      // a few extra purely ambient twinkles (not part of the text)
      for (let i = 0; i < 80; i++) {
        stars.push({
          x: rand(0, w), y: rand(0, h), tx: null, ty: null,
          twinklePhase: rand(0, Math.PI * 2), size: rand(0.6, 1.6) * devicePixelRatio
        });
      }
    }

    function loop(now) {
      ctx.clearRect(0, 0, w, h);
      const t = now - phaseStart;

      stars.forEach(s => {
        let x = s.x, y = s.y;
        if (s.tx !== null) {
          if (phase === 'converge') {
            const e = easeOutCubic(Math.min(t / 2600, 1));
            x = lerp(s.x, s.tx, e);
            y = lerp(s.y, s.ty, e);
          } else if (phase === 'formed') {
            x = s.tx; y = s.ty;
          }
        }
        const tw = 0.5 + Math.sin(now / 500 + s.twinklePhase) * 0.5;
        ctx.save();
        ctx.globalAlpha = 0.4 + tw * 0.6;
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#ffd6e0';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(x, y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      if (phase === 'scatter' && t > 1200) { phase = 'converge'; phaseStart = now; }
      if (phase === 'converge' && t > 2700) { phase = 'formed'; phaseStart = now; }

      requestAnimationFrame(loop);
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !started) {
          started = true;
          buildStars();
          phase = 'scatter'; phaseStart = performance.now();
          if (!prefersReducedMotion) requestAnimationFrame(loop);
        }
      });
    }, { threshold: 0.3 });
    io.observe(document.getElementById('finaleSection'));
  }

  /* =========================================================
     11. CURSOR GLOW + MOUSE-FOLLOWER HEARTS
     ========================================================= */
  function initCursorFX() {
    if (prefersReducedMotion || window.matchMedia('(hover:none)').matches) return;
    const glow = document.getElementById('cursorGlow');
    let lastHeart = 0;

    window.addEventListener('pointermove', (e) => {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';

      const now = performance.now();
      if (now - lastHeart > 140) {
        lastHeart = now;
        const h = document.createElement('span');
        h.className = 'mini-heart';
        h.textContent = HEART_EMOJI[Math.floor(Math.random() * HEART_EMOJI.length)];
        h.style.left = e.clientX + 'px';
        h.style.top = e.clientY + 'px';
        h.style.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        document.body.appendChild(h);
        h.animate([
          { transform: 'translate(-50%,-50%) scale(0.6)', opacity: 0.9 },
          { transform: `translate(-50%, -150%) scale(1)`, opacity: 0 }
        ], { duration: 900, easing: 'ease-out' });
        setTimeout(() => h.remove(), 950);
      }
    }, { passive: true });
  }

})();
