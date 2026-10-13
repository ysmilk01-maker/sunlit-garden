import { plantArt } from './garden-art.mjs';

// Decorative, self-contained SVGs. The board control owns the accessible name.
// No IDs, filters, fonts, external assets, or motion: safe to repeat in one grid.
const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const oval = (x, y, rx, ry, fill, extra = '') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const line = (d, color, width = 4, extra = '') => path(d, 'none', `stroke="${color}" stroke-width="${width}" stroke-linecap="round" ${extra}`);
const group = (drawing, transform, role) => `<g transform="${transform}"${role ? ` data-part="${role}"` : ''}>${drawing}</g>`;
const ground = () => oval(50, 87, 29, 5, '#244b32', 'opacity=".12"');
const inner = (type, age, small) => plantArt(type, age, { small }).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const base = (type, age, small, transform = 'translate(0 0)') => group(inner(type, age, small), transform, 'original-plant');

function sprig(x, y, scale = 1, rotation = 0) {
  return group(line('M0 9V-6', '#477e4c', 3)
    + oval(-5, -4, 7, 4.5, '#8dc278', 'transform="rotate(28 -5 -4)"')
    + oval(5, -7, 7, 4.5, '#5b9f65', 'transform="rotate(-30 5 -7)"'), `translate(${x} ${y}) rotate(${rotation}) scale(${scale})`, 'sprout');
}

function fruit(x, y, scale = 1) {
  return group(oval(0, 1, 9, 10, '#a13e53') + oval(-1, -1, 8, 9, '#df6b78')
    + oval(-3, -4, 2.3, 3, '#ffd0b7')
    + path('M-7-7L-3-9L0-14L3-9L7-7L1-5Z', '#437f52'), `translate(${x} ${y}) scale(${scale})`, 'fruit');
}

function lavenderHead(x, y, scale, rotation = 0) {
  return group(oval(0, 1, 8, 19, '#7f61a8')
    + [-11, -2, 7].map((yy, index) => oval(-3.5, yy, 5.5, 5, index % 2 ? '#b99ce0' : '#d1b4ec') + oval(3.5, yy + 3, 5.5, 5, '#9f7fc7')).join('')
    + oval(0, -17, 4.5, 5.5, '#dfc8f2'), `translate(${x} ${y}) rotate(${rotation}) scale(${scale})`, 'flower-head');
}

function cap(x, y, scale) {
  return group(path('M-7-1L-10 22Q0 29 10 22L7-1Z', '#efddb4')
    + path('M2 1L3 23L10 22L7-1Z', '#ceb28b')
    + path('M-25 0Q-22-26 0-29Q22-26 25 0Q2 13-25 0Z', '#b96753')
    + path('M-21-5Q-16-23 0-24Q15-21 18-9Q-2-14-21-5Z', '#e99374')
    + oval(-8, -13, 4.5, 3.5, '#fff0ce') + oval(8, -19, 3.5, 3, '#ffe9c6'), `translate(${x} ${y}) scale(${scale})`, 'mushroom-cap');
}

function bee(x, y, scale = 1, rotation = 0) {
  return group(oval(-4, -7, 5.5, 8, '#f8f4dc', 'transform="rotate(-32 -4 -7)" stroke="#bacfc5" stroke-width="1.5"')
    + oval(4, -7, 5.5, 8, '#e9f0e0', 'transform="rotate(32 4 -7)" stroke="#bacfc5" stroke-width="1.5"')
    + oval(0, 0, 10, 6.5, '#edc25b') + line('M-3-5V5M3-5V5', '#6d5a3d', 2.7)
    + oval(9, -1, 3.5, 3.5, '#6d5a3d'), `translate(${x} ${y}) rotate(${rotation}) scale(${scale})`, 'bee');
}

