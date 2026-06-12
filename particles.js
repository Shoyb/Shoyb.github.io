/**
 * particles.js
 * Animated node-graph background with mouse interaction.
 * Nodes gently float around; they're attracted toward the cursor
 * and connected by lines when close enough.
 *
 * To tweak behaviour, change the CONFIG values below.
 */

(function () {
  const CONFIG = {
    nodeCount:       100,      // number of nodes
    connectDist:     130,     // max distance to draw an edge (px)
    mouseRadius:     160,     // radius of mouse influence (px)
    mouseStrength:   0.012,   // how strongly nodes pull toward cursor (0–1)
    baseSpeed:       0.28,    // max starting velocity
    nodeMinR:        2.5,     // min node radius (increased)
    nodeMaxR:        4,       // max node radius (increased)
    accentRGB:       '123,124,248',
  };

  const canvas = document.getElementById('particle-canvas');
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  let W, H, nodes = [], mouse = { x: -9999, y: -9999 }, raf;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Setup ── */
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initNodes();
  }

  function initNodes() {
    nodes = Array.from({ length: CONFIG.nodeCount }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H,
      vx:    (Math.random() - 0.5) * CONFIG.baseSpeed * 2,
      vy:    (Math.random() - 0.5) * CONFIG.baseSpeed * 2,
      r:     CONFIG.nodeMinR + Math.random() * (CONFIG.nodeMaxR - CONFIG.nodeMinR),
      phase: Math.random() * Math.PI * 2,
    }));
  }

  /* ── Mouse tracking ── */
  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // Touch support
  window.addEventListener('touchmove', e => {
    if (e.touches.length > 0) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  /* ── Draw loop ── */
  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    /* Move nodes */
    nodes.forEach(n => {
      /* Mouse attraction */
      const dx = mouse.x - n.x;
      const dy = mouse.y - n.y;
      const dist = Math.hypot(dx, dy);

      if (dist < CONFIG.mouseRadius && dist > 1) {
        const force = (1 - dist / CONFIG.mouseRadius) * CONFIG.mouseStrength;
        n.vx += dx / dist * force;
        n.vy += dy / dist * force;
      }

      /* Speed cap */
      const speed = Math.hypot(n.vx, n.vy);
      const maxSpeed = CONFIG.baseSpeed * 3;
      if (speed > maxSpeed) {
        n.vx = (n.vx / speed) * maxSpeed;
        n.vy = (n.vy / speed) * maxSpeed;
      }

      /* Gentle damping so they don't accelerate forever */
      n.vx *= 0.995;
      n.vy *= 0.995;

      n.x += n.vx;
      n.y += n.vy;

      /* Bounce off edges */
      if (n.x < 0 || n.x > W) { n.vx *= -1; n.x = Math.max(0, Math.min(W, n.x)); }
      if (n.y < 0 || n.y > H) { n.vy *= -1; n.y = Math.max(0, Math.min(H, n.y)); }
    });

    /* Edges */
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d  = Math.hypot(dx, dy);
        if (d < CONFIG.connectDist) {
          const alpha = (1 - d / CONFIG.connectDist) * 0.5;
          ctx.strokeStyle = `rgba(${CONFIG.accentRGB},${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    /* Mouse connection burst — lines from nearby nodes to cursor */
    nodes.forEach(n => {
      const dx = mouse.x - n.x;
      const dy = mouse.y - n.y;
      const d  = Math.hypot(dx, dy);
      if (d < CONFIG.mouseRadius) {
        const alpha = (1 - d / CONFIG.mouseRadius) * 0.7;
        ctx.strokeStyle = `rgba(${CONFIG.accentRGB},${alpha})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    });

    /* Nodes */
    nodes.forEach((n, i) => {
      const pulse = Math.sin(t * 0.0009 + n.phase) * 0.5 + 0.5;
      const alpha = i % 5 === 0 ? 1 : 0.7 + 0.25 * pulse;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * (0.85 + 0.25 * pulse), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${CONFIG.accentRGB},${alpha})`;
      ctx.fill();
    });

    if (!reduced) {
      raf = requestAnimationFrame(draw);
    }
  }

  /* ── Init ── */
  resize();
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    resize();
    if (!reduced) {
      raf = requestAnimationFrame(draw);
    } else {
      draw(0);
    }
  });

  if (!reduced) {
    raf = requestAnimationFrame(draw);
  } else {
    // Static single frame — still shows the grid and nodes
    draw(0);
  }
})();
