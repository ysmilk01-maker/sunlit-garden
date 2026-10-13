// Original, self-contained garden illustrations. No fonts, images, IDs, or network requests.
// Keep the outer SVG decorative: the containing control supplies its accessible name.
const TYPES = new Set(['sunflower', 'clover', 'lavender', 'berry', 'mushroom', 'hive', 'well']);
const ellipse = (cx, cy, rx, ry, fill, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const stem = (d, width = 6, color = '#397c4c') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
const leaf = (x, y, flip = false, fill = '#60a861') => `<g transform="translate(${x} ${y}) scale(${flip ? -1 : 1} 1)">${path('M0 0C-16 0-24-10-24-20C-8-23 1-12 0 0', '#357946')}${path('M-2-3C-12-6-18-12-21-18C-9-17-3-12-2-3', fill)}</g>`;
const ground = (small) => ellipse(50, 87, small ? 22 : 27, 5, '#244b32', 'opacity=".12"');

function sprout(type, small) {
  const colors = { sunflower: '#e5ac3b', clover: '#85b85a', lavender: '#a58ace', berry: '#bc5657' };
  const seed = colors[type] || '#a2bb70';
  return ground(small) + ellipse(50, 83, 10, 5, '#897346') + ellipse(48, 80, 7, 4, seed)
    + stem('M50 82Q47 70 51 60', 5)
    + leaf(50, 72, false, '#8ac879') + leaf(50, 65, true, '#a6d68c')
    + (small ? '' : ellipse(56, 58, 3, 2, '#d2e9a0', 'transform="rotate(-35 56 58)"'));
}

function sunflower(age, small) {
  if (age === 0) return sprout('sunflower', small);
  const cy = age === 1 ? 40 : 33;
  let result = ground(small) + stem(`M49 83Q54 65 50 ${cy + 7}`, 7)
    + leaf(51, 74, false, '#81bb62') + leaf(51, 64, true, '#97ce6e');
  if (age === 1) return result + path('M34 43Q32 27 45 26L50 18L56 26Q72 28 65 44Q56 55 43 51Z', '#467e42')
    + path('M39 37Q42 21 53 25Q63 27 60 40Q49 49 39 37Z', '#efbd39')
    + path('M42 31Q47 25 53 27', 'none', 'stroke="#ffe38a" stroke-width="3" stroke-linecap="round"');
  const petals = Array.from({ length: 10 }, (_, i) => `<g transform="rotate(${i * 36} 50 33)">${ellipse(50, 16, 8.5, 14, i % 2 ? '#f4bc35' : '#ffcf4d')}${small ? '' : path('M48 6Q43 14 47 19', 'none', 'stroke="#ffe897" stroke-width="2" stroke-linecap="round"')}</g>`).join('');
  result += petals + ellipse(50, 36, 15, 14, '#996139') + ellipse(50, 32, 14, 13, '#6a482f')
    + ellipse(46, 28, 8, 6, '#876038');
  if (!small) result += [[44, 28], [52, 26], [56, 33], [46, 36], [50, 32]].map(([x, y]) => ellipse(x, y, 1.5, 1.5, '#c39952')).join('');
  return result;
}

function cloverLeaf(x, y, scale = 1, angle = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">${path('M0 3C-18-1-23-12-17-20C-10-27-1-21 0-15C2-22 12-25 18-18C25-10 18 0 0 3Z', '#3e8555')}${path('M0 0C-14-4-20-12-14-18C-8-23-2-18 0-11C4-19 11-21 15-16C20-9 12-2 0 0Z', '#76bb76')}${path('M0 0L0-10', 'none', 'stroke="#bddb95" stroke-width="2" stroke-linecap="round"')}</g>`;
}

function clover(age, small) {
  if (age === 0) return sprout('clover', small);
  let result = ground(small) + stem('M50 84Q46 65 49 48', 5)
    + stem('M50 78Q33 67 27 55', 4) + stem('M50 78Q66 68 72 57', 4);
  result += cloverLeaf(49, age === 1 ? 54 : 38, age === 1 ? .8 : 1.05)
    + cloverLeaf(29, age === 1 ? 69 : 58, age === 1 ? .6 : .8, -35)
    + cloverLeaf(71, age === 1 ? 69 : 58, age === 1 ? .6 : .85, 35);
  if (age > 1) result += cloverLeaf(49, 77, .75, 8)
    + stem('M59 77Q69 62 65 51', 3)
    + ellipse(65, 48, 8, 7, '#fff4da') + ellipse(62, 45, 4, 3, '#ffffff')
    + (small ? '' : ellipse(69, 50, 2, 2, '#e2b879'));
  return result;
}

function lavender(age, small) {
  if (age === 0) return sprout('lavender', small);
  let result = ground(small) + stem('M49 84Q51 63 50 32', 4, '#477f63')
    + stem('M47 80Q33 61 28 44', 4, '#477f63') + stem('M52 81Q70 63 75 44', 4, '#477f63')
    + path('M46 81Q27 80 24 63Q41 67 46 81M53 81Q73 79 80 64Q61 66 53 81', '#83ac83');
  const stalks = age === 1 ? [[50, 44, .85], [31, 54, .62], [71, 55, .62]] : [[50, 29, 1], [27, 45, .82], [76, 42, .86]];
  for (const [x, y, scale] of stalks) {
    result += `<g transform="translate(${x} ${y}) scale(${scale})">${ellipse(0, 3, 9, 23, '#7960a6')}${[-12, -3, 6, 15].map((yy, i) => ellipse(-4, yy, 6, 5, i % 2 ? '#b19bdd' : '#c5b1e8') + ellipse(4, yy + 3, 6, 5, '#9778c5')).join('')}${ellipse(0, -21, 5, 6, '#d0baf0')}</g>`;
  }
  return result;
}

function berry(age, small) {
  if (age === 0) return sprout('berry', small);
  let result = ground(small) + stem('M50 84L49 45', 6, '#756247')
    + stem('M49 68L27 50M49 70L72 45', 4, '#756247');
  const bushes = age === 1 ? [[35, 58, 15], [58, 51, 18], [67, 66, 13]] : [[28, 51, 19], [48, 37, 22], [71, 48, 19], [44, 63, 22], [71, 67, 16]];
  result += bushes.map(([x, y, r], i) => ellipse(x, y + 3, r, r * .83, '#3f8056') + ellipse(x - 2, y - 2, r - 2, r * .75, i % 2 ? '#79ac68' : '#619b5c')).join('');
  if (age > 1) result += [[27, 56], [48, 43], [70, 56], [49, 69]].map(([x, y]) => ellipse(x, y + 1, 8, 9, '#9f4050') + ellipse(x - 1, y - 1, 7, 8, '#da6971') + ellipse(x - 3, y - 4, 2, 2.5, '#ffc2ae') + path(`M${x - 5} ${y - 8}L${x} ${y - 11}L${x + 5} ${y - 8}L${x} ${y - 6}Z`, '#3f7952')).join('');
  else result += ellipse(51, 49, 4, 4, '#f3dbc6') + ellipse(32, 61, 3, 3, '#fff0d9');
  return result;
}

function mushroom(age, small) {
  const cap = (x, y, scale) => `<g transform="translate(${x} ${y}) scale(${scale})">${path('M-9-1Q-9 15-13 29Q0 36 13 29Q8 14 9-1Z', '#f1ddb1')}${path('M4 0Q2 18 6 29L13 29Q8 14 9-1Z', '#d4b78b')}${ellipse(0, 0, 27, 7, '#ae5b4b')}${path('M-29-1Q-24-32 0-34Q23-32 29-1Q13 10-9 7Q-24 6-29-1Z', '#c76d55')}${path('M-25-5Q-19-28 0-29Q16-28 22-12Q4-18-25-5Z', '#e99575')}${ellipse(-10, -17, 5, 4, '#fff0cf')}${ellipse(9, -23, 4, 3, '#fff0cf')}${small ? '' : ellipse(13, -8, 4, 3, '#ffe9c9')}</g>`;
  if (age === 0) return ground(small) + cap(48, 76, .38) + path('M28 86Q32 76 38 77L36 85M59 86Q62 79 68 80L64 87', '#86aa6b');
  if (age === 1) return ground(small) + cap(49, 61, .73);
  return ground(small) + cap(43, 48, 1) + cap(72, 72, .5)
    + path('M14 88Q17 77 25 75L23 86M80 88Q84 77 91 80L88 88', '#7fa36a');
}

function hive(small) {
  let result = ground(small)
    + path('M23 77L19 87L24 89L30 78M68 78L75 89L81 87L76 77', '#7c6447')
    + path('M18 75Q18 44 34 28Q40 22 49 21Q61 23 68 31Q81 45 82 75Q50 89 18 75Z', '#ba8440')
    + path('M21 70Q22 43 36 30Q43 25 50 25Q64 30 69 47Q73 58 73 75Q42 80 21 70Z', '#e8b756')
    + path('M31 36Q48 42 66 37M25 48Q50 56 74 49M21 61Q47 70 79 63M20 74Q50 82 81 75', 'none', 'stroke="#b1813e" stroke-width="4" stroke-linecap="round"')
    + ellipse(51, 65, 11, 14, '#7a5a37') + ellipse(51, 67, 7, 11, '#443d2d')
    + path('M15 80Q48 89 85 80L85 85Q49 94 15 85Z', '#927348');
  if (!small) result += ellipse(76, 23, 5, 7, '#f3f2d8', 'transform="rotate(-30 76 23)"')
    + ellipse(84, 23, 5, 7, '#e7eee0', 'transform="rotate(30 84 23)"')
    + ellipse(80, 29, 9, 6, '#f1c558') + path('M78 24L78 34M83 25L83 33', 'none', 'stroke="#655638" stroke-width="2.5"')
    + ellipse(88, 28, 3, 3, '#655638');
  return result;
}

function well(small) {
  let result = ground(small)
    + path('M20 64L21 79Q50 94 80 79L80 64Z', '#7faaa5')
    + path('M23 68L24 79Q47 89 64 84L64 69Z', '#a4c2b3')
    + ellipse(50, 64, 31, 12, '#d2d7be') + ellipse(50, 64, 24, 8, '#376e76')
    + ellipse(48, 63, 18, 4, '#66afbc')
    + path('M24 27H31V71H24ZM69 27H76V71H69Z', '#8c6645')
    + path('M25 28H28V67H25ZM70 28H73V67H70Z', '#c69b64')
    + path('M13 32L48 9L86 32L80 40L49 21L19 41Z', '#a05f43')
    + path('M13 32L48 9L51 15L19 36Z', '#dfaa79')
    + path('M49 15L81 33L78 36L49 21Z', '#c77e55')
    + stem('M31 43H69', 5, '#75553d')
    + path('M48 43V59', 'none', 'stroke="#d9c6a0" stroke-width="2.5"')
    + path('M43 56H56L54 67H45Z', '#ddbf82')
    + path('M43 56Q49 50 56 56', 'none', 'stroke="#856947" stroke-width="2"');
  if (!small) result += path('M31 75L30 81M47 78V86M65 76L67 83', 'none', 'stroke="#789b8e" stroke-width="2"')
    + path('M35 64Q41 66 46 64', 'none', 'stroke="#c1e4d7" stroke-width="1.5" stroke-linecap="round"');
  return result;
}

const ART = { sunflower, clover, lavender, berry, mushroom };

/** Return a decorative SVG. Age 0: seedling; 1: growing; 2+: mature. */
export function plantArt(type, age = 0, { small = false } = {}) {
  const safeType = TYPES.has(type) ? type : 'clover';
  const stage = Math.max(0, Math.min(2, Number.isFinite(Number(age)) ? Math.floor(Number(age)) : 0));
  const drawing = safeType === 'hive' ? hive(small) : safeType === 'well' ? well(small) : ART[safeType](stage, small);
  return `<svg class="plant-art plant-art--${safeType} plant-art--age-${stage}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" fill="none" stroke-linejoin="round">${drawing}</svg>`;
}
