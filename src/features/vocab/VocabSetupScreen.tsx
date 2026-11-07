import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAsync } from '../../app/useAsync';
import type { VocabSettings } from '../../data/db';
import { DEFAULT_VOCAB, getSettings } from '../../data/repo/meta';
import type { Difficulty } from '../../engine/generators/types';
import { VOCAB_MODES, type PracticeMode, type VocabDeck } from '../../engine/sessions/vocab-builder';
import { Button, Field, Segmented, ToggleGroup } from '../../ui/controls';
import { Dial } from '../../ui/Dial';
import { Screen } from '../../ui/Screen';
import { difficultiesLabel, DIFFICULTY_LABEL } from '../quant/display';
import { startVocab, vocabOverview } from './startVocab';
import styles from './VocabSetupScreen.module.css';

/** Session sizes on the dial: 25 to 400 in steps of 25. */
const LENGTHS = Array.from({ length: 16 }, (_, i) => (i + 1) * 25);

const MODE_LABEL: Record<PracticeMode, string> = { flashcard: 'Flashcards', mcq: 'Choices', blank: 'Fill the blank', equiv: 'Sentence equivalence' };

const MODE_HINT: Record<PracticeMode, string> = {
  flashcard: 'Swipe right if you knew it, left to review',
  mcq: 'Pick the meaning or the word from five',
  blank: 'Pick the word that fits the sentence',
  equiv: 'Pick the two words that mean the same here',
};

const ADAPTIVE = 'adaptive';
type DifficultyChoice = Difficulty | typeof ADAPTIVE;

const LEVEL_HINT: Record<Difficulty, string> = {
  1: 'Wrong options are easy to rule out',
  2: 'Wrong options include look-alikes',
  3: 'Exam-style: synonyms, new sentences, traps',
};

function difficultyHint(s: VocabSettings): string {
  if (s.adaptive) return 'Harder as you get to know each word';
  return s.difficulties.length > 1 ? `${difficultiesLabel(s.difficulties)}, mixed` : LEVEL_HINT[s.difficulties[0] ?? 2];
}

export function VocabSetupScreen() {
  const navigate = useNavigate();
  const [s, setS] = useState<VocabSettings>(DEFAULT_VOCAB);
  const [starting, setStarting] = useState(false);
  const { data: overview } = useAsync(vocabOverview);

  useEffect(() => {
    getSettings().then((st) => setS(st.vocab));
  }, []);

  const set = (patch: Partial<VocabSettings>) => setS((prev) => ({ ...prev, ...patch }));
  const chooseDifficulty = (chosen: DifficultyChoice[]) => {
    if (chosen.includes(ADAPTIVE) && !s.adaptive) return set({ adaptive: true });
    const levels = chosen.filter((c): c is Difficulty => c !== ADAPTIVE);
    set(levels.length ? { adaptive: false, difficulties: levels } : { adaptive: false });
  };
  const c = overview?.counts;
  const round = overview?.round;
  // Round 2 onward appears once the first pass is done; a round on offer starts when this deck is used.
  const roundNumber = round ? (round.offer ?? (round.current > 1 ? round.current : null)) : null;
  const roundCards = round?.offer ? overview!.written : (round?.left ?? 0);
  const deck: VocabDeck = s.deck === 'round' && overview && roundNumber === null ? 'today' : s.deck;
  const inDeck: Record<VocabDeck, number> = { today: c ? c.due + c.fresh : 0, new: c?.fresh ?? 0, starred: c?.starred ?? 0, round: roundCards };
  const cards = Math.min(s.length, inDeck[deck]);

  let deckHint = '';
  if (overview && c) {
    if (deck === 'round') deckHint = `Weakest first · ${roundCards} to go`;
    else if (deck === 'today') deckHint = `${c.due} due · ${c.fresh} new`;
    else if (deck === 'new') deckHint = overview.newLeft === 0 ? `Today's ${overview.newGoal} new words are done` : `${c.fresh} left of today's ${overview.newGoal}`;
    else deckHint = c.starred === 0 ? 'Star a card to add it here' : `${c.starred} starred`;
  }

  const start = async () => {
    setStarting(true);
    const session = await startVocab({ ...s, deck });
    if (session) navigate(`/vocab/session/${session.id}`);
    else setStarting(false);
  };

  return (
    <Screen title="Vocabulary" eyebrow="GRE words">
      <div className={styles.form}>
        <Field label="Practice" hint={s.modes.length === 1 ? MODE_HINT[s.modes[0] as PracticeMode] : 'Mixed card by card'}>
          <ToggleGroup label="Practice" columns={2} value={s.modes} onChange={(modes) => set({ modes })} options={VOCAB_MODES.map((m) => ({ value: m, label: MODE_LABEL[m] }))} />
        </Field>

        {s.modes.some((m) => m !== 'flashcard') && (
          <Field label="Difficulty" hint={difficultyHint(s)}>
            <ToggleGroup<DifficultyChoice>
              label="Difficulty"
              columns={2}
              value={s.adaptive ? [ADAPTIVE] : s.difficulties}
              onChange={chooseDifficulty}
              options={[...([1, 2, 3] as const).map((d) => ({ value: d, label: DIFFICULTY_LABEL[d] })), { value: ADAPTIVE, label: 'Adaptive' }]}
            />
          </Field>
        )}

        <Field label="Deck" hint={deckHint}>
          <Segmented
            label="Deck"
            value={deck}
            onChange={(next) => set({ deck: next })}
            options={[
              { value: 'today', label: 'Today' },
              { value: 'new', label: 'New' },
              { value: 'starred', label: 'Starred' },
              ...(roundNumber !== null ? [{ value: 'round' as const, label: `Round ${roundNumber}` }] : []),
            ]}
          />
        </Field>

        <Field label="Cards" hint={cards < s.length && inDeck[deck] > 0 ? `Only ${inDeck[deck]} in this deck` : 'Swipe to choose'}>
          <Dial label="Cards" values={LENGTHS} value={s.length} onChange={(length) => set({ length })} />
        </Field>

        <Link to="/vocab/browse" className={styles.browse}>
          Browse and search all words
        </Link>

        {overview && (
          <p className={styles.note}>
            {overview.written >= 1500
              ? 'All 1,500 words, most frequent first. New words arrive in that order.'
              : `${overview.written} of 1,500 words are written so far, most frequent first. More arrive in batches.`}
          </p>
        )}
      </div>

      <div className={styles.startBar}>
        <Button block onClick={start} disabled={starting || !overview || cards === 0}>
          {starting ? 'Shuffling your cards…' : cards === 0 ? 'Nothing in this deck yet' : `Start ${cards} ${cards === 1 ? 'card' : 'cards'}`}
        </Button>
      </div>
    </Screen>
  );
}
