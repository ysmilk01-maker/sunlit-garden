// Offline-capable, deterministic PCM effects. The caller owns the AudioContext
// and calls stop() when muting, hiding the page, or cancelling an interaction.
export const GARDEN_SOUND_DURATIONS = Object.freeze({
  select: .12, inspect: .16, plant: .27, harvest: .48, bloom: .23,
  evolve: .62, upgrade: .38, reroll: .30, undo: .19, mission: .43,
  success: .65, fail: .46,
});
export const GARDEN_MAX_VOICES = 3;
const RATE_LIMIT = Object.freeze({ select: .045, inspect: .06, bloom: .035 });
const DEFAULT_VOLUME = .9;
const TYPES = Object.freeze({
  sunflower: [0, 'flower'], clover: [2, 'leaf'], berry: [4, 'fruit'],
  lavender: [7, 'flower'], mushroom: [-5, 'earth'], hive: [-2, 'hive'],
  mint: [9, 'leaf'], tulip: [5, 'flower'], fern: [-3, 'leaf'],
  pumpkin: [-7, 'fruit'], rose: [12, 'flower'], lotus: [11, 'flower'],
  daisy: [14, 'flower'], bluebell: [16, 'flower'], strawberry: [17, 'fruit'],
  bamboo: [1, 'leaf'], cactus: [3, 'earth'], hydrangea: [6, 'flower'],
  orchid: [8, 'flower'], cherry: [10, 'flower'],
});
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const safeOptions = options => ({
  type: typeof options?.type === 'string' && own(TYPES, options.type) ? options.type : 'sunflower',
  step: Number.isFinite(options?.step) ? clamp(Math.floor(options.step), 0, 9) : 0,
});

function layersFor(kind, type, step) {
  const [semitones, family] = TYPES[type], pitch = 330 * 2 ** (semitones / 12);
  const tone = (f, offset, duration, level = 1, extra = {}) => ({ kind: 'tone', f, end: f, offset, duration, level, attack: .008, ...extra });
  const noise = (offset, duration, level, cutoff = 1100) => ({ kind: 'noise', offset, duration, level, cutoff, attack: .012 });
  const chord = (notes, spacing, length, basePitch = 330) => notes.map((note, i) => tone(basePitch * 2 ** (note / 12), i * spacing, length, 1 - i * .11));
  switch (kind) {
    case 'select': return [tone(pitch, 0, .108, .8, { end: pitch * 1.035 }), noise(0, .032, .17, 1400)];
    case 'inspect': return [tone(294, 0, .10, .75), tone(440, .055, .10, .5)];
    case 'plant': {
      const soil = [noise(0, .105, .85, 340), tone(145, 0, .11, .65, { end: 82 })];
      if (family === 'leaf') return [...soil, noise(.045, .14, .55, 1700), tone(pitch, .085, .15, .48)];
      if (family === 'fruit') return [...soil, tone(pitch, .06, .095, .9, { end: pitch * .72 }), tone(pitch * 1.5, .15, .11, .55)];
      if (family === 'earth') return [...soil, tone(110, .04, .18, .8, { end: 70 }), noise(.1, .11, .3, 520)];
      if (family === 'hive') return [...soil, tone(190, .045, .19, .48, { end: 250, harmonics: .22 }), tone(380, .11, .14, .38)];
      return [...soil, tone(pitch, .075, .18, .65), tone(pitch * 1.5, .1, .15, .24), noise(.065, .1, .18, 1500)];
    }
    case 'harvest': return [noise(0, .10, .45, 500), ...chord([0, 4, 7], .105, .24, 392)];
    case 'bloom': {
      const scale = [0, 2, 4, 7, 9], f = 262 * 2 ** ((scale[step % 5] + (step >= 5 ? 12 : 0)) / 12);
      return [tone(f, 0, .21, .8), tone(f * 1.5, .018, .13, .19), noise(0, .045, .16)];
    }
    case 'evolve': return [noise(0, .17, .35, 1200), ...chord([0, 4, 7, 12], .095, .30, 294), tone(440, .29, .31, .23)];
    case 'upgrade': return [...chord([0, 7, 12], .075, .21, 330), noise(0, .055, .17, 900)];
    case 'reroll': return [noise(0, .09, .4, 1300), noise(.08, .10, .35, 1100), tone(440, .025, .11, .6, { end: 330 }), tone(392, .155, .13, .65)];
    case 'undo': return [tone(390, 0, .17, .75, { end: 240 }), noise(0, .1, .13, 600)];
    case 'mission': return [...chord([0, 7, 9], .085, .24, 349), noise(0, .06, .14, 1200)];
    case 'success': return [...chord([0, 4, 7, 12], .105, .32, 330), tone(330, .22, .39, .28), noise(0, .10, .18, 1000)];
    case 'fail': return [tone(330, 0, .25, .72, { end: 294, attack: .015 }), tone(247, .17, .27, .65, { end: 220, attack: .015 }), noise(0, .1, .09, 500)];
    default: return [];
  }
}

