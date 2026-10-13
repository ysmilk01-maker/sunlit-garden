import { plantArt as svgPlantArt } from './garden-art.mjs?v=20261013-8';
import { evolutionArt as svgEvolutionArt } from './evolution-art.mjs?v=20261013-11';

// Only these locally authored assets can become image URLs. Game state is not read or changed.
const SPRITES = Object.freeze({
  'base-sunflower': Object.freeze({ type: 'sunflower' }),
  'base-clover': Object.freeze({ type: 'clover' }),
  'base-hive': Object.freeze({ type: 'hive' }),
  'evo-twin': Object.freeze({ type: 'sunflower', evolution: 'twin' }),
  'evo-solar': Object.freeze({ type: 'sunflower', evolution: 'solar' }),
  'evo-meadow': Object.freeze({ type: 'clover', evolution: 'meadow' }),
  'evo-lucky': Object.freeze({ type: 'clover', evolution: 'lucky' }),
  'evo-swarm': Object.freeze({ type: 'hive', evolution: 'swarm' }),
  'evo-royal': Object.freeze({ type: 'hive', evolution: 'royal' }),
});
const installations = new WeakMap();
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const assetUrl = key => `./assets/plants-v13/${key}-v13.webp`;
const normalizedType = type => typeof type === 'string' ? type : '';
function normalizedAge(age) {
  let number;
  try { number = Number(age); } catch { number = 0; }
  return Math.max(0, Math.min(2, Number.isFinite(number) ? Math.floor(number) : 0));
}
function eligible(record, age) {
  // The original hive and its two evolutions have a fixed appearance at every age.
  return age === 2 || record.type === 'hive';
}
function image(key, age, small) {
  const record = SPRITES[key];
  const evolution = record.evolution ? ` evolution-art evolution-art--${record.evolution}` : '';
  const evolutionData = record.evolution ? ` data-evolution="${record.evolution}"` : '';
  return `<img class="plant-art plant-art--${record.type} plant-art--age-${age}${evolution} garden-sprite" src="${assetUrl(key)}" alt="" aria-hidden="true" width="100" height="100" decoding="async" draggable="false" data-garden-sprite="${key}" data-garden-age="${age}" data-garden-small="${small ? '1' : '0'}"${evolutionData}>`;
}

/** Same decorative-art API; seedlings and growing flowers keep their exact original SVG. */
export function plantArt(type, age = 0, options = {}) {
  const safeType = normalizedType(type), stage = normalizedAge(age), small = Boolean(options?.small);
  const key = `base-${safeType}`, record = own(SPRITES, key) ? SPRITES[key] : null;
  return record && eligible(record, stage) ? image(key, stage, small) : svgPlantArt(safeType, stage, { small });
}

/** Missing evolution means a normal plant; unsupported or mismatched IDs use the original SVG. */
export function evolutionArt(type, evolutionId, age = 2, options = {}) {
  const safeType = normalizedType(type), stage = normalizedAge(age), small = Boolean(options?.small);
  if (evolutionId == null || evolutionId === '') return plantArt(safeType, stage, { small });
  const safeId = typeof evolutionId === 'string' ? evolutionId : null;
  const key = `evo-${safeId}`, record = own(SPRITES, key) ? SPRITES[key] : null;
  return record?.type === safeType && eligible(record, stage)
    ? image(key, stage, small) : svgEvolutionArt(safeType, safeId, stage, { small });
}

function restoreSvg(target) {
  if (target?.tagName !== 'IMG' || !target.classList?.contains('garden-sprite')) return false;
  const key = target.dataset?.gardenSprite;
  if (typeof key !== 'string' || !own(SPRITES, key) || target.getAttribute('src') !== assetUrl(key)) return false;
  const age = target.dataset.gardenAge, size = target.dataset.gardenSmall;
  if (!/^[012]$/.test(age) || !/^[01]$/.test(size)) return false;
  const record = SPRITES[key], options = { small: size === '1' };
  const markup = record.evolution
    ? svgEvolutionArt(record.type, record.evolution, Number(age), options)
    : svgPlantArt(record.type, Number(age), options);
  const template = target.ownerDocument.createElement('template');
  // Markup comes exclusively from the existing SVG generators and the fixed registry above.
  template.innerHTML = markup;
  const replacement = template.content.firstElementChild;
  if (!replacement) return false;
  target.getAnimations?.().forEach(animation => animation.cancel());
  target.replaceWith(replacement);
  return true;
}

/** Capture handles non-bubbling image errors, including cards inserted after installation. */
export function installSpriteFallbacks(root = document) {
  if (installations.has(root)) return installations.get(root);
  const onError = event => restoreSvg(event.target);
  root.addEventListener('error', onError, true);
  const uninstall = () => {
    root.removeEventListener('error', onError, true);
    installations.delete(root);
  };
  installations.set(root, uninstall);
  // Also recover already-failed images if a caller installs after rendering.
  for (const image of root.querySelectorAll('img.garden-sprite[data-garden-sprite]')) {
    if (image.complete && image.naturalWidth === 0) restoreSvg(image);
  }
  return uninstall;
}
