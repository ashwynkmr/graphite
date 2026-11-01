import { describe, expect, it } from 'vitest';
import { R } from '../matching/rational';
import { an, mixed, money, num } from './format';

describe('format', () => {
  it('groups thousands and uses a true minus', () => {
    expect(num(R(12000))).toBe('12,000');
    expect(num(R('-2.5'))).toBe('−2.5');
    expect(num(R(1, 3))).toBe('1/3');
  });

  it('writes money with cents', () => {
    expect(money(R('12.5'))).toBe('$12.50');
    expect(money(R(1200))).toBe('$1,200');
  });

  it('writes mixed numbers', () => {
    expect(mixed(R(11, 4))).toBe('2 3/4');
    expect(mixed(R(-7, 2))).toBe('−3 1/2');
  });

  it.each([
    ['8%', 'an'],
    ['18%', 'an'],
    ['18.75%', 'an'],
    ['11', 'an'],
    ['80', 'an'],
    ['110', 'a'],
    ['15%', 'a'],
    ['1,800', 'a'],
    ['apple', 'an'],
    ['box', 'a'],
  ])('%s takes "%s"', (word, article) => {
    expect(an(word)).toBe(article);
  });
});
