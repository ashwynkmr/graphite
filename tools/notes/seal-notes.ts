// Seals the private notes for the app. Reads the git-ignored private/ folder (one note or name per
// line) and writes src/content/notes.sealed.json, which is safe to commit. Run: npm run content:seal-notes
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { sealNotes } from '../../src/content/sealed-notes';

const root = resolve(import.meta.dirname, '../..');
const lines = (file: string) => readFileSync(resolve(root, 'private', file), 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);

const notes = lines('notes.txt');
const names = lines('names.txt');
if (new Set(notes).size !== notes.length) throw new Error('Two notes are the same');
writeFileSync(resolve(root, 'src/content/notes.sealed.json'), `${JSON.stringify(await sealNotes(notes, names))}\n`);
console.log(`Sealed ${notes.length} notes for ${names.length} names.`);
