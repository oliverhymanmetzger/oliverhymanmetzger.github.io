// Minimal endless runner. Space, up arrow, click, or tap to jump.
(function () {
  const canvas = document.getElementById('runner');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const GROUND = H - 28;

  const css = getComputedStyle(document.documentElement);
  const INK = css.getPropertyValue('--ink').trim() || '#1b1a17';
  const SOFT = css.getPropertyValue('--ink-soft').trim() || '#4a4843';
  const MUTED = css.getPropertyValue('--ink-muted').trim() || '#7b7872';
  const RULE = css.getPropertyValue('--rule').trim() || '#e4e0d8';
  const ACCENT = css.getPropertyValue('--accent').trim() || '#7a1f2b';

  let best = 0;
  try { best = parseInt(localStorage.getItem('runner-best') || '0', 10) || 0; } catch (e) {}

  const player = { x: 56, y: GROUND, w: 22, h: 30, vy: 0, onGround: true };
  let obstacles = [], clouds = [];
  let speed, score, state, frame, nextObstacle, legPhase;

  function reset() {
    obstacles = [];
    clouds = [{ x: 180, y: 40 }, { x: 520, y: 64 }];
    speed = 4.2; score = 0; frame = 0; nextObstacle = 70; legPhase = 0;
    player.y = GROUND; player.vy = 0; player.onGround = true;
    state = 'ready';
    draw();
  }

  function jump() {
    if (state === 'ready') { state = 'running'; loop(); }
    if (state === 'over') { reset(); return; }
    if (player.onGround) { player.vy = -9.6; player.onGround = false; }
  }

  function spawnObstacle() {
    const tall = Math.random() < 0.35;
    const double = Math.random() < 0.25;
    const w = double ? 30 : 14;
    const h = tall ? 40 : 26;
    obstacles.push({ x: W + 10, w, h, double });
    nextObstacle = 55 + Math.floor(Math.random() * 60) - Math.min(25, Math.floor(speed * 2));
  }

  function update() {
    frame++;
    if (frame % 6 === 0) score++;
    if (frame % 240 === 0) speed += 0.25;
    legPhase = Math.floor(frame / 6) % 2;

    player.vy += 0.55;
    player.y += player.vy;
    if (player.y >= GROUND) { player.y = GROUND; player.vy = 0; player.onGround = true; }

    if (--nextObstacle <= 0) spawnObstacle();
    for (const o of obstacles) o.x -= speed;
    obstacles = obstacles.filter(o => o.x + o.w > -10);

    for (const c of clouds) { c.x -= speed * 0.25; if (c.x < -60) { c.x = W + 40; c.y = 30 + Math.random() * 50; } }

    const px = player.x + 4, pw = player.w - 8, py = player.y - player.h + 4, ph = player.h - 4;
    for (const o of obstacles) {
      const ox = o.x, oy = GROUND - o.h;
      if (px < ox + o.w && px + pw > ox && py < GROUND && py + ph > oy) {
        state = 'over';
        if (score > best) { best = score; try { localStorage.setItem('runner-best', String(best)); } catch (e) {} }
      }
    }
  }

  function drawPlayer() {
    const x = player.x, y = player.y;
    ctx.fillStyle = ACCENT;
    ctx.fillRect(x, y - player.h, player.w, player.h - 8);          // body
    ctx.fillRect(x + 14, y - player.h - 8, 12, 12);                // head
    ctx.fillStyle = '#faf8f4';
    ctx.fillRect(x + 22, y - player.h - 5, 2, 2);                  // eye
    ctx.fillStyle = ACCENT;
    if (player.onGround && state === 'running') {
      if (legPhase) { ctx.fillRect(x + 2, y - 8, 6, 8); ctx.fillRect(x + 14, y - 8, 6, 5); }
      else { ctx.fillRect(x + 2, y - 8, 6, 5); ctx.fillRect(x + 14, y - 8, 6, 8); }
    } else {
      ctx.fillRect(x + 2, y - 8, 6, 6); ctx.fillRect(x + 14, y - 8, 6, 6);
    }
  }

  function drawObstacle(o) {
    ctx.fillStyle = INK;
    const y = GROUND - o.h;
    if (o.double) {
      ctx.fillRect(o.x, y + 6, 10, o.h - 6);
      ctx.fillRect(o.x + 18, y, 10, o.h);
      ctx.fillRect(o.x + 4, y + 14, 20, 4);
    } else {
      ctx.fillRect(o.x + 2, y, 10, o.h);
      ctx.fillRect(o.x, y + 10, 4, 10);
      ctx.fillRect(o.x + 10, y + 6, 4, 10);
    }
  }

  function drawCloud(c) {
    ctx.fillStyle = RULE;
    ctx.fillRect(c.x, c.y, 36, 6);
    ctx.fillRect(c.x + 8, c.y - 5, 20, 5);
  }

  function text(str, x, y, opts) {
    ctx.font = (opts.weight || 500) + ' ' + opts.size + 'px Inter, system-ui, sans-serif';
    ctx.fillStyle = opts.color || SOFT;
    ctx.textAlign = opts.align || 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(str, x, y);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    clouds.forEach(drawCloud);
    ctx.fillStyle = RULE;
    ctx.fillRect(0, GROUND, W, 2);
    ctx.fillStyle = MUTED;
    for (let i = 0; i < 14; i++) ctx.fillRect(((i * 61) - (frame * speed) % 61 + W) % W, GROUND + 8, 6, 1);

    obstacles.forEach(drawObstacle);
    drawPlayer();

    const pad = String(score).padStart(5, '0');
    text(pad, W - 16, 24, { size: 13, align: 'right', color: INK, weight: 600 });
    if (best) text('BEST ' + String(best).padStart(5, '0'), W - 72, 24, { size: 13, align: 'right', color: MUTED });

    if (state === 'ready') {
      ctx.font = '500 20px Newsreader, Georgia, serif';
      ctx.fillStyle = INK; ctx.textAlign = 'center';
      ctx.fillText('Press space or tap to run', W / 2, H / 2 - 6);
    } else if (state === 'over') {
      ctx.font = '500 22px Newsreader, Georgia, serif';
      ctx.fillStyle = INK; ctx.textAlign = 'center';
      ctx.fillText('Game over', W / 2, H / 2 - 10);
      text('Press space or tap to try again', W / 2, H / 2 + 14, { size: 13, align: 'center', color: MUTED });
    }
  }

  function loop() {
    if (state !== 'running') { draw(); return; }
    update();
    draw();
    if (state === 'running') requestAnimationFrame(loop);
  }

  function onKey(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      const r = canvas.getBoundingClientRect();
      const visible = r.bottom > 0 && r.top < window.innerHeight;
      if (!visible) return;
      e.preventDefault();
      jump();
    }
  }
  window.addEventListener('keydown', onKey);
  canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); jump(); });

  reset();
})();
