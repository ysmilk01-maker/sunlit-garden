/** A single BGM player. Call activate() directly from a user gesture. */
export function createGardenMusic({ audio, getContext, enabled = true, volume = .3, onChange = () => {} } = {}) {
  let musicEnabled = enabled === true;
  let musicVolume = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : .3;
  let state = musicEnabled ? 'idle' : 'off';
  let context = null;
  let source = null;
  let gain = null;
  let graphFailed = false;
  let activated = false;
  let hidden = false;
  let destroyed = false;
  let generation = 0;
  let allowedGeneration = null;
  let pending = null;
  const listeners = [];

  const getStatus = () => ({ state, enabled: musicEnabled, volume: musicVolume });
  const wanted = () => !destroyed && musicEnabled && activated && !hidden;

  function notify() {
    try { onChange(getStatus()); } catch { /* A UI callback must not stop play. */ }
  }

  function setState(next) {
    if (state === next) return;
    state = next;
    notify();
  }

  function pauseAudio() {
    try { audio?.pause(); } catch { /* Media failures do not affect the game. */ }
  }

  function invalidate(next) {
    generation++;
    allowedGeneration = null;
    pending = null;
    pauseAudio();
    setState(next);
  }

  function applyVolume() {
    if (gain) gain.gain.value = musicVolume;
  }

  function ensureGraph() {
    if (graphFailed) return false;
    if (gain) return true;
    try {
      if (!audio || typeof audio.play !== 'function' || typeof audio.pause !== 'function') {
        throw new Error('Audio element unavailable');
      }
      context = getContext();
      // Store the source immediately: a media element can be connected only once.
      source = context.createMediaElementSource(audio);
      gain = context.createGain();
      applyVolume();
      source.connect(gain);
      gain.connect(context.destination);
      return true;
    } catch {
      graphFailed = true;
      invalidate('error');
      return false;
    }
  }

  function callAsPromise(callback) {
    try { return Promise.resolve(callback()); }
    catch (error) { return Promise.reject(error); }
  }

  function play() {
    if (!wanted()) return Promise.resolve(getStatus());
    if (pending) return pending;
    if (state === 'playing' && !audio?.paused && context?.state !== 'suspended') {
      return Promise.resolve(getStatus());
    }
    if (!ensureGraph()) return Promise.resolve(getStatus());

    const request = ++generation;
    allowedGeneration = request;
    setState('loading');
    if (!wanted()) return Promise.resolve(getStatus());

    // Both calls stay in this gesture's stack. Awaiting resume() first can lose
    // the mobile browser's permission to start the HTML audio element.
    const resume = callAsPromise(() => context.resume());
    const playback = callAsPromise(() => audio.play()).then(() => {
      // A separate guard still runs if resume() rejected before play() settled.
      // A newer valid attempt may own the same element; do not pause that one.
      if (allowedGeneration === null || !wanted() || graphFailed) pauseAudio();
    });
    let attempt;
    attempt = Promise.all([resume, playback]).then(() => {
      if (request !== generation || !wanted()) {
        if (!wanted()) pauseAudio();
        return getStatus();
      }
      setState('playing');
      return getStatus();
    }).catch(error => {
      if (request !== generation || !wanted()) {
        if (!wanted()) pauseAudio();
        return getStatus();
      }
      allowedGeneration = null;
      pauseAudio();
      setState(error?.name === 'NotAllowedError' ? 'blocked' : 'error');
      return getStatus();
    }).finally(() => {
      if (pending === attempt) pending = null;
    });
    pending = attempt;
    return attempt;
  }

  function activate() {
    if (destroyed || !musicEnabled) return Promise.resolve(getStatus());
    activated = true;
    if (hidden) {
      setState('paused');
      return Promise.resolve(getStatus());
    }
    try {
      if (!graphFailed && audio?.error) {
        // Media errors may remain latched until load(). Reset only on an
        // explicit activation, in the same gesture as the subsequent play().
        invalidate('idle');
        audio.load();
      }
    } catch {
      invalidate('error');
      return Promise.resolve(getStatus());
    }
    return play();
  }

  function setPreferences(patch = {}) {
    if (destroyed || !patch || typeof patch !== 'object') return getStatus();
    const before = getStatus();
    if (typeof patch.enabled === 'boolean') musicEnabled = patch.enabled;
    if (Number.isFinite(patch.volume)) musicVolume = Math.max(0, Math.min(1, patch.volume));
    try { applyVolume(); }
    catch { graphFailed = true; invalidate('error'); }

    if (!musicEnabled) {
      // Re-enabling alone must not start playback, including on tab return.
      activated = false;
      invalidate('off');
    } else if (!before.enabled) {
      setState(graphFailed ? 'error' : hidden ? 'paused' : 'idle');
    }
    if (state === before.state && (musicEnabled !== before.enabled || musicVolume !== before.volume)) notify();
    return getStatus();
  }

  function setHidden(value) {
    if (destroyed || typeof value !== 'boolean' || hidden === value) return Promise.resolve(getStatus());
    hidden = value;
    if (hidden) {
      invalidate(musicEnabled ? 'paused' : 'off');
      return Promise.resolve(getStatus());
    }
    if (wanted()) return play();
    setState(musicEnabled ? (graphFailed ? 'error' : 'idle') : 'off');
    return Promise.resolve(getStatus());
  }

  function listen(type, callback) {
    try {
      audio?.addEventListener(type, callback);
      listeners.push([type, callback]);
    } catch { /* Optional event handling is safe for unavailable audio. */ }
  }

  listen('error', () => {
    if (!destroyed) invalidate(musicEnabled ? 'error' : 'off');
  });
  listen('pause', () => {
    if (wanted() && !pending && audio.paused && state === 'playing') setState('paused');
  });

  function destroy() {
    if (destroyed) return getStatus();
    destroyed = true;
    activated = false;
    musicEnabled = false;
    for (const [type, callback] of listeners) {
      try { audio?.removeEventListener(type, callback); } catch {}
    }
    listeners.length = 0;
    invalidate('off');
    try { source?.disconnect(); } catch {}
    try { gain?.disconnect(); } catch {}
    // The AudioContext belongs to the game and may still play sound effects.
    return getStatus();
  }

  return { activate, setPreferences, setHidden, getStatus, destroy };
}
