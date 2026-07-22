// A map interlude: one station that is not a chapter. No text, no title, no
// caption — the distance is the whole argument, and saying so would spend it.

import * as globe from './globe.js?v=1784752826';

// Scroll is linear; a flight is not. A smoothstep lets each end settle so the
// globe arrives rather than stopping.
const ease = (t) => t * t * (3 - 2 * t);

export function render(spec, rings) {
  const section = document.createElement('section');
  section.className = 'interlude';
  section.dataset.interlude = spec.id;
  section.style.setProperty('--hold', spec.hold);

  const inner = document.createElement('div');
  inner.className = 'interlude__inner';

  const g = globe.create(rings, spec.from, spec.to);
  inner.append(g.svg);
  section.append(inner);

  return { section, update: (t) => g.update(ease(Math.max(0, Math.min(1, t)))) };
}
