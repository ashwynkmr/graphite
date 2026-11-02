// Gate for content/words.json and content/equiv-sentences.json. Runs in CI before every deploy; exits 1 on any problem.
// Checks are in check-words.ts and check-equiv.ts (TRD, vocab checks); this file only reads and reports.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { EquivSentenceListSchema, WordListSchema } from '../../src/content/schema';
import { checkEquivSentences } from './check-equiv';
import { checkWords, type RankedRef } from './check-words';

const WORDS = resolve(import.meta.dirname, '../../content/words.json');
const RANKED = resolve(import.meta.dirname, '../../content/ranked-words.json');
const EQUIV = resolve(import.meta.dirname, '../../content/equiv-sentences.json');

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

const equiv = EquivSentenceListSchema.safeParse(JSON.parse(readFileSync(EQUIV, 'utf8')));
if (!equiv.success) {
  console.error('equiv-sentences.json failed schema validation:');
  console.error(equiv.error.issues.slice(0, 20).map((i) => `  [${i.path.join('.')}] ${i.message}`).join('\n'));
  process.exit(1);
}

const equivErrors = checkEquivSentences(equiv.data, parsed.data);
if (equivErrors.length) {
  console.error(`equiv-sentences.json: ${equivErrors.length} problem(s)`);
  console.error(equivErrors.slice(0, 80).map((e) => `  ${e}`).join('\n'));
  process.exit(1);
}
console.log(`equiv-sentences.json OK: ${equiv.data.length} sentences`);
