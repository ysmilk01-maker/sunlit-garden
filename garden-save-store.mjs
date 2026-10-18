// This layer checks JSON syntax only. Game/version/schema validation remains in
// evolution-core, garden-features, and seed-discovery so legacy saves still load.
export const GARDEN_SAVE_KEYS = Object.freeze([
  'sunlit-garden:campaign:run:v1',
  'sunlit-garden:campaign:progress:v1',
  'sunlit-garden:features:v1',
  'sunlit-garden:seed-discovery:v1',
]);

export const gardenBackupKey = key => `${key}:backup:v1`;
const protectedKeys = new Set(GARDEN_SAVE_KEYS);
const validJSON = raw => {
  if (typeof raw !== 'string') return false;
  try { JSON.parse(raw); return true; } catch { return false; }
};
const unavailable = () => new Error('Garden storage is unavailable');

/**
 * Storage-compatible adapter with one previous JSON snapshot per game key.
 * Corrupt bytes are retained in separate quarantine keys; they are never sent
 * anywhere. If preserving them fails, that primary key is not overwritten.
 * Reads can continue from memory. Failed primary writes/removals still throw,
 * preserving the existing saveRun/saveProfile boolean failure contract.
 */
export function createGardenSaveStore(rawStorage) {
  const values = new Map();
  const statuses = new Map();
  const blocked = new Map();
  const blockedBackups = new Set();
  const availableBackups = new Set();
  let quarantineSequence = 0;

  function statusFor(key) {
    if (!statuses.has(key)) statuses.set(key, {
      recovered: false, corrupt: false, volatile: false,
      backupFailed: false, quarantineFailed: false,
    });
    return statuses.get(key);
  }
  function read(key) {
    if (typeof rawStorage?.getItem !== 'function') throw unavailable();
    return rawStorage.getItem(key);
  }
  function write(key, value) {
    if (typeof rawStorage?.setItem !== 'function') throw unavailable();
    rawStorage.setItem(key, value);
  }
  function remove(key) {
    if (typeof rawStorage?.removeItem !== 'function') throw unavailable();
    rawStorage.removeItem(key);
  }
  function quarantine(key, raw, status) {
    try {
      // Do not overwrite another tab/session's preserved damaged record.
      let target;
      do {
        target = `${key}:quarantine:v1:${Date.now().toString(36)}-${++quarantineSequence}`;
      } while (read(target) !== null);
      write(target, raw);
      status.quarantineFailed = false;
      return true;
    } catch {
      status.quarantineFailed = true;
      return false;
    }
  }
  function readBackup(key, status) {
    const backupKey = gardenBackupKey(key);
    let raw;
    try { raw = read(backupKey); }
    catch {
      status.backupFailed = true;
      blockedBackups.add(key);
      return null;
    }
    if (raw === null) return null;
    if (validJSON(raw)) {
      availableBackups.add(key);
      return raw;
    }
    status.corrupt = true;
    if (!quarantine(backupKey, raw, status)) blockedBackups.add(key);
    return null;
  }
  function writeBackup(key, value, status) {
    if (blockedBackups.has(key)) {
      status.backupFailed = true;
      return;
    }
    try {
      write(gardenBackupKey(key), value);
      availableBackups.add(key);
      status.backupFailed = false;
    } catch { status.backupFailed = true; }
  }
  function load(key) {
    if (values.has(key)) return values.get(key);
    const status = statusFor(key);
    let current;
    try { current = read(key); }
    catch {
      status.volatile = true;
      values.set(key, null);
      return null;
    }
    if (!protectedKeys.has(key)) {
      values.set(key, current);
      return current;
    }
    const backup = readBackup(key, status);
    if (current !== null && validJSON(current)) {
      values.set(key, current);
      if (backup === null) writeBackup(key, current, status);
      return current;
    }
    if (current !== null) {
      status.corrupt = true;
      if (!quarantine(key, current, status)) {
        blocked.set(key, current);
        status.volatile = true;
      }
    }
    if (backup !== null) {
      status.recovered = true;
      values.set(key, backup);
      if (!blocked.has(key)) {
        try { write(key, backup); }
        catch { status.volatile = true; }
      }
      return backup;
    }
    values.set(key, null);
    return null;
  }

  // Inspect all four before the app's first automatic persist can replace a
  // malformed record. Missing storage is represented in status, never fatal.
  for (const key of GARDEN_SAVE_KEYS) load(key);

  return {
    getItem(key) { return load(String(key)); },
    setItem(key, input) {
      key = String(key);
      const value = String(input);
      const previous = load(key);
      const status = statusFor(key);
      if (protectedKeys.has(key) && !validJSON(value)) {
        throw new SyntaxError('Game save must contain valid JSON');
      }
      values.set(key, value);
      if (blocked.has(key)) {
        if (!quarantine(key, blocked.get(key), status)) {
          status.volatile = true;
          throw new Error('Damaged game save could not be preserved');
        }
        blocked.delete(key);
      }
      // Repeated automatic saves must not replace the previous snapshot with
      // an identical current value and erase useful recovery history.
      if (protectedKeys.has(key) && (previous !== value || !availableBackups.has(key))) {
        writeBackup(key, validJSON(previous) ? previous : value, status);
      }
      try {
        write(key, value);
        status.volatile = false;
      } catch (error) {
        status.volatile = true;
        throw error;
      }
    },
    removeItem(key) {
      key = String(key);
      const status = statusFor(key);
      values.set(key, null);
      try {
        // Removing backup first prevents an intentionally deleted record from
        // being resurrected by recovery on the next visit.
        if (protectedKeys.has(key)) remove(gardenBackupKey(key));
        remove(key);
        blocked.delete(key);
        blockedBackups.delete(key);
        availableBackups.delete(key);
        status.volatile = false;
        status.backupFailed = false;
      } catch (error) {
        status.volatile = true;
        throw error;
      }
    },
    getStatus() {
      const keys = Object.fromEntries([...statuses].map(([key, value]) => [key, { ...value }]));
      const aggregate = {};
      for (const flag of ['recovered', 'corrupt', 'volatile', 'backupFailed', 'quarantineFailed']) {
        aggregate[flag] = [...statuses.values()].some(value => value[flag]);
      }
      const state = aggregate.volatile ? 'volatile'
        : aggregate.backupFailed || aggregate.quarantineFailed ? 'degraded'
        : aggregate.recovered ? 'recovered' : aggregate.corrupt ? 'corrupt' : 'ready';
      return { state, ...aggregate, keys };
    },
  };
}
