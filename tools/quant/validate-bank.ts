// Gate for content/questions.json. Runs in CI before every deploy; exits 1 on any problem.
//  - schema valid, ids unique
//  - at least MIN_PER_PAIR questions per topic × difficulty
//  - every template question rebuilds identically from its stored seed
//  - every MCQ has 5 distinct choices, exactly one equal to the answer after rounding
//  - at least 70% of questions carry choices (so Mix mode has enough MCQs)
import { QuestionBankSchema, type Question } from '../../src/content/schema';
import { finalize } from '../../src/engine/generators/finalize';
import { buildHandwritten, problemIssues } from '../../src/engine/generators/handwritten';
import { TEMPLATE_BY_ID } from '../../src/engine/generators/index';
import { DIFFICULTIES, TOPICS } from '../../src/engine/generators/types';
import { Rational } from '../../src/engine/matching/rational';
import { DIFF_LETTER, MIN_PER_PAIR, readBank, readHandwritten } from './bank-io';

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

const handwritten = readHandwritten();
const handwrittenById = new Map(handwritten.map((p) => [p.id, p]));
const bankIds = new Set((readBank() as { id: string }[]).map((q) => q.id));
if (handwrittenById.size !== handwritten.length) fail('handwritten', 'duplicate ids');
const promptsSeen = new Set<string>();
for (const p of handwritten) {
  if (!bankIds.has(p.id)) fail(p.id, 'in handwritten.json but not in the bank (rebuild it, or it was rejected)');
  if (promptsSeen.has(p.prompt)) fail(p.id, 'duplicate prompt');
  promptsSeen.add(p.prompt);
  if (!p.id.startsWith(`hw-${p.topic}-${DIFF_LETTER[p.difficulty]}-`)) fail(p.id, 'id does not match topic and difficulty');
  for (const issue of problemIssues(p)) fail(p.id, issue);
  const res = buildHandwritten(p);
  if (res.ok && !res.question.choices) fail(p.id, 'has no multiple-choice options');
}

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
    const problem = handwrittenById.get(q.id);
    if (!problem) {
      fail(q.id, 'no matching entry in handwritten.json');
    } else {
      const res = buildHandwritten(problem);
      if (!res.ok) fail(q.id, `problem no longer builds (${res.reason})`);
      else {
        const { id: _id, source: _source, ...stored } = q;
        if (stable(res.question) !== stable(stored) || q.source.calc !== problem.calc) fail(q.id, 'differs from handwritten.json (rebuild the bank)');
      }
    }
  }

  // Choices
  if (q.mcqOnly && !q.choices) fail(q.id, 'mcqOnly without choices');
  if (q.choices) {
    const wanted = q.format === 'compare' ? 4 : 5;
    if (new Set(q.choices).size !== wanted) fail(q.id, `choices are not ${wanted} distinct values`);
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
