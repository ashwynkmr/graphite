import { describe, expect, it } from 'vitest';
import { mulberry32 } from './rng';

const take = (seed: number, n: number) => {
  const rng = mulberry32(seed);
  return Array.from({ length: n }, () => rng.next());
};

describe('mulberry32', () => {
  it('is deterministic per seed', () => {
    expect(take(42, 20)).toEqual(take(42, 20));
    expect(take(42, 5)).not.toEqual(take(43, 5));
  });

  it('matches the reference mulberry32 output (guards against silent changes to the bank)', () => {
    // If this fails, every stored template seed would rebuild a different question.
    expect(take(1, 3).map((x) => x.toFixed(10))).toEqual(['0.6270739406', '0.0027357212', '0.5274470400']);
  });

  it('stays in [0, 1)', () => {
    for (const x of take(7, 10_000)) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('int covers the whole inclusive range roughly evenly', () => {
    const rng = mulberry32(99);
    const counts = new Map<number, number>();
    for (let i = 0; i < 6000; i++) {
      const v = rng.int(1, 6);
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    expect([...counts.keys()].sort()).toEqual([1, 2, 3, 4, 5, 6]);
    for (const c of counts.values()) expect(c).toBeGreaterThan(850);
  });

  it('int rejects bad ranges', () => {
    const rng = mulberry32(1);
    expect(() => rng.int(5, 1)).toThrow();
    expect(() => rng.int(0.5, 2)).toThrow();
    expect(rng.int(3, 3)).toBe(3);
  });

  it('pick and shuffle', () => {
    const rng = mulberry32(5);
    const items = ['a', 'b', 'c', 'd', 'e'];
    expect(items).toContain(rng.pick(items));
    expect(() => rng.pick([])).toThrow();
    const shuffled = rng.shuffle(items);
    expect(shuffled).not.toBe(items);
    expect([...shuffled].sort()).toEqual(items);
    expect(items).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(mulberry32(5).shuffle(items)).toEqual(mulberry32(5).shuffle(items));
  });

  it('chance respects the extremes', () => {
    const rng = mulberry32(3);
    expect(rng.chance(0)).toBe(false);
    expect(rng.chance(1)).toBe(true);
  });
});
