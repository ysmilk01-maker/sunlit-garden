// Original, self-contained garden illustrations. No fonts, images, IDs, or network requests.
// Keep the outer SVG decorative: the containing control supplies its accessible name.
const TYPES = new Set(['sunflower', 'clover', 'lavender', 'berry', 'mushroom', 'hive', 'well', 'mint', 'tulip', 'fern', 'pumpkin', 'rose', 'lotus', 'daisy', 'bluebell', 'strawberry', 'bamboo', 'cactus', 'hydrangea', 'orchid', 'cherry']);
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

function mintLeaf(x, y, angle, scale, small) {
  return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">${path('M0 2L-8-2L-7-6L-15-9L-13-13L-19-17L-15-20L-20-25L-14-26L-15-31L-9-30L0-38L8-30L14-31L14-25L20-23L16-18L19-14L13-11L14-6L7-4L7 0Z', '#367d5e')}${path('M0-1L-5-7L-5-11L-11-15L-9-20L-12-24L-6-25L0-34L6-26L10-25L8-20L11-15L6-12L6-7Z', '#76bea0')}${path('M0-2V-29', 'none', 'stroke="#c0e0b4" stroke-width="2" stroke-linecap="round"')}${small ? '' : path('M0-11L-6-16M0-19L6-24', 'none', 'stroke="#aad5a7" stroke-width="1.5" stroke-linecap="round"')}</g>`;
}

function mint(age, small) {
  let result = ground(small) + stem(age === 0 ? 'M50 83L50 69' : 'M50 84Q53 57 48 33', age === 0 ? 4 : 5, '#42876a');
  if (age === 0) return result + mintLeaf(50, 74, -55, .46, small) + mintLeaf(50, 71, 48, .5, small);
  const leaves = age === 1 ? [[50, 75, -48, .75], [50, 68, 46, .7], [49, 51, -6, .65]] : [[50, 79, -64, .91], [51, 77, 65, .85], [51, 62, -52, .94], [51, 60, 51, .92], [49, 41, -29, .72], [49, 39, 24, .67]];
  return result + leaves.map(([x, y, angle, scale]) => mintLeaf(x, y, angle, scale, small)).join('');
}

function tulip(age, small) {
  let result = ground(small)
    + path(age === 0 ? 'M49 84Q30 75 35 60Q51 67 49 84M50 84Q64 67 66 56Q47 64 50 84' : 'M50 85Q25 74 26 48Q49 57 50 85M51 84Q74 67 73 41Q48 51 51 84', '#4a8f64');
  result += path(age === 0 ? 'M49 82Q38 71 38 65L49 80M51 81Q60 68 63 61L53 82' : 'M48 80Q33 65 30 54Q44 60 48 80M54 77Q65 61 69 48Q55 55 54 77', '#8fc27a');
  if (age === 0) return result + stem('M50 82V61', 4) + ellipse(50, 59, 4, 6, '#76a65d');
  result += stem(age === 1 ? 'M50 83Q50 61 51 45' : 'M50 84Q51 59 49 36', 5);
  if (age === 1) return result + path('M39 39Q38 28 51 22Q65 31 63 41Q57 53 48 49Q40 47 39 39Z', '#ba4b48')
    + path('M50 24Q59 33 54 47Q43 44 43 35Z', '#e57f69') + path('M39 41L49 49L62 41L57 51H47Z', '#4a8f64');
  return result + path('M25 20L40 29L49 12L59 27L75 20Q76 46 62 54Q48 63 35 50Q26 41 25 20Z', '#ad494c')
    + path('M29 23Q41 29 51 39Q50 53 45 55Q30 50 29 23Z', '#dc7767')
    + path('M49 15Q63 30 62 44Q59 51 50 54Q42 44 43 32Z', '#f18f77')
    + path('M73 24Q69 48 53 55Q49 42 56 33Z', '#c95755')
    + (small ? '' : path('M48 22Q53 30 52 36', 'none', 'stroke="#ffb29b" stroke-width="3" stroke-linecap="round"'));
}

