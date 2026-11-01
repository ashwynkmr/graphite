import { describe, expect, it } from 'vitest';
import { R, Rational } from './rational';

describe('Rational construction', () => {
  it('reduces and normalises the sign', () => {
    expect(R(2, 4).toFractionString()).toBe('1/2');
    expect(R(3, -6).toFractionString()).toBe('-1/2');
    expect(R(-3, -6).toFractionString()).toBe('1/2');
    expect(R(0, 5).toFractionString()).toBe('0');
  });

  it('rejects a zero denominator and unsafe numbers', () => {
    expect(() => R(1, 0)).toThrow();
    expect(() => R(0.5)).toThrow();
    expect(() => R(2 ** 60)).toThrow();
  });
});

describe('Rational.parse', () => {
  it.each([
    ['45', '45'],
    ['-45', '-45'],
    ['2.5', '5/2'],
    ['.5', '1/2'],
    ['-.5', '-1/2'],
    ['5.', '5'],
    ['0.50', '1/2'],
    ['007', '7'],
    ['3/8', '3/8'],
    ['-3/8', '-3/8'],
    ['2/4', '1/2'],
    ['10/5', '2'],
    ['  12  ', '12'],
  ])('%s → %s', (input, frac) => {
    expect(Rational.parse(input)?.toFractionString()).toBe(frac);
  });

  it.each(['', '-', '.', '-.', '1/0', '1/', '/2', '1.5/2', '1,200', 'abc', '1e3', '--1', '1-', '3/-4', '+3'])(
    'rejects %j',
    (input) => {
      expect(Rational.parse(input)).toBeNull();
    },
  );
});

describe('Rational arithmetic', () => {
  it('is exact where floats are not', () => {
    expect(R('0.1').add(R('0.2')).equals(R('0.3'))).toBe(true);
  });

  it('adds, subtracts, multiplies and divides', () => {
    expect(R(1, 3).add(R(1, 6)).toFractionString()).toBe('1/2');
    expect(R(1, 3).sub(R(1, 2)).toFractionString()).toBe('-1/6');
    expect(R(7, 12).mul(R(156)).toString()).toBe('91');
    expect(R(3, 4).div(R(3, 8)).toString()).toBe('2');
    expect(() => R(1).div(R(0))).toThrow();
    expect(R(5, 2).neg().toString()).toBe('-2.5');
  });

  it('raises to integer powers', () => {
    expect(R(2).pow(10).toString()).toBe('1024');
    expect(R(2, 3).pow(2).toFractionString()).toBe('4/9');
    expect(R(10).pow(-2).toString()).toBe('0.01');
    expect(R(5).pow(0).toString()).toBe('1');
    expect(() => R(2).pow(0.5)).toThrow();
  });

  it('compares', () => {
    expect(R(1, 3).cmp(R(1, 2))).toBe(-1);
    expect(R(2, 4).cmp(R(1, 2))).toBe(0);
    expect(R(-1, 2).cmp(R(-2, 3))).toBe(1);
  });
});

describe('Rational decimals', () => {
  it.each([
    [R(3, 8), '0.375', 3],
    [R(-5, 2), '-2.5', 1],
    [R(1200), '1200', 0],
    [R(1, 40), '0.025', 3],
    [R(-1, 100), '-0.01', 2],
  ])('%s has decimal string %s with %i places', (r, s, places) => {
    expect(r.toDecimalString()).toBe(s);
    expect(r.decimalPlaces()).toBe(places);
    expect(r.isTerminating()).toBe(true);
  });

  it('knows repeating decimals', () => {
    expect(R(1, 3).isTerminating()).toBe(false);
    expect(R(1, 3).toDecimalString()).toBeNull();
    expect(R(1, 3).decimalPlaces()).toBeNull();
    expect(R(1, 3).toString()).toBe('1/3');
    expect(R(7, 12).toString()).toBe('7/12');
  });

  it('canonical toString prefers the exact decimal', () => {
    expect(R(5, 2).toString()).toBe('2.5');
    expect(R(45).toString()).toBe('45');
  });

  it.each([
    [R(1200), 2],
    [R(45), 2],
    [R(0), 1],
    [R('0.375'), 3],
    [R('17.5'), 3],
    [R('-0.025'), 2],
    [R('1234.5'), 5],
  ])('%s has %i significant digits', (r, n) => {
    expect(r.significantDigits()).toBe(n);
  });

  it('has no significant-digit count for repeating decimals', () => {
    expect(R(2, 3).significantDigits()).toBeNull();
  });
});

describe('Rational.round', () => {
  it.each([
    ['3.45', 'tenth', '3.5'],
    ['3.44', 'tenth', '3.4'],
    ['-3.45', 'tenth', '-3.5'],
    ['2.5', 'whole', '3'],
    ['-2.5', 'whole', '-3'],
    ['2.49', 'whole', '2'],
    ['1.005', 'hundredth', '1.01'],
    ['7', 'tenth', '7'],
  ] as const)('%s to the nearest %s is %s', (input, place, out) => {
    expect(R(input).round(place).toString()).toBe(out);
  });

  it('rounds repeating decimals exactly', () => {
    expect(R(2, 3).round('tenth').toString()).toBe('0.7');
    expect(R(1, 3).round('hundredth').toString()).toBe('0.33');
    expect(R(200, 3).round('whole').toString()).toBe('67');
  });
});
