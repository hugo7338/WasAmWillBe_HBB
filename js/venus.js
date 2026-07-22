// Venus, the childhood companion. Present chapters 1–7 — including the day
// in Savoie — and gone from the-corner on. She does not come back.
// Her black-and-white coat is the first carrier of the motif. She is never
// named on screen and never explained.

const SPRITE = `
<svg viewBox="0 0 76 54" aria-hidden="true">
  <path class="ln" d="M 22 24 C 27 18 41 15 51 19"/>
  <path class="ln" d="M 51 19 C 55 15 59 12 63 10"/>
  <path class="ln" d="M 63 10 C 67 6 72 8 74 13 C 74 17 71 19 67 19 C 63 19 59 17 57 14"/>
  <path class="ln" d="M 57 14 C 55 20 54 27 54 32"/>
  <path class="ln" d="M 54 32 C 44 36 32 36 25 32"/>
  <path class="ln" d="M 25 32 C 20 28 20 26 22 24"/>
  <path class="ln" d="M 63 9 C 61 4 61 1 63 0 C 66 2 68 6 68 10"/>
  <path class="ln" d="M 54 32 L 55 53"/>
  <path class="ln" d="M 46 33 L 46 53"/>
  <path class="ln" d="M 25 32 C 22 38 23 46 24 53"/>
  <path class="ln" d="M 33 34 C 32 40 33 47 33 53"/>
  <path class="ln" d="M 22 24 C 14 27 8 33 7 42"/>
  <path class="patch" d="M 54 32 C 45 35 33 35 25 32 C 34 29 46 29 54 32 Z"/>
  <path class="patch" d="M 56 18 C 58 15 61 12 64 10 C 66 13 66 16 65 18 C 62 20 59 23 57 25 C 55 23 55 20 56 18 Z"/>
</svg>`;

let host = null;

export function mount(el) {
  host = el;
  host.innerHTML = SPRITE;
}

// Present where the frontmatter says so, and nowhere else. She does not visibly age: the
// version that did moved 1.7% per chapter, which nobody can perceive, and
// growing is the wrong signal for ageing anyway. She is simply there, and then
// never again — the absence is the whole statement.
export function setState({ present }) {
  host.classList.toggle('is-present', present);
}