function fernFrond(x, y, angle, scale, small) {
  let result = stem('M0 0Q-4-28 0-64', 3, '#3c8160');
  for (let i = 0; i < 6; i++) {
    const yy = -9 - i * 8, length = 22 - i * 2.5;
    result += path(`M-1 ${yy}Q${-length} ${yy + 2} ${-length} ${yy - 12}Q-8 ${yy - 11} -1 ${yy}Z`, i % 2 ? '#6ea87a' : '#87be89')
      + path(`M0 ${yy - 2}Q${length} ${yy - 1} ${length} ${yy - 14}Q7 ${yy - 11} 0 ${yy - 2}Z`, i % 2 ? '#91c28c' : '#74b080');
  }
  result += path('M0-58Q-8-66 0-73Q9-65 0-58Z', '#a3cd97');
  if (!small) result += stem('M0 0Q-4-28 0-64', 1.5, '#b0d49a');
  return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">${result}</g>`;
}

function fern(age, small) {
  if (age === 0) return ground(small) + stem('M47 84Q37 65 47 59Q57 54 59 64Q60 70 52 70Q45 69 49 64', 5, '#70a47d')
    + path('M49 80Q57 68 68 74Q65 84 49 80Z', '#9bc693');
  return ground(small) + (age === 1 ? fernFrond(47, 85, -22, .71, small) + fernFrond(51, 85, 26, .59, small)
    : fernFrond(47, 86, -38, .79, small) + fernFrond(54, 86, 39, .78, small) + fernFrond(50, 87, -3, 1, small));
}

function pumpkinLeaf(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">${path('M0 15L-14 14L-11 5L-24 0L-16-6L-18-15L-6-13L0-25L7-13L18-16L16-5L26-1L14 6L15 15L2 19Z', '#527d49')}${path('M0 14L-10 9L-8 2L-17-2L-8-6L-10-10L-2-8L1-17L6-8L13-10L11-2L17 1L7 4L9 10Z', '#86aa62')}${path('M0 13L1-14M0 6L-11-2M1 2L11-3', 'none', 'stroke="#b6c783" stroke-width="2" stroke-linecap="round"')}</g>`;
}

function pumpkin(age, small) {
  if (age === 0) return ground(small) + stem('M50 83L50 72', 4) + pumpkinLeaf(42, 73, .4) + pumpkinLeaf(59, 69, .43);
  let result = ground(small) + stem('M17 82Q29 62 46 72Q67 85 83 73Q93 64 85 58Q79 55 78 62Q79 66 84 63', 4, '#6a9254')
    + pumpkinLeaf(29, 56, .79) + pumpkinLeaf(73, 49, .68);
  if (age === 1) return result + path('M48 64L41 52L50 48L55 36L60 48L73 48L68 58L71 69L58 67L50 75Z', '#dbb650')
    + path('M55 45L59 54L66 56L61 62L53 63L48 57Z', '#f5d978') + ellipse(57, 56, 4, 4, '#aa8441');
  result += ellipse(51, 66, 31, 23, '#bc733c') + ellipse(34, 65, 14, 21, '#dc914a')
    + ellipse(67, 65, 14, 21, '#d88b43') + ellipse(51, 65, 17, 23, '#eeac58')
    + ellipse(48, 65, 8, 20, '#f5bd6d')
    + path('M46 45Q47 35 54 31L61 36Q54 39 56 46Z', '#6d7945')
    + path('M49 43Q49 37 54 35', 'none', 'stroke="#a7b17a" stroke-width="3" stroke-linecap="round"');
  if (!small) result += path('M30 55Q25 64 30 73M68 51Q76 62 70 76', 'none', 'stroke="#efb56b" stroke-width="2" stroke-linecap="round"');
  return result;
}

