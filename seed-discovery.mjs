// Read acknowledgements only: independent of the run, campaign, and player profile.
export const SEED_DISCOVERY_KEY = 'sunlit-garden:seed-discovery:v1';
const SCHEMA_VERSION = 1;
const MAX_RECORD_LENGTH = 8192;
const SEED_IDS = Object.freeze([
  'sunflower', 'clover', 'lavender', 'berry', 'mushroom', 'hive',
  'mint', 'tulip', 'fern', 'pumpkin', 'rose', 'lotus', 'daisy',
  'bluebell', 'strawberry', 'bamboo', 'cactus', 'hydrangea', 'orchid', 'cherry',
]);
const supported = new Set(SEED_IDS);

function uniqueAllowed(ids, allowed) {
  if (!Array.isArray(ids) && !(ids instanceof Set)) return [];
  return [...new Set([...ids].filter(id => typeof id === 'string' && allowed.has(id)))];
}

/**
 * Only acknowledge() writes. Reading or dismissing a queue does not mark it read.
 * durable means every acknowledgement held in memory is in the last readable
 * stored record (or was successfully written), not a promise of browser retention.
 */
export function createSeedDiscovery(storage, { validIds = SEED_IDS } = {}) {
  const allowed = new Set(uniqueAllowed(validIds, supported));
  // Retain all supported stored IDs even if this caller uses a legacy subset.
  // Otherwise an older tab could erase newer plants' acknowledgements on write.
  const known = new Set();
  let durable = false;

  function read() {
    try {
      if (typeof storage?.getItem !== 'function') return { readable: false, writable: false };
      const raw = storage.getItem(SEED_DISCOVERY_KEY);
      const writable = typeof storage.setItem === 'function';
      if (raw === null) return { readable: true, writable, ids: [] };
      if (typeof raw !== 'string' || raw.length > MAX_RECORD_LENGTH) {
        return { readable: false, writable };
      }
      let value;
      try { value = JSON.parse(raw); } catch { return { readable: false, writable }; }
      if (value && typeof value === 'object' && Number.isInteger(value.version) && value.version > SCHEMA_VERSION) {
        // A newer application owns this format. Do not downgrade its record.
        return { readable: false, writable: false };
      }
      if (!value || value.version !== SCHEMA_VERSION || !Array.isArray(value.seen)) {
        return { readable: false, writable };
      }
      return { readable: true, writable, ids: uniqueAllowed(value.seen, supported) };
    } catch {
      // If reading is blocked, do not overwrite data that cannot be merged.
      return { readable: false, writable: false };
    }
  }

  function refresh() {
    const record = read();
    if (record.readable) {
      for (const id of record.ids) known.add(id);
      const stored = new Set(record.ids);
      durable = [...known].every(id => stored.has(id));
    } else durable = false;
    return record;
  }

  function unseen(ids) {
    refresh();
    return uniqueAllowed(ids, allowed).filter(id => !known.has(id));
  }

  function hasSeen(id) {
    if (typeof id !== 'string' || !allowed.has(id)) return false;
    refresh();
    return known.has(id);
  }

  function acknowledge(id) {
    if (typeof id !== 'string' || !allowed.has(id)) return false;
    // Re-read immediately before writing so another tab's known IDs are merged.
    const record = refresh();
    known.add(id);
    if (record.readable && [...known].every(value => record.ids.includes(value))) {
      durable = true;
      return true;
    }
    durable = false;
    if (record.writable) {
      try {
        storage.setItem(SEED_DISCOVERY_KEY, JSON.stringify({
          version: SCHEMA_VERSION,
          seen: SEED_IDS.filter(value => known.has(value)),
        }));
        durable = true;
      } catch { /* Memory still suppresses repeats for this running instance. */ }
    }
    return true;
  }

  function getStatus() {
    refresh();
    return { durable, seen: SEED_IDS.filter(id => allowed.has(id) && known.has(id)) };
  }

  refresh();
  return { unseen, acknowledge, hasSeen, getStatus };
}
