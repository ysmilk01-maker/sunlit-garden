// Original, self-contained garden illustrations. No fonts, images, IDs, or network requests.
// Keep the outer SVG decorative: the containing control supplies its accessible name.
const TYPES = new Set(['sunflower', 'clover', 'lavender', 'berry', 'mushroom', 'hive', 'well', 'mint', 'tulip', 'fern', 'pumpkin', 'rose', 'lotus']);
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

const ART = { sunflower, clover, lavender, berry, mushroom, mint, tulip, fern, pumpkin, rose, lotus };

/** Return a decorative SVG. Age 0: seedling; 1: growing; 2+: mature. */
export function plantArt(type, age = 0, { small = false } = {}) {
  const safeType = TYPES.has(type) ? type : 'clover';
  const stage = Math.max(0, Math.min(2, Number.isFinite(Number(age)) ? Math.floor(Number(age)) : 0));
  const drawing = safeType === 'hive' ? hive(small) : safeType === 'well' ? well(small) : ART[safeType](stage, small);
  return `<svg class="plant-art plant-art--${safeType} plant-art--age-${stage}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" fill="none" stroke-linejoin="round">${drawing}</svg>`;
}