function rose(age, small) {
  if (age === 0) return sprout('berry', small);
  let result = ground(small) + stem(age === 1 ? 'M50 84V44' : 'M50 84Q55 60 50 39', 5, '#4f845a')
    + leaf(51, 76, false, '#83b777') + leaf(52, 65, true, '#8cbd7e')
    + path('M50 69L56 66L52 74M49 59L43 55L49 63', '#4f845a');
  if (age === 1) return result + path('M39 38Q37 25 49 22Q62 24 63 35Q64 48 51 50Q39 46 39 38Z', '#ad516b')
    + path('M43 30Q51 24 56 30Q46 30 48 45Q39 42 43 30Z', '#e392a0')
    + path('M40 42L51 50L61 42L57 52L47 53Z', '#4f845a');
  const petals = Array.from({ length: 5 }, (_, i) => `<g transform="rotate(${i * 72 + 8} 50 33)">${path('M48 36Q25 36 27 20Q30 6 44 10Q62 7 62 23Q59 33 48 36Z', i % 2 ? '#cc6b88' : '#e58ba0')}${small ? '' : path('M33 20Q35 13 45 14', 'none', 'stroke="#f8bec7" stroke-width="3" stroke-linecap="round"')}</g>`).join('');
  return result + petals + ellipse(50, 34, 16, 14, '#b85077')
    + path('M36 32Q42 18 56 22Q64 25 61 35Q59 30 53 31Q53 43 43 43Q34 40 36 32Z', '#ed9cac')
    + path('M43 30Q45 24 53 25Q59 27 55 34L50 30L46 35Z', '#ca6485')
    + path('M40 36Q42 45 50 42Q58 41 58 34Q52 41 48 34Q43 30 40 36Z', '#df809a')
    + path('M48 29Q54 26 53 33Q48 36 47 32Z', '#9c4266');
}

function lotus(age, small) {
  const pad = `<g transform="translate(50 78) scale(${age === 0 ? .65 : 1})">${path('M-35 1Q-33-18-7-17Q21-20 37-6Q46 10 19 15Q-9 24-34 10Q-39 7-35 1Z', '#4c9a86')}${path('M-30-1Q-18-15 4-12Q24-12 32-4Q22 5 0 4Q-21 12-30-1Z', '#83c1a4')}${path('M0 3L29 13L13 16Z', '#dce5c4')}${small ? '' : path('M0 2L-17-7M0 2L-25 6M0 2L8-9M0 2L22-3', 'none', 'stroke="#b1d8b6" stroke-width="1.5" stroke-linecap="round"')}</g>`;
  let result = ground(small) + pad;
  if (age === 0) return result + stem('M49 80L50 68', 3, '#7d9b72')
    + path('M45 68Q42 61 50 54Q58 60 55 67Q51 73 45 68Z', '#d7a9b0');
  result += stem('M50 79L50 52', 4, '#7d9b72');
  if (age === 1) return result + path('M37 51Q33 41 49 23Q66 39 64 50Q57 67 46 63Q38 59 37 51Z', '#c88198')
    + path('M49 26Q59 43 54 58Q43 54 43 43Z', '#f4c6cb')
    + path('M34 45Q44 49 49 64Q36 61 34 45M64 43Q67 58 49 64Q58 52 64 43Z', '#e3acb8');
  return result + path('M49 58Q17 58 11 35Q37 34 49 58M51 58Q67 32 90 34Q82 59 51 58Z', '#c485a4')
    + path('M49 55Q20 44 25 19Q48 29 49 55M51 55Q56 29 76 18Q79 47 51 55Z', '#dca2b8')
    + path('M50 62Q30 41 50 9Q71 41 50 62Z', '#f2c6cd')
    + path('M50 63Q24 62 20 43Q40 40 50 63M50 63Q64 41 81 44Q76 64 50 63Z', '#edbdcc')
    + path('M50 63Q39 49 50 29Q61 49 50 63Z', '#ffded7')
    + ellipse(50, 62, 8, 4, '#dfb965')
    + (small ? '' : ellipse(48, 60, 3, 1.5, '#fff0b4'));
}

function daisyFlower(x, y, scale, small) {
  const petals = Array.from({ length: 9 }, (_, i) => `<g transform="rotate(${i * 40})">${ellipse(0, -12, 4.8, 10, i % 2 ? '#fff9e9' : '#ffffff')}</g>`).join('');
  return `<g transform="translate(${x} ${y}) scale(${scale})">${petals}${ellipse(0, 2, 8, 7, '#d8a240')}${ellipse(0, 0, 7, 6, '#f3ca58')}${small ? '' : ellipse(-2, -2, 2.5, 2, '#fff0a3')}</g>`;
}

