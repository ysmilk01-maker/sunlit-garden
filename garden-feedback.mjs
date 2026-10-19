// Decorative feedback only. Actions commit immediately; no game state is read here.
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
const MAX_NODES = 56;
const MAX_HARVEST_CELLS = 6;
const PALETTES = Object.freeze({
  sunflower: ['#ffe66d', '#ffb65c', '#fff3ae', '#ff87be'],
  clover: ['#a9f079', '#58dab1', '#f5f58a', '#d7ffbd'],
  mint: ['#85f1c3', '#78ddeb', '#f1fb91', '#c6ffdf'],
  berry: ['#ff92c1', '#fcb4df', '#ffce74', '#a8e78c'],
  strawberry: ['#ff92b1', '#ffc476', '#fff1ac', '#a8e78c'],
  lavender: ['#c9a4ff', '#f3a3e3', '#91dfee', '#ffe493'],
  mushroom: ['#ffa08f', '#ffcf85', '#edb1ff', '#fff1ad'],
  hive: ['#ffdc66', '#ffb357', '#fff4b4', '#a6e6ce'],
  tulip: ['#ff819c', '#ffb887', '#fff1a6', '#c2ef93'],
  fern: ['#94edab', '#6ad6b2', '#d8f68f', '#a7e8de'],
  pumpkin: ['#ffb268', '#ffd587', '#ff93a8', '#c2ec92'],
  rose: ['#ff99c6', '#ffc6de', '#ee9de6', '#ffe8aa'],
  lotus: ['#ffc0dc', '#ff90c6', '#a5e7cc', '#fff0a1'],
  daisy: ['#fff7d9', '#ffe16f', '#ffc992', '#c9ef9c'],
  bluebell: ['#9eb7ff', '#c5a8ff', '#a1e7f0', '#ffe6ad'],
  bamboo: ['#92eaa4', '#c6f281', '#75d7c3', '#fff1a0'],
  cactus: ['#90ebbf', '#b5ef83', '#ffa4d1', '#fff0a3'],
  hydrangea: ['#b4c5ff', '#d3adff', '#a1e8ef', '#f2b9ed'],
  orchid: ['#e0adff', '#ff9bcb', '#b7ccff', '#fff0b8'],
  cherry: ['#ffd0e4', '#ff95c2', '#fff3d9', '#ffc695'],
  well: ['#a0e9ff', '#bcf5dd', '#e9faff', '#ffe3a5'],
});
const PRISM = ['#ffe16c', '#ff9acb', '#a2eaff', '#bd9fff', '#baffaf'];

