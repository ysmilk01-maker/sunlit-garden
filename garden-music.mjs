/** In-game BGM only. Shares the game's context with SFX; owns only its nodes. */
export const GARDEN_MUSIC_URL = new URL('./assets/audio/beatwave-loop-v26.mp3', import.meta.url).href;

export function createGardenMusic({
  url = GARDEN_MUSIC_URL, getContext, fetcher = (...args) => fetch(...args),
  enabled = true, volume = .3, onChange = () => {},
} = {}) {
  let musicEnabled = enabled === true;
  let musicVolume = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : .3;
  let state = musicEnabled ? 'idle' : 'off';
  let context = null, gain = null, buffer = null, source = null;
  let activated = false, hidden = false, destroyed = false;
  let generation = 0, pending = null, loading = null, resuming = false;
  let offset = 0, startedAt = 0;
  const getStatus = () => ({ state, enabled: musicEnabled, volume: musicVolume });
  const wanted = () => !destroyed && musicEnabled && activated && !hidden;
  const notify = () => { try { onChange(getStatus()); } catch {} };
  function setState(next) { if (state !== next) { state = next; notify(); } }
  function asPromise(callback) { try { return Promise.resolve(callback()); } catch (error) { return Promise.reject(error); } }

  function stopSource() {
    const old = source;
    source = null;
    if (!old) return;
    if (buffer?.duration > 0) offset = (offset + Math.max(0, context.currentTime - startedAt)) % buffer.duration;
    old.onended = null;
    try { old.stop(); } catch {}
    try { old.disconnect(); } catch {}
  }
  function invalidate(next) { generation++; pending = null; stopSource(); setState(next); }
  function applyVolume() { if (gain) gain.gain.value = musicVolume; }

  function contextChanged() {
    if (destroyed) return;
    if (context.state === 'closed') { invalidate(musicEnabled ? 'error' : 'off'); return; }
    if (context.state !== 'running') {
      stopSource();
      if (musicEnabled && activated) setState('paused');
    } else if (wanted() && !pending && !resuming) {
      void play();
    }
  }
  function ensureGraph() {
    if (gain) {
      if (context.state === 'closed') throw new Error('Game audio context closed');
      return;
    }
    context = getContext();
    if (!context || context.state === 'closed') throw new Error('Game audio context unavailable');
    const node = context.createGain();
    try { node.gain.value = musicVolume; node.connect(context.destination); }
    catch (error) { try { node.disconnect(); } catch {} throw error; }
    gain = node;
    context.addEventListener?.('statechange', contextChanged);
  }
  function loadBuffer() {
    if (buffer) return Promise.resolve(buffer);
    if (loading) return loading;
    const audioContext = context;
    let request;
    request = asPromise(() => fetcher(url)).then(response => {
      if (!response?.ok) throw new Error('Music download failed');
      return response.arrayBuffer();
    }).then(bytes => {
      if (destroyed) return null;
      return audioContext.decodeAudioData(bytes);
    }).then(decoded => {
      if (destroyed) return null;
      if (!decoded || !Number.isFinite(decoded.duration) || decoded.duration <= 0) throw new Error('Invalid music buffer');
      buffer = decoded;
      return buffer;
    }).finally(() => { if (loading === request) loading = null; });
    loading = request;
    return request;
  }
  function resumeContext() {
    // Call before any await so the first pointer/key gesture unlocks audio.
    if (context.state === 'running') return Promise.resolve();
    resuming = true;
    const result = asPromise(() => context.resume());
    resuming = false;
    return result;
  }
  function play() {
    if (!wanted()) return Promise.resolve(getStatus());
    try { ensureGraph(); }
    catch { invalidate('error'); return Promise.resolve(getStatus()); }
    if (source && context.state === 'running') { setState('playing'); return Promise.resolve(getStatus()); }
    if (pending) {
      // A foreground/user gesture can unlock a previously pending Safari resume.
      if (context.state !== 'running') void resumeContext().catch(() => {});
      return pending;
    }
    const request = ++generation;
    setState('loading');
    if (!wanted()) return Promise.resolve(getStatus());
    const resumed = resumeContext();
    let attempt;
    attempt = Promise.all([resumed, loadBuffer()]).then(([, decoded]) => {
      if (request !== generation || !wanted() || !decoded) return getStatus();
      if (context.state !== 'running') { setState('paused'); return getStatus(); }
      if (!source) {
        const next = context.createBufferSource();
        next.buffer = decoded;
        next.loop = true;
        next.connect(gain);
        source = next;
        startedAt = context.currentTime;
        next.onended = () => {
          if (source !== next) return;
          source = null;
          try { next.disconnect(); } catch {}
          if (wanted()) setState('paused');
        };
        try { next.start(0, offset % decoded.duration); }
        catch (error) { stopSource(); throw error; }
      }
      setState('playing');
      return getStatus();
    }).catch(error => {
      if (request === generation && wanted()) {
        stopSource();
        setState(error?.name === 'NotAllowedError' ? 'blocked' : 'error');
      }
      return getStatus();
    }).finally(() => { if (pending === attempt) pending = null; });
    pending = attempt;
    return attempt;
  }
  function activate() {
    if (destroyed || !musicEnabled) return Promise.resolve(getStatus());
    activated = true;
    if (hidden) { setState('paused'); return Promise.resolve(getStatus()); }
    return play();
  }
  function setPreferences(patch = {}) {
    if (destroyed || !patch || typeof patch !== 'object') return getStatus();
    const before = getStatus();
    if (typeof patch.enabled === 'boolean') musicEnabled = patch.enabled;
    if (Number.isFinite(patch.volume)) musicVolume = Math.max(0, Math.min(1, patch.volume));
    applyVolume();
    if (!musicEnabled) { activated = false; invalidate('off'); }
    else if (!before.enabled) setState(hidden ? 'paused' : 'idle');
    if (state === before.state && (musicEnabled !== before.enabled || musicVolume !== before.volume)) notify();
    return getStatus();
  }
  function setHidden(value) {
    if (destroyed || typeof value !== 'boolean') return Promise.resolve(getStatus());
    if (hidden === value) return !hidden && wanted() ? play() : Promise.resolve(getStatus());
    hidden = value;
    if (hidden) { invalidate(musicEnabled ? 'paused' : 'off'); return Promise.resolve(getStatus()); }
    if (wanted()) return play();
    setState(musicEnabled ? 'idle' : 'off');
    return Promise.resolve(getStatus());
  }
  function destroy() {
    if (destroyed) return getStatus();
    destroyed = true; activated = false; musicEnabled = false;
    invalidate('off');
    context?.removeEventListener?.('statechange', contextChanged);
    try { gain?.disconnect(); } catch {}
    gain = null; buffer = null;
    // Never suspend/close the shared context: effects still need it.
    return getStatus();
  }
  return { activate, setPreferences, setHidden, getStatus, destroy };
}