function daisy(age, small) {
  if (age === 0) return ground(small) + stem('M50 84Q48 71 50 63', 4)
    + leaf(49, 78, false, '#9bc77d') + leaf(50, 72, true, '#b0d28c') + ellipse(50, 61, 4, 5, '#f5ebc7');
  let result = ground(small) + stem('M49 84Q53 63 49 36', 4, '#5a9256')
    + stem('M50 76Q32 66 26 57', 3, '#5a9256') + stem('M51 70Q68 59 74 48', 3, '#5a9256')
    + leaf(49, 81, false, '#a0c982') + leaf(52, 75, true, '#b4d58d');
  if (age === 1) return result + daisyFlower(49, 41, .64, small)
    + ellipse(26, 56, 5, 7, '#e8e7c4') + ellipse(74, 47, 5, 7, '#fff3d0');
  return result + daisyFlower(49, 33, 1, small) + daisyFlower(25, 57, .64, small) + daisyFlower(76, 48, .67, small);
}

function bluebellFlower(x, y, scale, angle, small) {
  return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">${path('M-8-5Q-8-16 0-17Q9-16 9-5Q10 6 16 10Q10 16 6 11Q0 17-5 11Q-11 16-16 10Q-10 4-8-5Z', '#5b75b4')}${path('M-5-9Q-4-14 1-14Q7-12 5-4L8 9Q3 12 0 9L-5 11Q-9 6-7 0Z', '#8db8e6')}${path('M-8-11L0-19L9-10L4-10L0-13L-3-9Z', '#629171')}${ellipse(0, 10, 8, 2.5, '#4868a3')}${small ? '' : stem('M-1-9L-2 3', 2, '#c7e4f4')}</g>`;
}

function bluebell(age, small) {
  let result = ground(small) + path(age === 0 ? 'M48 85Q30 72 35 63Q50 71 48 85M52 85Q62 65 70 62Q70 80 52 85Z' : 'M47 86Q18 73 20 54Q45 67 47 86M53 86Q66 61 83 54Q79 77 53 86Z', '#5b9b7c');
  if (age === 0) return result + stem('M50 83Q50 70 54 65', 3, '#559278') + ellipse(55, 63, 4, 6, '#a4c3dd');
  result += stem(age === 1 ? 'M48 84Q51 37 61 42' : 'M47 84Q49 23 61 21', 4, '#528c77');
  if (age === 1) return result + bluebellFlower(62, 49, .75, -10, small) + ellipse(50, 61, 5, 7, '#80a3d0');
  return result + stem('M52 36Q33 34 31 42M50 54Q67 48 74 56', 3, '#528c77')
    + bluebellFlower(61, 30, .84, -8, small) + bluebellFlower(30, 51, .83, 15, small) + bluebellFlower(74, 63, .78, -13, small);
}

function strawberryLeaf(x, y, angle, scale) {
  return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">${path('M0 4L-9-1L-7-5L-15-8L-11-12L-16-17L-10-20L-11-25L-4-27L0-31L6-28L7-23L14-21L11-16L16-12L10-8L12-3L4 0Z', '#397f52')}${path('M0 1Q-11-13-2-26Q10-14 0 1Z', '#8abc72')}${stem('M0 1L-1-23', 1.8, '#c1d799')}</g>`;
}

function strawberryFruit(x, y, scale, small) {
  let result = path('M-16-8Q-16-21 0-17Q16-21 16-8Q14 7 0 17Q-14 7-16-8Z', '#be4d4d')
    + path('M-12-10Q-9-20 1-14Q10-18 12-9Q10 4-1 13Q-12 3-12-10Z', '#ed7d69')
    + path('M0-15L-13-19L-8-12L-15-8L-5-8L0-2L4-9L14-7L9-13L13-18L3-16L0-23Z', '#559359');
  for (const [x, y] of [[-7, -5], [5, -6], [-2, 2], [5, 3], [-1, 9]]) result += ellipse(x, y, 1.3, 2, '#ffe4a3', 'transform="rotate(-15)"');
  if (!small) result += ellipse(-7, -9, 2, 3, '#ffc0a6');
  return `<g transform="translate(${x} ${y}) scale(${scale})">${result}</g>`;
}

