// Finds the fractions and powers in a question's text, so they can be drawn properly. The text in
// the question bank stays as it is: this only changes how it looks on screen.

export type MathToken =
  | { kind: 'text'; text: string }
  | { kind: 'fraction'; whole?: string; top: string; bottom: string }
  | { kind: 'power'; text: string };

// A fraction, with its whole number if it has one: whole numbers only, so 12.5/100, $12/kg and km/h
// stay as written. Then a power: ^(−3/2), ^(x + 1), ^2, ^x.
const MATH = /(?<![\d.,/])(?:(\d+) )?(\d+)\/(\d+)(?![\d/]|\.\d)|\^\(([^()]+)\)|\^([−-]?[a-z0-9]+)/g;

export function tokenizeMath(text: string): MathToken[] {
  const tokens: MathToken[] = [];
  let at = 0;
  for (const m of text.matchAll(MATH)) {
    if (m.index > at) tokens.push({ kind: 'text', text: text.slice(at, m.index) });
    if (m[3] !== undefined) tokens.push({ kind: 'fraction', whole: m[1], top: m[2]!, bottom: m[3] });
    else tokens.push({ kind: 'power', text: m[4] ?? m[5]! });
    at = m.index + m[0].length;
  }
  if (at < text.length) tokens.push({ kind: 'text', text: text.slice(at) });
  return tokens;
}

/** How a fraction is read aloud. */
export function fractionLabel(f: { whole?: string; top: string; bottom: string }): string {
  return `${f.whole ? `${f.whole} and ` : ''}${f.top} over ${f.bottom}`;
}
