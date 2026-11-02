import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { QuantSettings } from '../../data/db';
import { DEFAULT_QUANT, getSettings, normalizeQuant, type Settings } from '../../data/repo/meta';
import { SPRINT_MINUTES } from '../../engine/sessions/quant-builder';
import { TOPICS, type Difficulty, type Topic } from '../../engine/generators/types';
import { Button, Chip, Field, Segmented, ToggleGroup } from '../../ui/controls';
import { Dial } from '../../ui/Dial';
import { Screen } from '../../ui/Screen';
import { difficultiesLabel, DIFFICULTY_LABEL, TOPIC_LABEL } from './display';
import { startDrill } from './startDrill';
import styles from './QuantSetupScreen.module.css';

/** Drill lengths on the dial: 5 to 40 in steps of 5. */
const LENGTHS = [5, 10, 15, 20, 25, 30, 35, 40] as const;

const ADAPTIVE = 'adaptive';
type DifficultyChoice = Difficulty | typeof ADAPTIVE;

function difficultyHint(s: QuantSettings): string {
  if (s.adaptive) return 'Each topic moves with your results';
  return s.difficulties.length > 1 ? `${difficultiesLabel(s.difficulties)}, mixed` : 'Pick one or more';
}

function timerHint(s: QuantSettings): string {
  if (s.timer === 'sprint') return 'As many as you can';
  if (s.timer === 'untimed') return 'Time still recorded';
  return `${s.secondsPerQuestion}s a question · about ${Math.round((s.secondsPerQuestion * s.length) / 60)} min`;
}

export function QuantSetupScreen() {
  const navigate = useNavigate();
  const [s, setS] = useState<QuantSettings>(DEFAULT_QUANT);
  const [byTopic, setByTopic] = useState<Settings['quantByTopic']>({});
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    getSettings().then((st) => {
      setS(st.quant);
      setByTopic(st.quantByTopic);
    });
  }, []);

  const set = (patch: Partial<QuantSettings>) => setS((prev) => ({ ...prev, ...patch }));
  const picked = s.topics === 'mixed' ? [] : s.topics;

  const toggleTopic = (t: Topic) => {
    const next = picked.includes(t) ? picked.filter((x) => x !== t) : [...picked, t];
    const topics = next.length === 0 || next.length === TOPICS.length ? 'mixed' : next;
    // A topic drilled on its own before comes back with the setup it had then.
    const remembered = next.length === 1 ? byTopic[next[0]!] : undefined;
    setS(remembered ? normalizeQuant({ ...remembered, topics }) : (prev) => ({ ...prev, topics }));
  };

  const chooseDifficulty = (chosen: DifficultyChoice[]) => {
    if (chosen.includes(ADAPTIVE) && !s.adaptive) return set({ adaptive: true });
    const levels = chosen.filter((c): c is Difficulty => c !== ADAPTIVE);
    set(levels.length ? { adaptive: false, difficulties: levels } : { adaptive: false });
  };

  const start = async () => {
    setStarting(true);
    const session = await startDrill(s);
    navigate(`/quant/session/${session.id}`);
  };

  return (
    <Screen title="Quant drills" eyebrow="Mental math">
      <div className={styles.form}>
        <Field label="Topics" hint={s.topics === 'mixed' ? 'All nine' : `${picked.length} selected`}>
          <div className={styles.chips}>
            <Chip selected={s.topics === 'mixed'} onClick={() => set({ topics: 'mixed' })}>
              Mixed: give me anything
            </Chip>
            {TOPICS.map((t) => (
              <Chip key={t} selected={picked.includes(t)} onClick={() => toggleTopic(t)}>
                {TOPIC_LABEL[t]}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Difficulty" hint={difficultyHint(s)}>
          <ToggleGroup<DifficultyChoice>
            label="Difficulty"
            columns={2}
            value={s.adaptive ? [ADAPTIVE] : s.difficulties}
            onChange={chooseDifficulty}
            options={[...([1, 2, 3] as const).map((d) => ({ value: d, label: DIFFICULTY_LABEL[d] })), { value: ADAPTIVE, label: 'Adaptive' }]}
          />
        </Field>

        <Field label="Timer" hint={timerHint(s)}>
          <Segmented
            label="Timer"
            value={s.timer}
            onChange={(timer) => set({ timer })}
            options={[
              { value: 'per-set', label: 'Timed set' },
              { value: 'sprint', label: 'Sprint' },
              { value: 'untimed', label: 'Untimed' },
            ]}
          />
        </Field>

        {s.timer === 'sprint' ? (
          <Field label="Minutes">
            <Segmented label="Minutes" value={s.sprintMinutes} onChange={(sprintMinutes) => set({ sprintMinutes })} options={SPRINT_MINUTES.map((m) => ({ value: m, label: `${m} min` }))} />
          </Field>
        ) : (
          <Field label="Questions" hint="Swipe to choose">
            <Dial label="Questions" values={LENGTHS} value={s.length} onChange={(length) => set({ length })} />
          </Field>
        )}

        <Field label="Answer mode">
          <Segmented
            label="Answer mode"
            value={s.answerMode}
            onChange={(answerMode) => set({ answerMode })}
            options={[
              { value: 'mix', label: 'Mix' },
              { value: 'typed', label: 'Typed' },
              { value: 'mcq', label: 'Choices' },
            ]}
          />
        </Field>
      </div>

      <div className={styles.startBar}>
        <Button block onClick={start} disabled={starting}>
          {starting ? 'Building your drill…' : s.timer === 'sprint' ? `Start ${s.sprintMinutes}-minute sprint` : `Start ${s.length} questions`}
        </Button>
      </div>
    </Screen>
  );
}
