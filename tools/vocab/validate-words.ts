// Gate for content/words.json. Runs in CI before every deploy; exits 1 on any problem.
// Checks are in check-words.ts (TRD, vocab checks); this file only reads and reports.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { WordListSchema } from '../../src/content/schema';
import { checkWords, type RankedRef } from './check-words';

const WORDS = resolve(import.meta.dirname, '../../content/words.json');
const RANKED = resolve(import.meta.dirname, '../../content/ranked-words.json');

const parsed = WordListSchema.safeParse(JSON.parse(readFileSync(WORDS, 'utf8')));
if (!parsed.success) {
  console.error('words.json failed schema validation:');
  console.error(parsed.error.issues.slice(0, 20).map((i) => `  [${i.path.join('.')}] ${i.message}`).join('\n'));
  process.exit(1);
}

const ranked = JSON.parse(readFileSync(RANKED, 'utf8')) as RankedRef[];
const errors = checkWords(parsed.data, ranked);
if (errors.length) {
  console.error(`words.json: ${errors.length} problem(s)`);
  console.error(errors.slice(0, 50).map((e) => `  ${e}`).join('\n'));
  process.exit(1);
}
console.log(`words.json OK: ${parsed.data.length} of ${ranked.length} words written`);