/** Pure PCM renderer, also used by tests and the optional local listening lab.
 * No normalization above .24 full scale; three voices peak at <= .72 before
 * volume. This bound covers this effect bus, not a separate music track.
 */
export function renderGardenSound(kind, options = {}, sampleRate = 48000) {
  if (typeof kind !== 'string' || !own(GARDEN_SOUND_DURATIONS, kind)
    || !Number.isInteger(sampleRate) || sampleRate < 8000 || sampleRate > 192000) return null;
  const { type, step } = safeOptions(options), duration = GARDEN_SOUND_DURATIONS[kind];
  const samples = new Float32Array(Math.ceil(duration * sampleRate));
  let random = 0x63f129ab;
  for (const spec of layersFor(kind, type, step)) {
    const start = Math.floor(spec.offset * sampleRate), length = Math.ceil(spec.duration * sampleRate);
    let phase = 0, filtered = 0;
    const alpha = 1 - Math.exp(-2 * Math.PI * (spec.cutoff || 1200) / sampleRate);
    for (let i = 0; i < length && start + i < samples.length; i++) {
      const time = i / sampleRate, position = i / Math.max(1, length - 1);
      const attack = Math.min(1, time / spec.attack), release = Math.min(1, (length - 1 - i) / Math.max(1, sampleRate * .026));
      const envelope = attack * release * Math.exp(-position * 3.8) * spec.level;
      let value;
      if (spec.kind === 'noise') {
        random ^= random << 13; random ^= random >>> 17; random ^= random << 5;
        const white = (random >>> 0) / 0xffffffff * 2 - 1;
        filtered += alpha * (white - filtered); value = filtered;
      } else {
        const frequency = spec.f + (spec.end - spec.f) * position;
        phase += 2 * Math.PI * frequency / sampleRate;
        value = Math.sin(phase) + (spec.harmonics || .08) * Math.sin(2 * phase);
      }
      samples[start + i] += value * envelope;
    }
  }
  let rawPeak = 0;
  for (const value of samples) rawPeak = Math.max(rawPeak, Math.abs(value));
  // Fail is deliberately gentler; repeated selection remains a small tactile cue.
  const targetPeak = kind === 'select' ? .19 : kind === 'inspect' ? .18 : kind === 'fail' ? .18 : .24;
  const scale = rawPeak > 0 ? targetPeak / rawPeak : 0;
  let squareSum = 0, peak = 0;
  for (let i = 0; i < samples.length; i++) {
    // A short final fade also covers the rare case of a layer reaching the end.
    const edgeFade = Math.min(1, i / (sampleRate * .003), (samples.length - 1 - i) / (sampleRate * .006));
    samples[i] *= scale * edgeFade;
    peak = Math.max(peak, Math.abs(samples[i])); squareSum += samples[i] ** 2;
  }
  return { samples, sampleRate, duration, peak, rms: Math.sqrt(squareSum / samples.length), type, step };
}

