// Small, locally synthesized garden sounds. The app owns the shared AudioContext.
export const DROPLET_SOUND_DURATIONS = Object.freeze({
  select: .09, plant: .22, water: .39, bloom: .28, bee: .30,
  grow: .22, harvest: .46, undo: .18, win: .78, loss: .50,
});

const MAX_VOICES = 8;
const ALIASES = Object.freeze({ seed: 'select', soil: 'plant', pour: 'water' });
const PENTATONIC = [0, 2, 4, 7, 9];

function layersFor(name, step) {
  const semitones = PENTATONIC[step % 5] + 12 * Math.floor(step / 5);
  const flowerPitch = 392 * 2 ** (semitones / 12);
  const tone = (frequency, endFrequency, offset, duration, level, extra = {}) => ({
    kind: 'tone', frequency, endFrequency, offset, duration, level,
    waveform: 'triangle', cutoff: 2400, attack: .006, ...extra,
  });
  const noise = (offset, duration, level, frequency, endFrequency, extra = {}) => ({
    kind: 'noise', offset, duration, level, frequency, endFrequency,
    filter: 'bandpass', q: .65, attack: .008, ...extra,
  });
  switch (name) {
    case 'select': return [
      noise(0, .035, .040, 1500, 900),
      tone(680, 900, 0, .075, .045, { cutoff: 1800 }),
    ];
    case 'plant': return [
      noise(0, .13, .15, 550, 170, { filter: 'lowpass', attack: .012 }),
      noise(.028, .10, .060, 1600, 550),
      tone(195, 115, .004, .15, .10, { cutoff: 800 }),
      tone(530, 740, .085, .12, .055, { cutoff: 1600 }),
    ];
    case 'water': return [
      noise(0, .34, .12, 1700, 450, { attack: .055 }),
      tone(1120, 480, .025, .11, .048, { waveform: 'sine' }),
      tone(1460, 660, .13, .10, .040, { waveform: 'sine' }),
      tone(880, 390, .255, .115, .045, { waveform: 'sine' }),
    ];
    case 'bloom': return [
      noise(0, .08, .045, 1100, 2200),
      tone(flowerPitch * .97, flowerPitch, 0, .245, .080),
      tone(flowerPitch * 2, flowerPitch * 2, .012, .16, .027, { waveform: 'sine' }),
    ];
    case 'bee': return [
      noise(0, .25, .025, 1500, 800, { attack: .035 }),
      tone(175, 285, 0, .265, .038, { waveform: 'sawtooth', cutoff: 780, attack: .025 }),
      tone(182, 278, .012, .24, .027, { waveform: 'sawtooth', cutoff: 780, attack: .025 }),
    ];
    case 'grow': return [
      noise(0, .065, .045, 700, 1500),
      tone(330, 440, 0, .16, .060),
      tone(660, 880, .045, .155, .027, { waveform: 'sine' }),
    ];
    case 'harvest': return [
      noise(0, .085, .10, 900, 260, { filter: 'lowpass' }),
      tone(523.25, 523.25, 0, .19, .085),
      tone(659.25, 659.25, .09, .21, .065),
      tone(783.99, 783.99, .20, .24, .060),
    ];
    case 'undo': return [
      noise(0, .12, .045, 1200, 400),
      tone(440, 270, 0, .16, .050, { cutoff: 1200 }),
    ];
    case 'win': return [
      noise(0, .16, .055, 700, 2100, { attack: .025 }),
      tone(523.25, 523.25, 0, .25, .085),
      tone(659.25, 659.25, .115, .28, .075),
      tone(783.99, 783.99, .23, .30, .070),
      tone(1046.50, 1046.50, .37, .39, .060, { waveform: 'sine' }),
    ];
    case 'loss': return [
      noise(0, .20, .025, 800, 250, { filter: 'lowpass', attack: .025 }),
      tone(392, 349.23, 0, .24, .055, { cutoff: 1200, attack: .02 }),
      tone(293.66, 261.63, .16, .32, .050, { cutoff: 1100, attack: .02 }),
    ];
    default: return [];
  }
}

