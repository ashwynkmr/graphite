// Merge the public word lists into the ranked deck: content/ranked-words.json (top 1,500 with tiers).
// Usage: npm run content:rank-words [-- --top 100]  (prints the top N for review)
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseAliases, rankWords, type ListWeight, type SourceList } from './rank';

const DIR = resolve(import.meta.dirname, '../../content/sources/wordlists');
const OUT = resolve(import.meta.dirname, '../../content/ranked-words.json');
const DECK_SIZE = 1500;

const manifest = JSON.parse(readFileSync(`${DIR}/sources.json`, 'utf8')) as { lists: { id: string; weight: ListWeight }[] };
const lists: SourceList[] = manifest.lists.map((l) => ({
  id: l.id,
  weight: l.weight,
  words: readFileSync(`${DIR}/${l.id}.txt`, 'utf8').split('\n').filter((w) => w.trim()),
}));
const aliases = parseAliases(readFileSync(`${DIR}/aliases.txt`, 'utf8'));

const { ranked, rejected, candidates } = rankWords(lists, aliases, DECK_SIZE);
if (ranked.length < DECK_SIZE) throw new Error(`Only ${ranked.length} words; need ${DECK_SIZE}.`);

// One word per line: compact, and diffs stay readable.
writeFileSync(OUT, `[\n${ranked.map((r) => JSON.stringify(r)).join(',\n')}\n]\n`);

const byCore = new Map<number, number>();
for (const r of ranked) byCore.set(r.core, (byCore.get(r.core) ?? 0) + 1);
console.log(`ranked-words.json: ${ranked.length} of ${candidates} candidates from ${lists.length} lists`);
console.log(`core lists per word: ${[...byCore].sort((a, b) => b[0] - a[0]).map(([c, n]) => `${c}: ${n}`).join(' · ')}`);
console.log(`cut-off score: ${ranked[ranked.length - 1]?.score}`);
if (rejected.length) console.log(`unread entries (add to aliases.txt): ${rejected.map((r) => `${r.entry} [${r.list}]`).join(', ')}`);

const topArg = process.argv.indexOf('--top');
if (topArg > 0) {
  const n = Number(process.argv[topArg + 1] ?? 100);
  console.log(ranked.slice(0, n).map((r) => `${r.rank}\t${r.word}\t${r.score}`).join('\n'));
}
