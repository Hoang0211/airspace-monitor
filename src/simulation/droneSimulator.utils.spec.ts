import { describe, expect, it } from "vitest";
import { angleDifference, clamp, createRng } from "./droneSimulator.utils";

describe("clamp", () => {
  it("keeps a value inside the limits", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe("angleDifference", () => {
  it.each([
    [0, 90, 90],
    [90, 0, -90],
    [350, 10, 20],
    [10, 350, -20],
    [0, 480, 120],
    [90, 90, 0],
  ])("turns from %i to %i by %i degrees", (from, to, expected) => {
    expect(angleDifference(from, to)).toBe(expected);
  });

  it("stays between -180 and 180 degrees", () => {
    for (let from = 0; from < 360; from += 15) {
      for (let to = -360; to < 720; to += 15) {
        const difference = angleDifference(from, to);

        expect(difference).toBeGreaterThanOrEqual(-180);
        expect(difference).toBeLessThan(180);
      }
    }
  });
});

describe("createRng", () => {
  it("repeats the same numbers for the same seed", () => {
    const first = createRng(7);
    const second = createRng(7);

    for (let i = 0; i < 100; i++) expect(first.next()).toBe(second.next());
  });

  it("produces different numbers for a different seed", () => {
    expect(createRng(7).next()).not.toBe(createRng(8).next());
  });

  it("stays inside the requested range", () => {
    const rng = createRng(7);

    for (let i = 0; i < 1000; i++) {
      const value = rng.range(-3, 5);

      expect(value).toBeGreaterThanOrEqual(-3);
      expect(value).toBeLessThan(5);
    }
  });

  it("can pick every item", () => {
    const rng = createRng(7);
    const items = ["a", "b", "c"];
    const picked = new Set(Array.from({ length: 100 }, () => rng.pick(items)));

    expect(picked).toEqual(new Set(items));
  });
});