function strawberry(age, small) {
  let result = ground(small) + stem('M50 84Q49 69 50 57', 4, '#53955d');
  if (age === 0) return result + strawberryLeaf(49, 75, -48, .5) + strawberryLeaf(51, 72, 43, .52);
  result += strawberryLeaf(50, 63, -52, .99) + strawberryLeaf(49, 59, 0, 1.02) + strawberryLeaf(54, 63, 54, .98)
    + stem('M49 67Q29 61 26 72M54 67Q72 63 76 74', 3, '#658c58');
  if (age === 1) return result + daisyFlower(49, 63, .38, small) + ellipse(27, 74, 6, 8, '#b4c989') + ellipse(74, 75, 5, 6, '#d4d69e');
  return result + strawberryFruit(28, 72, .68, small) + strawberryFruit(75, 75, .66, small) + strawberryFruit(51, 70, 1.05, small);
}

function bambooStalk(x, top, width, small) {
  let result = path(`M${x - width / 2} 85V${top + 5}Q${x} ${top - 3} ${x + width / 2} ${top + 5}V85Z`, '#48854f')
    + path(`M${x - width / 2 + 2} 84V${top + 6}Q${x - 1} ${top + 1} ${x + 1} ${top + 5}V84Z`, '#9bbc63');
  for (let y = top + 16; y < 84; y += 17) result += stem(`M${x - width / 2 - 1} ${y}H${x + width / 2 + 1}`, 2.5, '#c1d090');
  if (!small) result += stem(`M${x - width / 2 + 3} ${top + 8}V81`, 1, '#d1dda1');
  return result;
}

function bambooLeaves(x, y, flip = false, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})">${stem('M0 0Q12-7 27-12', 2, '#3d8056')}${path('M9-5Q6-21 11-24Q16-15 9-5M14-7Q25-23 31-23Q30-11 14-7M18-8Q33-11 38-4Q26-1 18-8Z', '#70a668')}${path('M5-3Q11 0 17 12Q5 10 5-3Z', '#97be76')}</g>`;
}

function bamboo(age, small) {
  if (age === 0) return ground(small) + path('M40 84Q43 60 51 48Q60 63 61 84Z', '#a1b36b')
    + path('M40 82L55 71L44 67L54 59L50 50Q43 62 40 82Z', '#698d50') + path('M47 81L57 77L47 74Z', '#c2cd89');
  if (age === 1) return ground(small) + bambooStalk(48, 36, 11, small) + bambooStalk(64, 58, 8, small)
    + bambooLeaves(50, 50) + bambooLeaves(47, 69, true);
  return ground(small) + bambooStalk(33, 37, 9, small) + bambooStalk(51, 15, 11, small) + bambooStalk(70, 29, 9, small)
    + bambooLeaves(50, 31) + bambooLeaves(48, 50, true) + bambooLeaves(67, 64, true) + bambooLeaves(70, 43, false, .65);
}

function cactus(age, small) {
  let result = ground(small) + ellipse(49, 85, age === 0 ? 17 : 25, 4, '#c3b17d');
  if (age === 0) return result + ellipse(50, 75, 11, 13, '#74aa75') + stem('M48 66V83', 2, '#acc98d')
    + path('M42 72L38 70M59 76L63 74', 'none', 'stroke="#f4e7c0" stroke-width="2" stroke-linecap="round"');
  const top = age === 1 ? 41 : 22;
  if (age > 1) result += path('M41 70H30Q18 70 18 57V43Q18 37 24 37Q30 37 30 43V55Q30 58 41 57ZM59 58H70Q83 58 83 45V34Q83 28 77 28Q71 28 71 34V43Q71 47 59 46Z', '#659e6a');
  result += path(`M35 85V${top + 15}Q35 ${top} 50 ${top}Q65 ${top} 65 ${top + 15}V85Z`, '#639a63')
    + path(`M41 84V${top + 14}Q41 ${top + 3} 49 ${top + 3}Q55 ${top + 4} 56 ${top + 14}V84Z`, '#91bd78')
    + stem(`M49 ${top + 8}V81`, 2, '#c0d493');
  result += path(age === 1 ? 'M39 55L34 53M59 66L64 64M40 75L35 73' : 'M39 39L34 37M60 44L65 42M39 58L34 56M60 66L65 64M25 48L20 46M76 37L81 35M40 77L35 75', 'none', 'stroke="#f6e8bd" stroke-width="2" stroke-linecap="round"');
  if (age > 1) result += path('M50 25Q32 21 37 11Q43 6 49 17Q48 1 57 5Q65 10 55 19Q70 13 69 23Q63 31 50 25Z', '#db8b9e')
    + ellipse(51, 22, 5, 4, '#efcd76');
  else if (!small) result += ellipse(48, 45, 4, 2, '#bed18c');
  return result;
}