const DRAW = {
  sunflower: {
    twin: ({ age }) => ground() + line('M50 86Q49 65 31 49M50 81Q59 58 67 41', '#397c4c', 5)
      + base('sunflower', Math.max(1, age), true, 'translate(-1 19) scale(.65 .77)')
      + base('sunflower', Math.max(1, age), true, 'translate(36 10) scale(.64 .88)'),
    solar: ({ small }) => ground()
      + group(oval(50, 43, 33, 33, '#f4d66e', 'opacity=".23"')
        + oval(50, 43, 33, 33, 'none', 'stroke="#d4a849" stroke-width="3.5"')
        + Array.from({ length: 10 }, (_, i) => group(line('M50 3V8', '#d7a646', small ? 4 : 3.5), `rotate(${i * 36} 50 43)`)).join(''), 'translate(0 0)', 'solar-halo')
      + base('sunflower', 2, small, 'translate(7 13) scale(.86)'),
  },
  clover: {
    meadow: ({ age, small }) => ground()
      + group(oval(50, 60, 34, 23, 'none', 'stroke="#a4c18a" stroke-width="4"'), 'translate(0 0)', 'meadow-ring')
      + base('clover', Math.max(1, age), small, 'translate(17 24) scale(.66)')
      + [[17, 60, .8, -35], [25, 31, .85, -20], [50, 19, .9, 0], [77, 34, .85, 20], [84, 65, .8, 35]].map(args => sprig(...args)).join(''),
    lucky: ({ small }) => ground() + base('clover', 1, true, 'translate(24 36) scale(.52)')
      + line('M51 83Q57 65 50 49', '#538351', 6)
      + group(Array.from({ length: 4 }, (_, i) => group(
        path('M0 2C-17-2-23-14-16-22C-9-29-1-23 0-16C2-24 11-28 18-20C25-11 16 0 0 2Z', '#70aa60', 'stroke="#c3a154" stroke-width="3"')
          + line('M0-2V-14', '#c8d989', 2.5), `rotate(${i * 90})`, 'lucky-leaf')).join(''), 'translate(50 45) scale(.93)', 'four-leaf-clover')
      + oval(50, 45, small ? 4.5 : 4, 4, '#efd57b'),
  },
  berry: {
    cluster: ({ small }) => base('berry', 1, small, 'translate(4 3) scale(.93)')
      + [[25, 38, .92], [46, 29, .93], [69, 37, .92], [31, 58, 1], [53, 50, 1.02], [76, 59, .9], [46, 74, .96], [65, 76, .82]].map(args => fruit(...args)).join(''),
    jam: ({ small }) => base('berry', 1, small, 'translate(7 10) scale(.86)')
      + group(path('M50 34C30 26 20 43 27 63C32 81 44 87 50 87C57 87 73 77 78 60C83 40 68 28 50 34Z', '#a13d55')
        + path('M50 38C34 31 26 44 31 61C36 76 44 81 50 82C62 81 71 69 73 56C75 43 64 33 50 38Z', '#df6679')
        + path('M34 48Q32 42 39 39Q43 38 44 41Q37 43 37 50Z', '#ffd0b5')
        + path('M30 36L42 34L48 24L54 34L70 32L61 42L50 38L41 42Z', '#4f8758')
        + line('M49 32Q49 26 55 22', '#527447', 4), 'translate(0 0)', 'giant-ripe-fruit'),
  },
  lavender: {
    chorus: ({ small }) => ground()
      + line('M49 84Q33 69 18 46M50 84Q41 58 31 31M50 84V28M51 84Q59 57 70 32M51 84Q69 68 83 48', '#548366', 3.5)
      + base('lavender', 1, small, 'translate(14 19) scale(.72)')
      + [[19, 46, .7, -25], [32, 30, .77, -12], [50, 24, .86, 0], [69, 30, .77, 12], [82, 46, .7, 25]].map(args => lavenderHead(...args)).join(''),
    perfume: ({ age, small }) => ground()
      + base('lavender', Math.max(1, age), small, 'translate(11 23) scale(.78)')
      + group(line('M19 58C5 43 33 41 21 22C16 14 21 9 27 7', '#bda3d4', 4)
        + line('M49 20C37 11 64 11 53 3', '#9673b7', 4)
        + line('M81 57C94 43 70 39 81 25C89 15 78 8 72 8', '#aa8bc8', 4), 'translate(0 0)', 'fragrance-curls'),
  },
  mushroom: {
    colony: ({ small }) => ground() + base('mushroom', 1, small, 'translate(4 4) scale(.9)')
      + cap(20, 70, .47) + cap(78, 59, .57) + cap(50, 81, .37),
    moon: ({ small }) => ground() + base('mushroom', 1, small, 'translate(3 5) scale(.95)')
      + group(path('M14 57Q17 23 48 17Q78 16 88 57Q63 74 29 65Z', '#6c7ba9')
        + path('M19 52Q25 23 49 23Q72 22 80 45Q57 37 19 52Z', '#aeb9df')
        + path('M15 57Q45 68 87 57Q69 77 28 68Z', '#b5bdd9')
        + path('M62 27C48 28 48 48 63 47C55 41 55 34 62 27Z', '#fff0b8')
        + oval(30, 45, 4, 3, '#e1e5f3') + oval(74, 53, 3.5, 2.5, '#e1e5f3'), 'translate(0 0)', 'moon-cap'),
  },
  hive: {
    swarm: ({ small }) => ground()
      + group(oval(25, 44, 12, 20, '#edf1dc', 'transform="rotate(-34 25 44)" stroke="#bed0b8" stroke-width="3"')
        + oval(75, 44, 12, 20, '#edf1dc', 'transform="rotate(34 75 44)" stroke="#bed0b8" stroke-width="3"'), 'translate(0 0)', 'swarm-wings')
      + base('hive', 2, true, 'translate(12 18) scale(.76)')
      + bee(50, 19, small ? .85 : 1) + bee(14, 63, .65, -18) + bee(85, 61, .65, 16),
    royal: ({ small }) => ground() + base('hive', 2, small, 'translate(7 13) scale(.86)')
      + group(path('M25 11L38 21L49 4L62 21L76 10L70 36Q50 43 30 36Z', '#d29b43', 'stroke="#a97738" stroke-width="2.5"')
        + path('M29 16L39 27L49 10L60 27L72 15L67 32Q49 37 33 32Z', '#f4cf69')
        + path('M31 32Q50 38 69 32L68 38Q51 44 32 38Z', '#bd893a')
        + oval(49, 27, 4, 5, '#7c9e70') + oval(34, 27, 2.5, 2.5, '#ffedaf') + oval(65, 26, 2.5, 2.5, '#ffedaf'), 'translate(0 0)', 'royal-crown'),
  },
};

/** Use a bare core evolution ID (e.g. 'twin'), never an entire evolution object. */
export function evolutionArt(type, evolutionId, age = 2, { small = false } = {}) {
  const family = Object.hasOwn(DRAW, type) ? DRAW[type] : null;
  const draw = family && Object.hasOwn(family, evolutionId) ? family[evolutionId] : null;
  if (!draw) return plantArt(type, age, { small });
  let numericAge;
  try { numericAge = Number(age); } catch { numericAge = 0; }
  const stage = Math.max(0, Math.min(2, Number.isFinite(numericAge) ? Math.floor(numericAge) : 0));
  const drawing = draw({ age: stage, small: Boolean(small) });
  return `<svg class="plant-art plant-art--${type} plant-art--age-${stage} evolution-art evolution-art--${evolutionId}" data-evolution="${evolutionId}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" fill="none" stroke-linejoin="round">${drawing}</svg>`;
}
