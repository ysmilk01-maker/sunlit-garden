/** Small garden-tool icon set. Decorative: the surrounding control supplies its name. */
const paths = Object.freeze({
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15M15 6v15"/>',
  book: '<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Z"/><path d="M12 5v15M6 8h3M6 11h3M15 8h3M15 11h3"/>',
  settings: '<path d="M4 7h16M4 17h16"/><path d="M8 4v6M16 14v6"/><circle cx="8" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  seed: '<path d="M12 21v-9M12 16C4 16 3 11 4 7c5-1 8 3 8 6M12 12c0-6 4-9 9-9 0 6-3 10-9 9Z"/>',
  basket: '<path d="m3 10 2 10h14l2-10ZM3 10h18M7 10l5-7 5 7M9 14v3M15 14v3"/>',
  undo: '<path d="m9 4-6 6 6 6M3 10h11a6 6 0 0 1 0 12"/>',
  play: '<path d="m8 4 12 8-12 8Z"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
  sound: '<path d="m11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
  muted: '<path d="m11 4-6 5H2v6h3l6 5ZM16 9l6 6M22 9l-6 6"/>',
  trophy: '<path d="M7 3h10v6a5 5 0 0 1-10 0ZM7 5H3v3a4 4 0 0 0 4 4M17 5h4v3a4 4 0 0 1-4 4M12 14v6M7 21h10"/>',
  leaf: '<path d="M20 3C9 2 3 7 4 14a6 6 0 0 0 6 6C18 20 22 12 20 3Z"/><path d="m3 21 12-12"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M20 12a8 8 0 0 0-14-5M4 12a8 8 0 0 0 14 5"/>',
});

export function gardenIcon(name, { className = '' } = {}) {
  const safeClass = String(className).replace(/[^a-zA-Z0-9_ -]/g, '');
  const shape = paths[name] || paths.leaf;
  return `<svg class="garden-icon${safeClass ? ` ${safeClass}` : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${shape}</svg>`;
}
