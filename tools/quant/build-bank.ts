// Expands the templates into content/questions.json.
// For each topic × difficulty, every template that supports it gets an equal share of the
// quota; seeds 1, 2, 3… are drawn until the share is met. Near-duplicates are dropped.
import type { Question } from '../../src/content/schema';
import { finalize } from '../../src/engine/generators/finalize';
import { TEMPLATES } from '../../src/engine/generators/index';
import { DIFFICULTIES, TOPICS } from '../../src/engine/generators/types';
import { DIFF_LETTER, QUOTA, writeBank } from './bank-io';

const MAX_SEED = 20_000;

/** Same template, same numbers in any order (prompt and choices) = near-duplicate. */
function nearKey(templateId: string, d: number, q: { prompt: string; choices?: string[] }): string {
  const nums = (q.prompt.replace(/,/g, '').match(/\d+(?:\.\d+)?/g) ?? []).sort();
  const choices = [...(q.choices ?? [])].sort();
  return `${templateId}|${d}|${nums.join(' ')}|${choices.join(' ')}`;
}

/** Exact identity: prompt text plus its option set (some prompts, like "Which is greatest?", repeat). */
function identity(q: { prompt: string; choices?: string[] }): string {
  return `${q.prompt}|${[...(q.choices ?? [])].sort().join(' ')}`;
}

const bank: Question[] = [];
const prompts = new Set<string>();
const nearKeys = new Set<string>();
const shortfalls: string[] = [];

for (const topic of TOPICS) {
  for (const d of DIFFICULTIES) {
    const templates = TEMPLATES.filter((t) => t.topic === topic && t.difficulties.includes(d));
    const quota = QUOTA[topic];
    templates.forEach((template, i) => {
      const share = Math.floor(quota / templates.length) + (i < quota % templates.length ? 1 : 0);
      let made = 0;
      for (let seed = 1; seed <= MAX_SEED && made < share; seed++) {
        const res = finalize(template, d, seed);
        if (!res.ok) continue;
        const q = res.question;
        const key = nearKey(template.id, d, q);
        const ident = identity(q);
        if (prompts.has(ident) || nearKeys.has(key)) continue;
        prompts.add(ident);
        nearKeys.add(key);
        made++;
        bank.push({
          id: `${template.id}-${DIFF_LETTER[d]}-${String(made).padStart(4, '0')}`,
          ...q,
          source: { type: 'template', templateId: template.id, seed },
        });
      }
      if (made < share) shortfalls.push(`${template.id} d${d}: ${made}/${share}`);
    });
  }
}

bank.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
writeBank(bank);

console.log(`Wrote ${bank.length} questions to content/questions.json`);
if (shortfalls.length) console.log(`Short of share (unique draws ran out):\n  ${shortfalls.join('\n  ')}`);
