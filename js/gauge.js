// Real elevation of the place. A fact, not a feeling — which is exactly why
// it is allowed on screen (CLAUDE.md §2). Blank where nothing is true:
// symbolic locations, and the whole of Zone E, where the detour gains nothing.

let host = null;

export function mount(el) { host = el; }

export function setValue(metres) {
  host.textContent = metres == null ? '' : `${metres} m`;
}
