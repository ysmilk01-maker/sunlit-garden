// Short, interruptible planting/evolution feedback. Game state is never delayed.
export function createGardenFeedback({ reduced, hidden = () => document.hidden }) {
  let active = null;
  function clear() {
    const effect = active; active = null;
    if (!effect) return;
    effect.animations.forEach(animation => animation.cancel());
    effect.layer?.remove(); effect.cell?.classList.remove('just-planted', 'just-evolved');
  }
  function play(cell, kind = 'plant', type = '') {
    clear(); const image = cell?.querySelector('svg');
    if (!image?.animate || hidden()) return;
    const effect = { cell, layer: null, animations: [] }; active = effect;
    cell.classList.add(kind === 'evolve' ? 'just-evolved' : 'just-planted');
    const animate = (element, frames, options = {}) => {
      const animation = element.animate(frames, { duration: 240, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'both', ...options });
      effect.animations.push(animation); animation.finished.catch(() => {}); return animation;
    };
    const finish = animation => animation.finished.catch(() => {}).finally(() => { if (active === effect) clear(); });
    if (reduced.matches) { finish(animate(image, [{ opacity: .65 }, { opacity: 1 }], { duration: 160 })); return; }
    if (kind === 'evolve') {
      const ring = document.createElement('span'); ring.className = 'evolution-ring'; ring.setAttribute('aria-hidden', 'true'); cell.append(ring); effect.layer = ring;
      animate(ring, [{ transform: 'scale(.92)', opacity: 0 }, { offset: .35, transform: 'scale(1)', opacity: .9 }, { transform: 'scale(1.08)', opacity: 0 }], { duration: 300 });
      finish(animate(image, [{ transform: 'translateY(6%) scale(.94)', opacity: .3 }, { offset: .65, transform: 'translateY(-3%) scale(1.03)', opacity: 1 }, { transform: 'translateY(0) scale(1)', opacity: 1 }], { duration: 300 }));
      return;
    }
    const layer = document.createElement('span'); layer.className = 'planting-effect'; layer.setAttribute('aria-hidden', 'true'); effect.layer = layer;
    layer.innerHTML = '<i class="planting-soil"></i><i class="planting-seed"></i>' + '<i class="soil-grain"></i>'.repeat(5); cell.append(layer);
    animate(layer.querySelector('.planting-seed'), [{ transform: 'translate(-50%,-230%) rotate(-25deg)', opacity: 1 }, { offset: .75, transform: 'translate(-50%,-50%) rotate(15deg)', opacity: 1 }, { transform: 'translate(-50%,-20%) rotate(20deg)', opacity: 0 }], { duration: 120 });
    animate(layer.querySelector('.planting-soil'), [{ transform: 'translate(-50%,-50%) scale(.95)', opacity: 0 }, { offset: .25, transform: 'translate(-50%,-50%) scale(1)', opacity: .7 }, { transform: 'translate(-50%,-50%) scale(1.08)', opacity: 0 }], { delay: 60 });
    const size = cell.getBoundingClientRect().width;
    const scatter = [[-.28, -.2], [-.17, -.34], [.02, -.38], [.21, -.3], [.3, -.12]];
    layer.querySelectorAll('.soil-grain').forEach((grain, i) => {
      const [x, y] = scatter[i];
      animate(grain, [{ transform: 'translate(-50%,-50%)', opacity: 0 }, { offset: .15, transform: 'translate(-50%,-50%)', opacity: .85 }, { offset: .6, transform: `translate(${x*size}px,${y*size}px) rotate(${i*37}deg)`, opacity: .7 }, { transform: `translate(${x*size*1.1}px,${size*.03}px) rotate(${i*63}deg)`, opacity: 0 }], { duration: 200, delay: 80 });
    });
    finish(animate(image, type === 'hive' ? [{ transform: 'translateY(-10%) scale(.95)', opacity: 0 }, { offset: .7, transform: 'translateY(2%) scale(1)', opacity: 1 }, { transform: 'translateY(0) scale(1)', opacity: 1 }] : [{ transform: 'translateY(14%) scale(.92)', opacity: 0 }, { offset: .65, transform: 'translateY(-3%) scale(1.03)', opacity: 1 }, { transform: 'translateY(0) scale(1)', opacity: 1 }], { duration: 200, delay: 100 }));
  }
  return { play, clear };
}
