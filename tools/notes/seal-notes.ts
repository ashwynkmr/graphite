// Seals the private notes for the app. Reads the git-ignored private/sets/ folder, one folder per
// person: notes.txt (one note per line), names.txt (the names that open them) and from.txt (who
// they're from). Writes src/content/notes.sealed.json, which is safe to commit. Run: npm run content:seal-notes
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { sealNotes } from '../../src/content/sealed-notes';

const root = resolve(import.meta.dirname, '../..');
const sets = resolve(root, 'private/sets');
const lines = (dir: string, file: string) => readFileSync(resolve(sets, dir, file), 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);

const folders = readdirSync(sets, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
const normalized = (name: string) => name.normalize('NFKC').trim().toLocaleLowerCase('en');
const taken = new Set<string>();
const sealed = [];
for (const dir of folders) {
  const notes = lines(dir, 'notes.txt');
  const names = lines(dir, 'names.txt');
  const [from] = lines(dir, 'from.txt');
  if (!from) throw new Error(`${dir}: from.txt is empty`);
  if (new Set(notes).size !== notes.length) throw new Error(`${dir}: two notes are the same`);
  for (const name of names) {
    // A name opens one set, so two sets can't share one.
    if (taken.has(normalized(name))) throw new Error(`${dir}: a name already opens another set`);
    taken.add(normalized(name));
  }
  sealed.push(await sealNotes({ from, notes }, names));
  console.log(`Sealed ${notes.length} notes for ${names.length} names.`);
}
writeFileSync(resolve(root, 'src/content/notes.sealed.json'), `${JSON.stringify(sealed)}\n`);
