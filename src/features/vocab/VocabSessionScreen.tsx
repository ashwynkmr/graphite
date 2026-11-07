import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Word } from '../../content/schema';
import { loadWords } from '../../content/words';
import type { VocabSessionRow } from '../../data/db';
import { finishVocabSession, getVocabSession, loadWordStates, recordVocabAnswer, saveVocabClock, setStarred } from '../../data/repo/vocab';
import { pause, resume } from '../../engine/sessions/clock';
import { blankOut, blankOutEquiv, equivAnswer, inflected, type VocabItem } from '../../engine/sessions/vocab-builder';
import { ChoiceList } from '../../ui/ChoiceList';
import { EndConfirm } from '../../ui/EndConfirm';
import { PairChoiceList } from '../../ui/PairChoiceList';
import drill from '../quant/DrillScreen.module.css';
import { POS_SHORT, sentence } from './display';
import { ExampleSentence } from './ExampleSentence';
import { MarkIcon, SwipeCard, type SwipeCardHandle, type SwipeMark } from './SwipeCard';
import styles from './VocabSessionScreen.module.css';

function StarIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.starIcon}>
      <path
        d="M12 3.8l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z"
        fill={on ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Captions carry the swipe direction, so each button also teaches its gesture. */
const MARK_LABEL: Record<SwipeMark, string> = { review: '← Review', unsure: '↑ Unsure', know: 'Know it →' };

function Star({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" className={`${styles.star} ${on ? styles.starOn : ''}`} onClick={onToggle} aria-pressed={on} aria-label={on ? 'Unstar this word' : 'Star this word for review'}>
      <StarIcon on={on} />
    </button>
  );
}

function CardFront({ word }: { word: Word }) {
  return (
    <>
      <span className={styles.word}>{word.word}</span>
      <span className={styles.pos}>{word.pos}</span>
      <span className={styles.tap}>Tap to flip</span>
    </>
  );
}

/** The back: meaning, example and synonyms, each line on the 28px rules. */
function CardBack({ word }: { word: Word }) {
  return (
    <div className={styles.backBody}>
      <span className={styles.backWord}>
        {word.word} <span className={styles.posInline}>{POS_SHORT[word.pos]}</span>
      </span>
      <span className={styles.meaning}>{sentence(word.meaning)}</span>
      <span className={styles.example}>
        <ExampleSentence word={word} />
      </span>
      <span className={styles.synonyms}>{word.synonyms.join(' · ')}</span>
      {word.mnemonic && <span className={styles.mnemonic}>{word.mnemonic}</span>}
    </div>
  );
}

/** The question side of a quiz card. Nothing here hints at the answer beyond what the mode intends. */
function QuizPrompt({ item, word }: { item: VocabItem; word: Word }) {
  if (item.kind === 'meaning') {
    return (
      <>
        <p className={styles.ask}>What does it mean?</p>
        <p className={styles.word}>{word.word}</p>
        <p className={styles.pos}>{word.pos}</p>
      </>
    );
  }
  if (item.kind === 'synonym') {
    return (
      <>
        <p className={styles.ask}>Closest in meaning?</p>
        <p className={styles.word}>{word.word}</p>
        <p className={styles.pos}>{word.pos}</p>
      </>
    );
  }
  if (item.kind === 'word') {
    return (
      <>
        <p className={styles.ask}>Which word means</p>
        <p className={styles.prompt}>{sentence(word.meaning)}</p>
      </>
    );
  }
  if (item.kind === 'blank') {
    return (
      <>
        <p className={styles.ask}>Which word fits?</p>
        <p className={styles.prompt}>{item.sentence ?? blankOut(word)}</p>
        {!item.sentence && inflected(word) && <p className={styles.formNote}>Options are in their base form.</p>}
      </>
    );
  }
  if (item.kind === 'equiv') {
    return (
      <>
        <p className={styles.ask}>Which two mean the same?</p>
        <p className={styles.prompt}>{item.sentence ?? blankOutEquiv(word)}</p>
        {!item.sentence && inflected(word) && <p className={styles.formNote}>Options are in their base form.</p>}
      </>
    );
  }
  return (
    <>
      <p className={styles.ask}>Type the word ({word.pos})</p>
      <p className={styles.prompt}>{sentence(word.meaning)}</p>
      <p className={styles.example}>{blankOut(word, true)}</p>
    </>
  );
}

export function VocabSessionScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<VocabSessionRow | null>(null);
  const [words, setWords] = useState<ReadonlyMap<string, Word> | null>(null);
  const [starred, setStarredIds] = useState<Set<string>>(new Set());
  const [flipped, setFlipped] = useState(false);
  const [choice, setChoice] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const busy = useRef(false);
  const card = useRef<SwipeCardHandle>(null);
  const sessionRef = useRef<VocabSessionRow | null>(null);
  sessionRef.current = session;

  // Load, and resume the clock.
  useEffect(() => {
    let live = true;
    Promise.all([getVocabSession(id), loadWords(), loadWordStates()]).then(async ([s, book, states]) => {
      if (!live) return;
      if (!s || s.status !== 'active') return navigate(s?.status === 'finished' ? `/vocab/results/${id}` : '/vocab', { replace: true });
      const resumed = { ...s, timer: resume(s.timer, Date.now()) };
      await saveVocabClock(resumed);
      setWords(book.byId);
      setStarredIds(new Set([...states.values()].filter((st) => st.starred).map((st) => st.wordId)));
      setSession(resumed);
    });
    return () => {
      live = false;
    };
  }, [id, navigate]);

  // Pause the clock whenever the app is hidden.
  useEffect(() => {
    const onVis = () => {
      const s = sessionRef.current;
      if (!s) return;
      const t = Date.now();
      const next = { ...s, timer: document.hidden ? pause(s.timer, t) : resume(s.timer, t) };
      setSession(next);
      void saveVocabClock(next);
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onVis);
      const s = sessionRef.current;
      if (s && s.status === 'active') void saveVocabClock({ ...s, timer: pause(s.timer, Date.now()) });
    };
  }, []);

  const finish = useCallback(
    async (s: VocabSessionRow, endedBy: NonNullable<VocabSessionRow['endedBy']>) => {
      if (!words) return;
      await finishVocabSession(s, words, endedBy);
      navigate(`/vocab/results/${s.id}`, { replace: true });
    },
    [words, navigate],
  );

  const submit = useCallback(
    async (value: string | null) => {
      const s = sessionRef.current;
      if (!s || !words || busy.current) return;
      busy.current = true;
      const next = await recordVocabAnswer(s, words.get(s.items[s.cursor]!.wordId)!, value);
      setFlipped(false);
      setChoice(null);
      setTyped('');
      setConfirmingEnd(false);
      if (next.cursor >= next.items.length) {
        await finish(next, 'completed');
        return;
      }
      setSession(next);
      busy.current = false;
    },
    [words, finish],
  );

  // Flashcard keys: Space or Enter flips; arrows swipe (left Review, up Unsure, right Know it).
  const item = session?.items[session.cursor];
  useEffect(() => {
    if (item?.kind !== 'flashcard' || confirmingEnd) return;
    const keys: Record<string, SwipeMark> = { ArrowLeft: 'review', ArrowUp: 'unsure', ArrowRight: 'know' };
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === ' ' || e.key === 'Enter') setFlipped((f) => !f);
      else if (keys[e.key]) card.current?.fling(keys[e.key]!);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, flipped, submit, confirmingEnd]);

  const endEarly = async () => {
    const s = sessionRef.current;
    if (!s || busy.current) return;
    busy.current = true;
    await finish(s, 'ended-early');
  };

  const toggleStar = async (wordId: string) => {
    const on = !starred.has(wordId);
    const next = new Set(starred);
    if (on) next.add(wordId);
    else next.delete(wordId);
    setStarredIds(next);
    await setStarred(wordId, on);
  };

  if (!session || !words || !item) return <div className={drill.loading}>Shuffling your cards…</div>;

  const word = words.get(item.wordId)!;
  const firstFlashcard = session.items.findIndex((i) => i.kind === 'flashcard');
  const isStarred = starred.has(word.id);
  const onType = (e: FormEvent) => {
    e.preventDefault();
    if (typed.trim()) void submit(typed);
  };

  return (
    <div className={drill.screen}>
      <header className={drill.header}>
        <button type="button" className={drill.headerBtn} onClick={() => navigate('/')} aria-label="Pause and go home">
          Pause
        </button>
        <div className={drill.progress}>
          <span className="tabular">
            {session.cursor + 1} / {session.items.length}
          </span>
          <div className={drill.bar} aria-hidden="true">
            <div className={drill.fill} style={{ width: `${(session.cursor / session.items.length) * 100}%` }} />
          </div>
        </div>
        <button type="button" className={drill.headerBtn} onClick={() => setConfirmingEnd(true)} aria-label="End session">
          End
        </button>
      </header>

      <main className={item.kind === 'equiv' ? `${styles.body} ${styles.bodyTight}` : styles.body}>
        {item.kind === 'flashcard' ? (
          <SwipeCard
            key={session.cursor}
            ref={card}
            flipped={flipped}
            onFlip={() => setFlipped((f) => !f)}
            onMark={(m) => submit(m)}
            nudge={session.cursor === firstFlashcard}
            corner={<Star on={isStarred} onToggle={() => toggleStar(word.id)} />}
            front={<CardFront word={word} />}
            back={<CardBack word={word} />}
          />
        ) : (
          <div className={`${drill.card} ${styles.quizCard}`}>
            <div className={styles.quizStar}>
              <Star on={isStarred} onToggle={() => toggleStar(word.id)} />
            </div>
            <QuizPrompt item={item} word={word} />
          </div>
        )}
      </main>

      <footer className={drill.footer}>
        {confirmingEnd ? (
          <EndConfirm message="End this session? Cards you haven’t reached stay as they were." endLabel="End session" onKeep={() => setConfirmingEnd(false)} onEnd={endEarly} />
        ) : (
          <>
        {item.kind === 'flashcard' && (
          <>
            <p className={styles.guide}>Swipe the card, or tap a mark</p>
            <div className={styles.markRow}>
              {(['review', 'unsure', 'know'] as const).map((m) => (
                <button key={m} type="button" className={`${styles.markBtn} ${styles[`mark_${m}`]}`} onClick={() => card.current?.fling(m)}>
                  <span className={styles.markCircle}>
                    <MarkIcon mark={m} />
                  </span>
                  <span className={styles.markLabel}>{MARK_LABEL[m]}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {(item.kind === 'meaning' || item.kind === 'word' || item.kind === 'blank' || item.kind === 'synonym') && (
          <ChoiceList
            key={session.cursor}
            long={item.kind === 'meaning'}
            choices={item.choices!.map((c) => ({ value: c, label: item.kind === 'meaning' ? sentence(words.get(c)?.meaning ?? c) : c }))}
            selected={choice}
            onSelect={setChoice}
            onSubmit={() => choice && submit(choice)}
            onSkip={() => submit(null)}
          />
        )}

        {item.kind === 'equiv' && (
          <PairChoiceList key={session.cursor} choices={item.choices!} onSubmit={(a, b) => submit(equivAnswer(a, b))} onSkip={() => submit(null)} />
        )}

        {item.kind === 'typein' && (
          <form className={styles.typeForm} onSubmit={onType}>
            <input
              key={session.cursor}
              className={styles.input}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type the word"
              aria-label="Your answer"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="go"
              autoFocus
            />
            <div className={styles.typeActions}>
              <button type="button" className={styles.mark} onClick={() => submit(null)}>
                Skip
              </button>
              <button type="submit" className={`${styles.mark} ${styles.know}`} disabled={!typed.trim()}>
                Submit
              </button>
            </div>
          </form>
        )}
          </>
        )}
      </footer>
    </div>
  );
}
