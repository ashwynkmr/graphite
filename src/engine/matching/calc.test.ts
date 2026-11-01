import { describe, expect, it } from 'vitest';
import { R } from './rational';
import { CalcError, evaluate, literals } from './calc';

const is = (expr: string, value: string) => expect(evaluate(expr).equals(R(value)), `${expr} = ${value}`).toBe(true);

describe('evaluate', () => {
  it.each([
    ['2 + 3 * 4', '14'],
    ['(2 + 3) * 4', '20'],
    ['10 - 4 - 3', '3'],
    ['24 / 4 / 2', '3'],
    ['2 ^ 3 ^ 2', '512'],
    ['-2 ^ 2', '-4'],
    ['(-2) ^ 2', '4'],
    ['2 ^ -2', '0.25'],
    ['3 - -2', '5'],
    ['.5 + 1.25', '1.75'],
    ['240 * 17.5 / 100', '42'],
    ['(240 - 180) / 240 * 100', '25'],
  ])('%s = %s', is);

  it('stays exact where floating point would not', () => {
    is('0.1 + 0.2', '0.3');
    expect(evaluate('1 / 3 * 3').equals(R(1))).toBe(true);
    expect(evaluate('1 / 3').toFractionString()).toBe('1/3');
  });

  it.each(['', '2 +', '(2 + 3', '2 + 3)', '2 $ 3', 'abc', '1 / 0', '1 / (2 - 2)', '2 ^ 0.5', '2 3'])('rejects %j', (bad) => {
    expect(() => evaluate(bad)).toThrow(CalcError);
  });
});

describe('literals', () => {
  it('lists the numbers used', () => {
    expect(literals('(240 - 18.5) * .5 ^ 2')).toEqual(['240', '18.5', '.5', '2']);
  });
});