export function createGardenAudio({ getContext, isEnabled = () => true, isHidden = () => false, getVolume = () => DEFAULT_VOLUME } = {}) {
  const voices = new Set(), buffers = new WeakMap(), prepared = new WeakSet(), lastPlayed = new Map();
  const permitted = () => { try { return Boolean(isEnabled()) && !isHidden(); } catch { return false; } };
  const volume = () => { try { const value = getVolume(); return Number.isFinite(value) ? clamp(value, 0, 1) : 0; } catch { return 0; } };
  function finish(voice, cancel = false) {
    if (voice.finished) return;
    voice.finished = true; voices.delete(voice);
    if (lastPlayed.get(voice.kind) === voice) lastPlayed.delete(voice.kind);
    const now = Number.isFinite(voice.context.currentTime) ? voice.context.currentTime : 0;
    try { voice.output?.gain.cancelScheduledValues(now); voice.output?.gain.setValueAtTime(0, now); } catch {}
    if (voice.source) { voice.source.onended = null; if (cancel) { try { voice.source.stop(now); } catch {} } }
    for (const node of voice.nodes) { try { node.disconnect(); } catch {} }
  }
  function stop() { for (const voice of [...voices]) finish(voice, true); lastPlayed.clear(); }
  function bufferFor(context, kind, options) {
    let cache = buffers.get(context); if (!cache) { cache = new Map(); buffers.set(context, cache); }
    // Only select/plant depend on species; only bloom depends on its step.
    // Canonical keys keep all playable variants in 59 entries, below the cap.
    const key = kind === 'select' || kind === 'plant' ? `${kind}:${options.type}`
      : kind === 'bloom' ? `${kind}:${options.step}` : kind;
    if (cache.has(key)) return cache.get(key);
    const rendered = renderGardenSound(kind, options, context.sampleRate);
    if (!rendered) throw new Error('Unsupported audio sample rate');
    const buffer = context.createBuffer(1, rendered.samples.length, context.sampleRate);
    buffer.getChannelData(0).set(rendered.samples);
    if (cache.size >= 128) cache.delete(cache.keys().next().value);
    cache.set(key, buffer); return buffer;
  }
  function prepare() {
    if (!permitted() || !volume()) return false;
    try {
      const context = getContext?.();
      if (!context || context.state === 'closed') return false;
      if (prepared.has(context)) return true;
      for (const type of Object.keys(TYPES)) {
        bufferFor(context, 'select', {type, step: 0});
        bufferFor(context, 'plant', {type, step: 0});
      }
      for (let step = 0; step < 10; step++) bufferFor(context, 'bloom', {type: 'sunflower', step});
      for (const kind of Object.keys(GARDEN_SOUND_DURATIONS)) {
        if (kind !== 'select' && kind !== 'plant' && kind !== 'bloom') {
          bufferFor(context, kind, {type: 'sunflower', step: 0});
        }
      }
      prepared.add(context);
      return true;
    } catch { return false; }
  }
  function play(kind, options = {}) {
    const level = volume();
    if (!permitted() || !level) { stop(); return false; }
    if (typeof kind !== 'string' || !own(GARDEN_SOUND_DURATIONS, kind)) return false;
    let voice;
    try {
      const context = getContext?.();
      if (!context || context.state === 'closed' || !Number.isFinite(context.currentTime)) return false;
      const recent = lastPlayed.get(kind);
      if (RATE_LIMIT[kind] && recent?.context === context && context.currentTime - recent.at >= 0 && context.currentTime - recent.at < RATE_LIMIT[kind]) return false;
      const buffer = bufferFor(context, kind, safeOptions(options));
      while (voices.size >= GARDEN_MAX_VOICES) finish(voices.values().next().value, true);
      voice = { kind, context, at: context.currentTime, nodes: [], source: null, output: null, finished: false };
      voices.add(voice);
      voice.output = context.createGain(); voice.nodes.push(voice.output);
      voice.output.gain.setValueAtTime(level, context.currentTime); voice.output.connect(context.destination);
      voice.source = context.createBufferSource(); voice.nodes.push(voice.source);
      voice.source.buffer = buffer; voice.source.connect(voice.output);
      voice.source.onended = () => finish(voice);
      voice.source.start(context.currentTime);
      voice.source.stop(context.currentTime + GARDEN_SOUND_DURATIONS[kind]);
      lastPlayed.set(kind, voice);
      // Keep resume in the trusted gesture stack. Its rejection is contained.
      if (context.state !== 'running') Promise.resolve(context.resume()).then(() => {
        if (!permitted() || !volume()) finish(voice, true);
      }, () => finish(voice, true));
      return true; // Scheduled, not proof of output through the user's speakers.
    } catch { if (voice) finish(voice, true); return false; }
  }
  return { play, stop, prepare };
}
