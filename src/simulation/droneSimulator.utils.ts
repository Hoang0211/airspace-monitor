export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** The smallest signed turn from one heading to another, from -180 up to 180 degrees. */
export function angleDifference(from: number, to: number): number {
  return ((((to - from + 180) % 360) + 360) % 360) - 180;
}

/**
 * A small seeded random number generator, using the published mulberry32 algorithm.
 *
 * Nothing here is truly random. Each number is calculated from a stored value that starts as the
 * seed, so the same seed always gives the same sequence. That makes flights repeatable and tests
 * exact, which Math.random() can't do because it can't be given a seed.
 */
export function createRng(seed: number) {
  // The only stored value. `>>> 0` makes the seed a whole, non-negative 32-bit number.
  let state = seed >>> 0;

  /** Returns the next number in the sequence, from 0 up to 1. */
  function next(): number {
    // Adding the same constant every time gives each call a new value to work from. On its own,
    // this would be an obvious pattern, so the steps below scramble a copy of it.
    state = (state + 0x6d2b79f5) >>> 0;

    // Mix the bits together: `>>>` shifts them right, `^` combines two numbers bit by bit, and
    // Math.imul multiplies as 32-bit integers. A small change in the input changes the whole
    // output, so the results look random even though the stored value rises steadily.
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    // Mix once more, then divide by 2^32 to turn the 32-bit result into a number from 0 up to 1.
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    next,
    /** Stretches the next number to fit between min and max. */
    range: (min: number, max: number) => min + next() * (max - min),
    /** Uses the next number to choose one item. */
    pick: <T>(items: readonly T[]) => items[Math.floor(next() * items.length)],
  };
}
