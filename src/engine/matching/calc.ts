// Works out a hand-written problem's arithmetic exactly, from an expression such as
// "(240 - 180) / 240 * 100". Digits, + - * / ^, brackets and a leading minus; no variables.
import { R, Rational } from './rational';

export class CalcError extends Error {}

export function evaluate(expression: string): Rational {
  // "2 3" is a slip, not 23.
  if (/[\d.]\s+[\d.]/.test(expression)) throw new CalcError(`Missing operator in "${expression}"`);
  const text = expression.replace(/\s+/g, '');
  let at = 0;
  const peek = () => text[at];

  function number(): Rational {
    const match = /^(\d+(\.\d+)?|\.\d+)/.exec(text.slice(at));
    if (!match) throw new CalcError(`Expected a number at position ${at} in "${expression}"`);
    at += match[0].length;
    return R(match[0]);
  }

  function atom(): Rational {
    if (peek() === '-') {
      at++;
      return atom().neg();
    }
    if (peek() === '(') {
      at++;
      const inner = sum();
      if (peek() !== ')') throw new CalcError(`Missing ")" in "${expression}"`);
      at++;
      return inner;
    }
    return number();
  }

  /** Right-associative, and binds tighter than a leading minus: -2^2 = -4. */
  function power(): Rational {
    if (peek() === '-') {
      at++;
      return power().neg();
    }
    const base = atom();
    if (peek() !== '^') return base;
    at++;
    const exponent = power();
    if (!exponent.isInteger()) throw new CalcError(`Only whole-number powers are allowed in "${expression}"`);
    return base.pow(Number(exponent.n));
  }

  function product(): Rational {
    let value = power();
    while (peek() === '*' || peek() === '/') {
      const op = text[at++];
      const right = power();
      if (op === '/' && right.n === 0n) throw new CalcError(`Division by zero in "${expression}"`);
      value = op === '*' ? value.mul(right) : value.div(right);
    }
    return value;
  }

  function sum(): Rational {
    let value = product();
    while (peek() === '+' || peek() === '-') {
      const op = text[at++];
      const right = product();
      value = op === '+' ? value.add(right) : value.sub(right);
    }
    return value;
  }

  if (!text) throw new CalcError('Empty expression');
  const result = sum();
  if (at !== text.length) throw new CalcError(`Unexpected "${text[at]}" in "${expression}"`);
  return result;
}

/** The numbers an expression uses, as written. */
export function literals(expression: string): string[] {
  return expression.match(/\d+(?:\.\d+)?|\.\d+/g) ?? [];
}
