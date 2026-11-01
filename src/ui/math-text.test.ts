import { describe, expect, it } from 'vitest';
import bank from '../../content/questions.json';
import { fractionLabel, tokenizeMath, type MathToken } from './math-text';

/** The original text, rebuilt from the tokens: nothing is lost or changed. */
function plain(tokens: MathToken[]): string {
  return tokens.map((t) => (t.kind === 'text' ? t.text : t.kind === 'fraction' ? `${t.whole ? `${t.whole} ` : ''}${t.top}/${t.bottom}` : `^${t.text}`)).join('');
}

describe('tokenizeMath', () => {
  it('finds a mixed number as one number', () => {
    expect(tokenizeMath('4 1/5 ÷ 1 1/4 = ?')).toEqual([
      { kind: 'fraction', whole: '4', top: '1', bottom: '5' },
      { kind: 'text', text: ' ÷ ' },
      { kind: 'fraction', whole: '1', top: '1', bottom: '4' },
      { kind: 'text', text: ' = ?' },
    ]);
  });

  it('finds a plain fraction inside a sentence', () => {
    expect(tokenizeMath('A 3/4-full tank')).toEqual([{ kind: 'text', text: 'A ' }, { kind: 'fraction', whole: undefined, top: '3', bottom: '4' }, { kind: 'text', text: '-full tank' }]);
  });

  it('raises every form of power', () => {
    const powers = (s: string) => tokenizeMath(s).filter((t) => t.kind === 'power').map((t) => (t as { text: string }).text);
    expect(powers('16^(−3/2) = ?')).toEqual(['−3/2']);
    expect(powers('2^(x + 1) + 2^x = 48')).toEqual(['x + 1', 'x']);
    expect(powers('What is 2^y?')).toEqual(['y']);
    expect(powers('10^3')).toEqual(['3']);
  });

  it('handles a bracketed fraction with a power', () => {
    expect(tokenizeMath('(1/16)^(−3/2)')).toEqual([
      { kind: 'text', text: '(' },
      { kind: 'fraction', whole: undefined, top: '1', bottom: '16' },
      { kind: 'text', text: ')' },
      { kind: 'power', text: '−3/2' },
    ]);
  });

  it.each(['12.5/100 = 1/8'])('leaves decimals over a number alone: %s', (s) => {
    expect(tokenizeMath(s)[0]).toEqual({ kind: 'text', text: '12.5/100 = ' });
  });

  it.each(['$12/kg', '60 km/h', 'a/c and c/a', '3 m/s', '9:40', '1,272'])('leaves %s as plain text', (s) => {
    expect(tokenizeMath(s)).toEqual([{ kind: 'text', text: s }]);
  });

  it('reads a fraction aloud', () => {
    expect(fractionLabel({ whole: '1', top: '1', bottom: '4' })).toBe('1 and 1 over 4');
    expect(fractionLabel({ top: '3', bottom: '8' })).toBe('3 over 8');
  });
});

describe('every question in the bank', () => {
  const texts = (bank as { prompt: string; explain: string; answer: string; choices?: string[] }[]).flatMap((q) => [q.prompt, q.explain, q.answer, ...(q.choices ?? [])]);

  it('keeps its exact text', () => {
    // A raised power no longer needs its brackets; everything else matches exactly.
    for (const text of texts) expect(plain(tokenizeMath(text))).toBe(text.replace(/\^\(([^()]+)\)/g, '^$1'));
  });

  it('leaves no raw power symbol behind', () => {
    for (const text of texts) {
      const rest = tokenizeMath(text).filter((t) => t.kind === 'text').map((t) => (t as { text: string }).text).join('|');
      expect(rest, text).not.toContain('^');
    }
  });

  it('shows all 29 prompts with mixed numbers as mixed numbers', () => {
    const prompts = (bank as { prompt: string }[]).map((q) => q.prompt);
    const mixed = prompts.filter((p) => tokenizeMath(p).some((t) => t.kind === 'fraction' && t.whole));
    expect(mixed).toHaveLength(29);
  });

  it('never treats a number from elsewhere in a sentence as a whole number', () => {
    const wholes = (bank as { prompt: string }[]).flatMap((q) => tokenizeMath(q.prompt).filter((t) => t.kind === 'fraction' && t.whole).map(() => q.prompt));
    for (const prompt of wholes) expect(prompt).not.toMatch(/[a-z]{3,} \d+ \d+\/\d+ [a-z]+ \d/);
  });
});
