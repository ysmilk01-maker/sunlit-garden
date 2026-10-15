// Weather is a visual reflection of the current game day; it never changes state.
const WEATHER_IDS = new Set(['sun', 'rain', 'cloud']);
const scenes = new WeakMap();

function decorate(doc, parent, className, count) {
  for (let index = 0; index < count; index += 1) {
    const element = doc.createElement('i');
    element.className = className;
    parent.append(element);
  }
}

/**
 * Mount once in the app shell. Call update(currentWeather, { paused }) on render.
 * The home screen may pause this layer; document visibility is handled here.
 * destroy() is available for previews/tests that replace the app shell.
 */
export function createWeatherScene(root = globalThis.document?.querySelector('.app')) {
  if (!root?.ownerDocument) throw new TypeError('Weather scene needs an app element.');
  if (scenes.has(root)) return scenes.get(root);
  const doc = root.ownerDocument;
  const scene = doc.createElement('div');
  scene.className = 'weather-scene';
  scene.setAttribute('aria-hidden', 'true');
  const layers = {};
  for (const weather of WEATHER_IDS) {
    const layer = doc.createElement('div');
    layer.className = `weather-scene__layer weather-scene__${weather}`;
    layer.dataset.weather = weather;
    layers[weather] = layer;
    scene.append(layer);
  }
  decorate(doc, layers.sun, 'weather-scene__sun-disc', 1);
  decorate(doc, layers.sun, 'weather-scene__ray', 3);
  decorate(doc, layers.sun, 'weather-scene__mote', 8);
  decorate(doc, layers.rain, 'weather-scene__cloud-puff', 3);
  decorate(doc, layers.rain, 'weather-scene__drop', 16);
  decorate(doc, layers.rain, 'weather-scene__ripple', 3);
  decorate(doc, layers.cloud, 'weather-scene__cloud-puff', 4);
  decorate(doc, layers.cloud, 'weather-scene__haze', 1);
  root.prepend(scene);

  let manuallyPaused = false;
  let destroyed = false;
  const syncPaused = () => {
    scene.dataset.paused = String(manuallyPaused || Boolean(doc.hidden));
  };
  const api = {
    element: scene,
    update(weather, options = {}) {
      if (destroyed) return;
      const id = WEATHER_IDS.has(weather) ? weather : 'sun';
      // Attribute writes are skipped on normal planting renders within a day.
      if (scene.dataset.weather !== id) {
        scene.dataset.weather = id;
        root.dataset.sceneWeather = id;
      }
      if ('paused' in options) manuallyPaused = Boolean(options.paused);
      syncPaused();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      doc.removeEventListener('visibilitychange', syncPaused);
      scene.remove();
      delete root.dataset.sceneWeather;
      scenes.delete(root);
    },
  };
  doc.addEventListener('visibilitychange', syncPaused);
  scenes.set(root, api);
  api.update('sun');
  return api;
}