export function createDropletAudio({
  getContext,
  isEnabled = () => true,
  isHidden = () => false,
} = {}) {
  const voices = new Set();
  const buffers = new WeakMap();
  let disposed = false;

  function permitted() {
    try { return !disposed && Boolean(isEnabled()) && !isHidden(); }
    catch { return false; }
  }

  function finish(voice, cancel = false) {
    if (voice.finished) return;
    voice.finished = true;
    voices.delete(voice);
    const now = Number.isFinite(voice.context.currentTime) ? voice.context.currentTime : 0;
    // Muting the output first also prevents a partially built graph from leaking.
    try {
      voice.output?.gain.cancelScheduledValues(now);
      voice.output?.gain.setValueAtTime(0, now);
    } catch {}
    for (const source of voice.sources) {
      source.onended = null;
      if (cancel) { try { source.stop(now); } catch {} }
    }
    for (const node of voice.nodes) { try { node.disconnect(); } catch {} }
  }

  function noiseBuffer(context) {
    if (buffers.has(context)) return buffers.get(context);
    const rate = context.sampleRate;
    const buffer = context.createBuffer(1, Math.ceil(rate * .5), rate);
    const samples = buffer.getChannelData(0);
    // Deterministic noise avoids a dependency and makes captures repeatable.
    let seed = 0x2d6b79f5;
    for (let index = 0; index < samples.length; index++) {
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
      samples[index] = ((seed >>> 0) / 0xffffffff * 2 - 1) * .8;
    }
    buffers.set(context, buffer);
    return buffer;
  }

  function attachLayer(voice, spec, start) {
    const context = voice.context;
    const remember = node => { voice.nodes.push(node); return node; };
    const source = remember(spec.kind === 'noise' ? context.createBufferSource() : context.createOscillator());
    voice.sources.push(source);
    const filter = remember(context.createBiquadFilter());
    const gain = remember(context.createGain());
    const at = start + spec.offset;
    const end = at + spec.duration;

    if (spec.kind === 'noise') {
      source.buffer = noiseBuffer(context);
      filter.type = spec.filter;
      filter.Q.setValueAtTime(spec.q, at);
      filter.frequency.setValueAtTime(spec.frequency, at);
      filter.frequency.exponentialRampToValueAtTime(spec.endFrequency, end);
    } else {
      source.type = spec.waveform;
      source.frequency.setValueAtTime(spec.frequency, at);
      source.frequency.exponentialRampToValueAtTime(spec.endFrequency, end);
      filter.type = 'lowpass';
      filter.Q.setValueAtTime(.55, at);
      filter.frequency.setValueAtTime(spec.cutoff, at);
    }

    gain.gain.setValueAtTime(0, start);
    gain.gain.setValueAtTime(.0001, at);
    gain.gain.linearRampToValueAtTime(spec.level, at + spec.attack);
    gain.gain.exponentialRampToValueAtTime(.0001, end);
    gain.gain.setValueAtTime(0, end + .008);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(voice.output);
    source.onended = () => {
      voice.ended.add(source);
      if (voice.ended.size === voice.sources.length) finish(voice);
    };
    source.start(at);
    source.stop(end + .012);
  }

  function play(name, options = {}) {
    if (!permitted()) { stop(); return false; }
    if (typeof name !== 'string') return false;
    const canonical = Object.hasOwn(ALIASES, name) ? ALIASES[name] : name;
    if (!Object.hasOwn(DROPLET_SOUND_DURATIONS, canonical)) return false;
    let voice;
    try {
      const context = getContext?.();
      if (!context || context.state === 'closed') return false;
      if (!Number.isFinite(context.currentTime) || !(context.sampleRate > 0)) return false;
      const step = Number.isFinite(options?.step) ? Math.max(0, Math.min(9, Math.floor(options.step))) : 0;
      while (voices.size >= MAX_VOICES) finish(voices.values().next().value, true);
      voice = { context, nodes: [], sources: [], ended: new Set(), output: null, finished: false };
      voices.add(voice);
      voice.output = context.createGain();
      voice.nodes.push(voice.output);
      voice.output.gain.setValueAtTime(.65, context.currentTime);
      voice.output.connect(context.destination);
      for (const spec of layersFor(canonical, step)) attachLayer(voice, spec, context.currentTime);

      if (context.state !== 'running') {
        // Called synchronously in the gesture stack; rejection never escapes.
        Promise.resolve(context.resume()).then(() => {
          if (!permitted()) finish(voice, true);
        }, () => finish(voice, true));
      }
      return true;
    } catch {
      if (voice) finish(voice, true);
      return false;
    }
  }

  function stop() {
    for (const voice of [...voices]) finish(voice, true);
  }

  function dispose() { stop(); disposed = true; }

  return { play, stop, dispose };
}
