// Deterministic Mulberry32 PRNG for reproducible runs and screenshot captures.

export function createSeededRng(seed = 1) {
  let state = (Math.floor(seed) >>> 0) || 1;
  function next() {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  return {
    next,
    range(min, max) {
      return min + next() * (max - min);
    },
    int(min, max) {
      return Math.floor(min + next() * (max - min + 1));
    },
    chance(prob) {
      return next() < prob;
    },
    pick(list) {
      return list[Math.floor(next() * list.length)];
    },
  };
}