function hydrangeaFloret(x, y, scale, color) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">${ellipse(-4, -4, 5, 5, color)}${ellipse(4, -4, 5, 5, color)}${ellipse(-4, 4, 5, 5, color)}${ellipse(4, 4, 5, 5, color)}${ellipse(0, 0, 2, 2, '#f1e7c7')}</g>`;
}

function hydrangea(age, small) {
  if (age === 0) return ground(small) + stem('M50 85V64', 4) + strawberryLeaf(48, 77, -50, .55) + strawberryLeaf(52, 73, 47, .58);
  let result = ground(small) + stem('M50 84V53', 6, '#4b815d')
    + leaf(48, 80, false, '#75ac81') + leaf(52, 80, true, '#91bb8a')
    + leaf(46, 75, false, '#6da778');
  if (age === 1) return result + ellipse(50, 48, 19, 18, '#849fc1')
    + [[41, 45], [51, 38], [60, 46], [46, 56], [57, 56]].map(([x, y], i) => hydrangeaFloret(x, y, .7, i % 2 ? '#bbc7e5' : '#9ab5dd')).join('');
  result += ellipse(50, 45, 34, 29, '#7d8ebb');
  const florets = [[30, 30, .8], [47, 22, .85], [64, 28, .82], [78, 43, .8], [70, 59, .87], [51, 66, .86], [32, 59, .85], [22, 43, .79], [45, 42, 1], [59, 44, .95], [43, 55, .86], [59, 30, .64]];
  result += florets.map(([x, y, scale], i) => hydrangeaFloret(x, y, scale, ['#bac4e5', '#9abfdf', '#a7aed8', '#c8c8e9'][i % 4])).join('');
  if (!small) result += ellipse(38, 31, 2, 1.5, '#eef4f3') + ellipse(64, 49, 2, 1.5, '#eef4f3');
  return result;
}

function orchidFlower(x, y, scale, small) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">${path('M0 0Q-14-16-3-24Q7-27 8-15Q8-6 0 0Z', '#e9b7d0')}${path('M-1 1Q-24 5-25-10Q-21-22-9-14Q-3-9-1 1M2 1Q21-20 29-7Q31 7 15 9Q5 7 2 1Z', '#d691b7')}${path('M-4 2Q-18 5-13 17Q-6 23 2 10M5 2Q20 5 17 16Q9 23 2 10', '#f1c7d8')}${path('M-5 0Q1-7 7 0L12 8Q5 24-3 13L-9 7Z', '#a75494')}${path('M-2 2Q2-1 6 3L7 10Q2 15-2 9Z', '#ffe4b1')}${ellipse(2, -1, 3, 3, '#fff4d0')}${small ? '' : path('M-18-11Q-13-12-7-5M15-5L8 0', 'none', 'stroke="#f9d4e2" stroke-width="2" stroke-linecap="round"')}</g>`;
}

