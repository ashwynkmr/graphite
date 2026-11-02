import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadWords, type WordBook } from '../../content/words';
import { loadWordStates, setStarred } from '../../data/repo/vocab';
import { newSchedule, type WordSchedule } from '../../engine/scheduling/leitner';
import { BOX_GROUPS, boxGroup, browseWords, type BoxGroup } from '../../engine/sessions/word-browse';
import type { Word } from '../../content/schema';
import { Button, Chip, Segmented } from '../../ui/controls';
import { ReportProblem } from '../../ui/ReportProblem';
import { Screen } from '../../ui/Screen';
import { POS_SHORT, sentence } from './display';
import styles from './BrowseScreen.module.css';

const PAGE = 40;

const GROUP_LABEL: Record<BoxGroup, string> = { new: 'New', learning: 'Learning', known: 'Known', retired: 'Retired' };

type TierChoice = 'all' | Word['tier'];

/** Every word, searchable. Nothing here counts as study: looking a word up leaves its box alone. */
export function BrowseScreen() {
  const [book, setBook] = useState<WordBook | null>(null);
  const [states, setStates] = useState<Map<string, WordSchedule>>(new Map());
  const [query, setQuery] = useState('');
  const [tier, setTier] = useState<TierChoice>('all');
  const [group, setGroup] = useState<BoxGroup | null>(null);
  const [starredOnly, setStarredOnly] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    void Promise.all([loadWords(), loadWordStates()]).then(([b, s]) => {
      setBook(b);
      setStates(s);
    });
  }, []);

  useEffect(() => setShown(PAGE), [query, tier, group, starredOnly]);

  const found = useMemo(
    () => (book ? browseWords(book.words, states, { query, tier: tier === 'all' ? null : tier, group, starredOnly }) : []),
    [book, states, query, tier, group, starredOnly],
  );

  const toggleStar = async (id: string) => {
    const current = states.get(id) ?? newSchedule(id);
    await setStarred(id, !current.starred);
    setStates(new Map(states).set(id, { ...current, starred: !current.starred }));
  };

  return (
    <Screen
      title="All words"
      eyebrow="GRE words"
      action={
        <Link to="/vocab" className={styles.back}>
          Back
        </Link>
      }
    >
      <input className={styles.search} type="search" placeholder="Search a word or meaning" aria-label="Search a word or meaning" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} />

      <Segmented<TierChoice>
        label="Frequency"
        value={tier}
        onChange={setTier}
        options={[
          { value: 'all', label: 'All' },
          { value: 1, label: 'Top 500' },
          { value: 2, label: 'Next 500' },
          { value: 3, label: 'Last 500' },
        ]}
      />

      <div className={styles.chips}>
        {BOX_GROUPS.map((g) => (
          <Chip key={g} selected={group === g} onClick={() => setGroup(group === g ? null : g)}>
            {GROUP_LABEL[g]}
          </Chip>
        ))}
        <Chip selected={starredOnly} onClick={() => setStarredOnly(!starredOnly)}>
          Starred
        </Chip>
      </div>

      <p className={`${styles.count} tabular`} aria-live="polite">
        {book ? `${found.length.toLocaleString('en-US')} ${found.length === 1 ? 'word' : 'words'}` : 'Opening the word list…'}
      </p>

      <ul className={styles.list}>
        {found.slice(0, shown).map((w) => {
          const state = states.get(w.id);
          const isOpen = open === w.id;
          return (
            <li key={w.id} className={styles.item}>
              <button type="button" className={styles.row} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : w.id)}>
                <span className={styles.word}>
                  {w.word} <span className={styles.pos}>{POS_SHORT[w.pos]}</span>
                </span>
                {!isOpen && <span className={styles.short}>{w.meaning}</span>}
              </button>
              {isOpen && (
                <div className={styles.detail}>
                  <p className={styles.meaning}>{sentence(w.meaning)}</p>
                  <p className={styles.example}>{w.example}</p>
                  <p className={styles.synonyms}>{w.synonyms.join(' · ')}</p>
                  {w.mnemonic && <p className={styles.mnemonic}>{w.mnemonic}</p>}
                  <div className={styles.foot}>
                    <span className={styles.stage}>{GROUP_LABEL[boxGroup(state?.box ?? 0)]}</span>
                    <Button variant="quiet" aria-pressed={state?.starred ?? false} onClick={() => toggleStar(w.id)}>
                      {state?.starred ? 'Unstar' : 'Star'}
                    </Button>
                  </div>
                  <ReportProblem id={w.id} />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {found.length > shown && (
        <Button block variant="secondary" onClick={() => setShown(shown + PAGE)}>
          Show more
        </Button>
      )}
    </Screen>
  );
}
