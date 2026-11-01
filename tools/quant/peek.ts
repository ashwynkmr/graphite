// Print sample questions for templates whose id starts with a prefix, plus acceptance rates.
// Usage: npx vite-node tools/quant/peek.ts -- pct- [samplesPerDifficulty]
import { finalize } from '../../src/engine/generators/finalize';
import { TEMPLATES } from '../../src/engine/generators/index';

const args = process.argv.slice(2).filter((a) => a !== '--');
const prefix = args[0] ?? '';
const n = Number(args[1] ?? 2);

for (const t of TEMPLATES.filter((x) => x.id.startsWith(prefix))) {
  for (const d of t.difficulties) {
    let ok = 0;
    const reasons: Record<string, number> = {};
    const shown: string[] = [];
    for (let seed = 1; seed <= 200; seed++) {
      const r = finalize(t, d, seed);
      if (r.ok) {
        ok++;
        if (shown.length < n) {
          const q = r.question;
          const unit = `${q.unit?.prefix ?? ''}…${q.unit?.suffix ? ' ' + q.unit.suffix : ''}`;
          shown.push(
            `    ${q.prompt}\n      = ${q.answer}${q.rounding ? ` (${q.rounding})` : ''}  [${unit}]  ${q.choices ? q.choices.join(' | ') : '(typed only)'}\n      ${q.explain}`,
          );
        }
      } else reasons[r.reason] = (reasons[r.reason] ?? 0) + 1;
    }
    console.log(`${t.id} d${d}: ${ok}/200 ${JSON.stringify(reasons)}`);
    console.log(shown.join('\n'));
  }
}
