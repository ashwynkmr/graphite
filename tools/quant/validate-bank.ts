// Gate for content/questions.json. Runs in CI before every deploy; exits 1 on any problem.
//  - schema valid, ids unique
//  - at least MIN_PER_PAIR questions per topic × difficulty
//  - every template question rebuilds identically from its stored seed
//  - every MCQ has 5 distinct choices, exactly one equal to the answer after rounding
//  - at least 70% of questions carry choices (so Mix mode has enough MCQs)
import { QuestionBankSchema, type Question } from '../../src/content/schema';
import { finalize } from '../../src/engine/generators/finalize';
import { TEMPLATE_BY_ID } from '../../src/engine/generators/index';
import { DIFFICULTIES, TOPICS } from '../../src/engine/generators/types';
import { Rational } from '../../src/engine/matching/rational';
import { MIN_PER_PAIR, readBank } from './bank-io';

const errors: string[] = [];

/** JSON with sorted keys, so key order (which Zod rewrites) never matters. */
function stable(x: unknown): string {
  return JSON.stringify(x, (_k, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : 1)))
      : v,
  );
}
const fail = (id: string, msg: string) => errors.push(`${id}: ${msg}`);

const parsed = QuestionBankSchema.safeParse(readBank());
if (!parsed.success) {
  console.error('questions.json failed schema validation:');
  console.error(parsed.error.issues.slice(0, 20).map((i) => `  [${i.path.join('.')}] ${i.message}`).join('\n'));
  process.exit(1);
}
const bank: Question[] = parsed.data;

// Unique ids
const seen = new Set<string>();
for (const q of bank) {
  if (seen.has(q.id)) fail(q.id, 'duplicate id');
  seen.add(q.id);
}

// Quotas
for (const topic of TOPICS) {
  for (const d of DIFFICULTIES) {
    const n = bank.filter((q) => q.topic === topic && q.difficulty === d).length;
    if (n < MIN_PER_PAIR) fail(`${topic}/d${d}`, `only ${n} questions (need ${MIN_PER_PAIR})`);
  }
}

for (const q of bank) {
  const answer = Rational.parse(q.answer);
  if (!answer) {
    fail(q.id, `answer "${q.answer}" does not parse`);
    continue;
  }
  const canonical = q.format === 'fraction' ? answer.toFractionString() : answer.toDecimalString();
  if (canonical !== q.answer) fail(q.id, `answer "${q.answer}" is not canonical (${canonical})`);
  if (q.rounding && !answer.equals(answer.round(q.rounding))) fail(q.id, 'stored answer is not rounded');

  // Rebuild from seed
  if (q.source.type === 'template') {
    const template = TEMPLATE_BY_ID.get(q.source.templateId);
    if (!template) {
      fail(q.id, `unknown template ${q.source.templateId}`);
    } else if (template.topic !== q.topic) {
      fail(q.id, 'topic does not match template');
    } else {
      const res = finalize(template, q.difficulty, q.source.seed);
      if (!res.ok) fail(q.id, `template now rejects seed ${q.source.seed} (${res.reason})`);
      else {
        const { id: _id, source: _source, ...stored } = q;
        if (stable(res.question) !== stable(stored)) {
          fail(q.id, 'rebuilding from the stored seed gives a different question (template changed?)');
        }
      }
    }
  } else {
    fail(q.id, 'hand-written questions are not supported yet (step 10)');
  }

  // Choices
  if (q.mcqOnly && !q.choices) fail(q.id, 'mcqOnly without choices');
  if (q.choices) {
    if (new Set(q.choices).size !== 5) fail(q.id, 'choices are not 5 distinct values');
    const values = q.choices.map((c) => Rational.parse(c));
    if (values.some((v) => !v)) fail(q.id, 'a choice does not parse');
    else {
      const hits = values.filter((v) => (q.rounding ? v!.round(q.rounding) : v!).equals(answer)).length;
      if (hits !== 1) fail(q.id, `${hits} choices equal the answer (need exactly 1)`);
    }
  }
}

const withChoices = bank.filter((q) => q.choices).length / bank.length;
if (withChoices < 0.7) fail('bank', `only ${(withChoices * 100).toFixed(1)}% of questions have choices (need 70%)`);

if (errors.length) {
  console.error(`questions.json: ${errors.length} problem(s)`);
  console.error(errors.slice(0, 50).map((e) => `  ${e}`).join('\n'));
  process.exit(1);
}
console.log(`questions.json OK: ${bank.length} questions, ${(withChoices * 100).toFixed(0)}% with choices`);
