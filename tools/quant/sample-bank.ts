// Counts per topic × difficulty and a random sample for spot-checking.
// Usage: npm run content:sample -- [count] [seed]
import { QuestionBankSchema } from '../../src/content/schema';
import { mulberry32 } from '../../src/engine/rng';
import { DIFFICULTIES, TOPICS } from '../../src/engine/generators/types';
import { readBank } from './bank-io';

const args = process.argv.slice(2).filter((a) => a !== '--');
const count = Number(args[0] ?? 30);
const seed = Number(args[1] ?? 20261101);
const bank = QuestionBankSchema.parse(readBank());

const pad = (s: string | number, n: number) => String(s).padStart(n);
console.log(`| Topic        |  Easy | Medium |  Hard | Total |  MCQ % |`);
console.log(`| ------------ | ----: | -----: | ----: | ----: | -----: |`);
for (const topic of TOPICS) {
  const rows = DIFFICULTIES.map((d) => bank.filter((q) => q.topic === topic && q.difficulty === d).length);
  const all = bank.filter((q) => q.topic === topic);
  const mcq = Math.round((all.filter((q) => q.choices).length / all.length) * 100);
  console.log(`| ${topic.padEnd(12)} | ${pad(rows[0]!, 5)} | ${pad(rows[1]!, 6)} | ${pad(rows[2]!, 5)} | ${pad(all.length, 5)} | ${pad(mcq, 5)}% |`);
}
const tot = DIFFICULTIES.map((d) => bank.filter((q) => q.difficulty === d).length);
console.log(`| **Total**    | ${pad(tot[0]!, 5)} | ${pad(tot[1]!, 6)} | ${pad(tot[2]!, 5)} | ${pad(bank.length, 5)} | ${pad(Math.round((bank.filter((q) => q.choices).length / bank.length) * 100), 5)}% |`);
console.log('');

const rng = mulberry32(seed);
const sample = rng.shuffle(bank).slice(0, count);
sample.forEach((q, i) => {
  const unit = q.unit ? ` [${q.unit.prefix ?? ''}…${q.unit.suffix ? ' ' + q.unit.suffix : ''}]` : '';
  console.log(`${i + 1}. ${q.id} · ${q.topic} · d${q.difficulty}${q.mcqOnly ? ' · MCQ only' : ''}`);
  console.log(`   Q: ${q.prompt}${unit}`);
  console.log(`   A: ${q.answer}${q.rounding ? ` (nearest ${q.rounding})` : ''}`);
  console.log(`   Choices: ${q.choices ? q.choices.join(' | ') : '— typed only'}`);
  console.log(`   Why: ${q.explain}`);
});