export function createGardenFeedback({
  reduced = { matches: false },
  hidden = () => globalThis.document?.hidden === true,
} = {}) {
  let active = null;

  function clear() {
    const effect = active;
    active = null;
    if (!effect) return;
    for (const animation of effect.animations) {
      try { animation.cancel(); } catch { /* A removed node must not block input. */ }
    }
    for (const layer of effect.layers) {
      try { layer.remove(); } catch { /* The caller may already have replaced its board. */ }
    }
    for (const [element, name] of effect.classes) {
      try { element.classList.remove(name); } catch { /* Detached hosts are harmless. */ }
    }
  }

  function begin() {
    clear();
    if (hidden()) return null;
    active = { animations: [], settled: [], layers: [], classes: [], nodes: 0 };
    return active;
  }

  function mark(effect, element, name) {
    element.classList.add(name);
    effect.classes.push([element, name]);
  }

  function animate(effect, element, frames, options = {}) {
    if (!element?.animate) return;
    const animation = element.animate(frames, {
      duration: 280, easing: EASE_OUT, fill: 'both', ...options,
    });
    effect.animations.push(animation);
    effect.settled.push(Promise.resolve(animation.finished).catch(() => {}));
  }

  function finish(effect) {
    Promise.all(effect.settled).then(() => {
      // A cancelled older group must never clear the next tap's feedback.
      if (active === effect) clear();
    });
  }

  function node(effect, parent, className, layer = false) {
    if (effect.nodes >= MAX_NODES) return null;
    const document = parent.ownerDocument || globalThis.document;
    if (!document?.createElement) return null;
    const element = document.createElement(layer ? 'span' : 'i');
    element.className = className;
    element.setAttribute('aria-hidden', 'true');
    element.style.pointerEvents = 'none';
    parent.append(element);
    effect.nodes++;
    if (layer) effect.layers.push(element);
    return element;
  }

  const imageFor = cell => cell?.querySelector('.plant-art') || cell?.querySelector('svg');
  const sizeOf = cell => Math.max(28, Math.min(96, cell.getBoundingClientRect().width || 48));

  function ripple(effect, layer, size, { delay = 0, duration = 600, prism = false, color = '#ffe581' } = {}) {
    const ring = node(effect, layer, `festival-ring${prism ? ' festival-prism' : ''}`);
    if (!ring) return;
    ring.style.width = `${size}px`;
    ring.style.height = `${size}px`;
    ring.style.borderColor = color;
    animate(effect, ring, [
      { transform: 'translate(-50%,-50%) scale(.94) rotate(-12deg)', opacity: 0 },
      { offset: .16, transform: 'translate(-50%,-50%) scale(1.02) rotate(0deg)', opacity: .85 },
      { transform: 'translate(-50%,-50%) scale(1.42) rotate(22deg)', opacity: 0 },
    ], { duration, delay });
  }

  function particles(effect, layer, {
    count, size, palette, delay = 0, duration = 700, spread = .85, sparks = false,
  }) {
    for (let index = 0; index < count; index++) {
      const particle = node(effect, layer, sparks ? 'festival-sparkle' : 'festival-petal');
      if (!particle) break;
      const angle = (index / count) * Math.PI * 2 - Math.PI / 2 + (sparks ? .35 : 0);
      const radius = size * spread * (.72 + (index % 3) * .13);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius - size * .18;
      const rotation = index * 51 - 30;
      const particleSize = Math.max(4, Math.min(11, size * (sparks ? .12 : .105)));
      particle.style.width = `${particleSize}px`;
      particle.style.height = `${particleSize * (sparks ? 1 : 1.4)}px`;
      particle.style.background = palette[index % palette.length];
      animate(effect, particle, [
        { transform: `translate(-50%,-50%) scale(.94) rotate(${rotation}deg)`, opacity: 0 },
        { offset: .12, transform: `translate(calc(-50% + ${x * .22}px),calc(-50% + ${y * .22}px)) scale(1) rotate(${rotation}deg)`, opacity: 1 },
        { offset: .62, transform: `translate(calc(-50% + ${x * .88}px),calc(-50% + ${y}px)) rotate(${rotation + 95}deg)`, opacity: .9 },
        { transform: `translate(calc(-50% + ${x}px),calc(-50% + ${y + size * .48}px)) rotate(${rotation + 170}deg)`, opacity: 0 },
      ], { duration: duration + (index % 3) * 35, delay: delay + (index % 4) * 18 });
    }
  }

  function fadeImage(effect, image) {
    animate(effect, image, [{ opacity: .65 }, { opacity: 1 }], { duration: 160 });
  }

  function play(cell, kind = 'plant', type = '', options = {}) {
    try {
      const effect = begin();
      const image = imageFor(cell);
      if (!effect) return;
      if (!image?.animate || cell.isConnected === false) { clear(); return; }
      const evolve = kind === 'evolve';
      const master = evolve && options?.tier === 3;
      mark(effect, cell, evolve ? 'just-evolved' : 'just-planted');
      if (reduced.matches) {
        fadeImage(effect, image);
        finish(effect);
        return;
      }
      const size = sizeOf(cell);
      const layer = node(effect, cell, `garden-festival garden-festival--${evolve ? 'evolve' : 'plant'}`, true);
      if (layer) {
        const palette = PALETTES[type] || PALETTES.sunflower;
        ripple(effect, layer, size * (master ? 1.02 : .85), { duration: master ? 760 : evolve ? 480 : 320, prism: master, color: palette[0] });
        if (evolve) ripple(effect, layer, size * .62, { delay: master ? 60 : 40, duration: master ? 700 : 420, color: master ? '#ffe16c' : palette[1] });
        particles(effect, layer, { count: master ? 16 : evolve ? 10 : 5, size, palette, duration: master ? 620 : evolve ? 380 : 260, spread: master ? 1.14 : evolve ? .96 : .66 });
        particles(effect, layer, { count: master ? 8 : evolve ? 4 : 2, size, palette: master ? ['#ffe16c', '#fff4b4', '#ffdc66'] : palette, delay: 30, duration: master ? 620 : evolve ? 380 : 240, spread: master ? 1.34 : .88, sparks: true });
        if (!evolve) {
          // A small soil puff lands with the seed; flowers appear after the impact.
          for (let n = 0; n < 4; n++) {
            const soil = node(effect, layer, 'festival-petal');
            if (!soil) break;
            soil.style.width = `${4 + n % 2}px`; soil.style.height = '4px';
            soil.style.background = n % 2 ? '#a37545' : '#765438';
            const x = (n < 2 ? -1 : 1) * size * (.18 + n % 2 * .14);
            animate(effect, soil, [
              { transform: 'translate(-50%,-50%) scale(.5)', opacity: 0 },
              { offset: .3, transform: `translate(calc(-50% + ${x * .5}px),calc(-50% - 7px)) scale(1)`, opacity: .85 },
              { transform: `translate(calc(-50% + ${x}px),calc(-50% + 3px)) scale(.6)`, opacity: 0 },
            ], { duration: 210, delay: 70 });
          }
          const seed = node(effect, layer, 'festival-seed');
          if (seed) animate(effect, seed, [
            { transform: 'translate(-50%,-240%) rotate(-28deg)', opacity: 1 },
            { offset: .65, transform: 'translate(-50%,-50%) rotate(12deg)', opacity: 1 },
            { transform: 'translate(-50%,-20%) rotate(20deg)', opacity: 0 },
          ], { duration: 140 });
        }
      }
      animate(effect, image, [
        { transform: type === 'hive' ? 'translateY(-12%) scale(.94)' : 'translateY(12%) scale(.92)', opacity: .35 },
        { offset: .62, transform: `translateY(-5%) scale(${master ? 1.2 : evolve ? 1.13 : 1.09})`, opacity: 1 },
        { transform: 'translateY(0) scale(1)', opacity: 1 },
      ], { duration: master ? 600 : evolve ? 440 : 280 });
      finish(effect);
    } catch { clear(); }
  }

  function harvest(cells = [], options = {}) {
    try {
      const effect = begin();
      if (!effect) return;
      const all = [...new Set(Array.from(cells))].filter(cell => cell?.isConnected !== false && imageFor(cell)?.animate);
      const wanted = new Set(Array.isArray(options?.highlightIndices) ? options.highlightIndices.slice(0, 3) : []);
      const indexOf = cell => Number(cell.dataset?.cell ?? cell.dataset?.slot);
      const featured = all.filter(cell => wanted.has(indexOf(cell))).slice(0, 3);
      const remaining = all.filter(cell => !featured.includes(cell));
      const room = Math.min(MAX_HARVEST_CELLS - featured.length, remaining.length);
      const candidates = [...featured, ...Array.from({ length: room }, (_, i) => remaining[room === 1 ? 0 : Math.floor(i * (remaining.length - 1) / (room - 1))])];
      const count = Math.min(MAX_HARVEST_CELLS, candidates.length);
      for (let index = 0; index < count; index++) {
        const cell = candidates[index];
        const highlighted = featured.includes(cell);
        const image = imageFor(cell);
        const delay = reduced.matches ? 0 : index * 30;
        mark(effect, cell, 'festival-harvesting');
        if (reduced.matches) { fadeImage(effect, image); continue; }
        const size = sizeOf(cell);
        const layer = node(effect, cell, 'garden-festival garden-festival--harvest', true);
        if (layer) {
          ripple(effect, layer, size * (highlighted ? 1.04 : .85), { delay, duration: 520, color: highlighted ? '#ffe16c' : '#fff3ae' });
          particles(effect, layer, { count: 4, size, palette: PRISM, delay, duration: 560, spread: .78 });
          particles(effect, layer, { count: 2, size, palette: PRISM, delay, duration: 540, spread: 1, sparks: true });
        }
        animate(effect, image, [
          { transform: 'translateY(0) scale(1)' },
          { offset: .45, transform: `translateY(-5%) scale(${highlighted ? 1.17 : 1.08})` },
          { transform: 'translateY(0) scale(1)' },
        ], { duration: 280, delay });
      }
      // Keep the score response in the same group so it never cancels the plants.
      const target = options?.target;
      if (count && target?.animate && target.isConnected !== false) {
        if (reduced.matches) fadeImage(effect, target);
        else animate(effect, target, [
          { transform: 'scale(1)' },
          { offset: .4, transform: 'scale(1.08)' },
          { transform: 'scale(1)' },
        ], { duration: 360, delay: 120 });
      }
      finish(effect);
    } catch { clear(); }
  }

  function celebrate(container, kind = 'upgrade') {
    try {
      const effect = begin();
      if (!effect) return;
      if (!container || container.isConnected === false) { clear(); return; }
      if (reduced.matches) {
        const image = container.querySelector('.result-heading') || imageFor(container);
        if (image) fadeImage(effect, image);
        finish(effect);
        return;
      }
      const layer = node(effect, container, 'garden-festival garden-festival--celebrate', true);
      if (layer) {
        const bounds = container.getBoundingClientRect();
        const size = Math.max(48, Math.min(190, bounds.width * .55, bounds.height * .65));
        ripple(effect, layer, size, { duration: 900, prism: true });
        ripple(effect, layer, size * .74, { delay: 60, duration: 840, color: PRISM[1] });
        particles(effect, layer, { count: kind === 'success' ? 22 : 16, size, palette: PRISM, duration: 760, spread: .94 });
        particles(effect, layer, { count: 6, size, palette: PRISM, delay: 40, duration: 710, spread: 1.08, sparks: true });
      }
      finish(effect);
    } catch { clear(); }
  }

  return { play, clear, harvest, celebrate };
}