function orchid(age, small) {
  let result = ground(small) + path(age === 0 ? 'M48 85Q21 79 27 69Q46 67 48 85M51 85Q73 78 75 66Q55 66 51 85Z' : 'M48 85Q12 82 16 65Q39 58 48 85M52 85Q84 85 87 63Q62 55 52 85Z', '#4a8d71')
    + path(age === 0 ? 'M47 82Q32 75 30 73M53 82Q64 74 70 70' : 'M46 81Q31 68 21 69M55 80Q66 67 81 67', 'none', 'stroke="#8bb998" stroke-width="3" stroke-linecap="round"');
  if (age === 0) return result;
  result += stem(age === 1 ? 'M49 83Q42 39 61 37' : 'M49 83Q29 23 51 23Q67 20 74 42', 4, '#618563');
  if (age === 1) return result + ellipse(61, 38, 7, 10, '#cb92b3') + ellipse(52, 52, 5, 7, '#9fb581');
  return result + orchidFlower(48, 33, .88, small) + orchidFlower(73, 53, .69, small) + stem('M44 57Q31 54 29 60', 2, '#618563') + ellipse(28, 64, 6, 9, '#d5a2be');
}

function cherryBlossom(x, y, scale, small) {
  const petals = Array.from({ length: 5 }, (_, i) => `<g transform="rotate(${i * 72})">${path('M0 1Q-10-3-7-9L-2-12L0-9L3-12Q12-6 0 1Z', i % 2 ? '#ffe4df' : '#fff1e7')}</g>`).join('');
  return `<g transform="translate(${x} ${y}) scale(${scale})">${petals}${ellipse(0, 0, 2.8, 2.8, '#d58291')}${small ? '' : ellipse(0, -1, 1, 1, '#f4c879')}</g>`;
}

function cherry(age, small) {
  if (age === 0) return ground(small) + stem('M50 84Q52 70 49 58', 5, '#8c7156')
    + leaf(50, 73, false, '#a8b77a') + leaf(51, 67, true, '#bdc68c') + ellipse(49, 57, 3, 4, '#e6a8b4');
  let result = ground(small) + path('M41 88Q47 67 43 48L54 46Q51 66 58 88Z', '#967454')
    + path('M44 86Q49 66 47 50L51 49Q48 67 52 86Z', '#c5a17b')
    + stem(age === 1 ? 'M48 65L31 48M51 57L69 39' : 'M48 64L23 39M50 53L70 29M47 58L43 27', 5, '#977658');
  if (age === 1) return result + ellipse(33, 42, 13, 12, '#daa1ae') + ellipse(60, 35, 18, 14, '#e7b3bd')
    + cherryBlossom(31, 42, .7, small) + cherryBlossom(57, 34, .81, small) + cherryBlossom(73, 41, .57, small);
  result += [[24, 39, 17], [38, 25, 20], [60, 24, 21], [77, 39, 16], [63, 50, 23], [39, 49, 22]].map(([x, y, r], i) => ellipse(x, y + 3, r, r * .85, '#d995aa') + ellipse(x - 1, y, r - 1, r * .82, i % 2 ? '#f1c2ca' : '#eeb3c1')).join('');
  result += [[22, 39, .66], [39, 25, .81], [61, 26, .73], [79, 39, .62], [65, 51, .73], [40, 49, .78], [51, 39, .58]].map(([x, y, scale]) => cherryBlossom(x, y, scale, small)).join('');
  if (!small) result += ellipse(74, 75, 3, 5, '#f2beca', 'transform="rotate(35 74 75)"') + ellipse(27, 80, 4, 2.5, '#e8adbd');
  return result;
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

const ART = { sunflower, clover, lavender, berry, mushroom, mint, tulip, fern, pumpkin, rose, lotus, daisy, bluebell, strawberry, bamboo, cactus, hydrangea, orchid, cherry };

/** Return a decorative SVG. Age 0: seedling; 1: growing; 2+: mature. */
export function plantArt(type, age = 0, { small = false } = {}) {
  const safeType = TYPES.has(type) ? type : 'clover';
  const stage = Math.max(0, Math.min(2, Number.isFinite(Number(age)) ? Math.floor(Number(age)) : 0));
  const drawing = safeType === 'hive' ? hive(small) : safeType === 'well' ? well(small) : ART[safeType](stage, small);
  return `<svg class="plant-art plant-art--${safeType} plant-art--age-${stage}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" fill="none" stroke-linejoin="round">${drawing}</svg>`;
}
