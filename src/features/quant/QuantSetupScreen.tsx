import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { QuantSettings } from '../../data/db';
import { DEFAULT_QUANT, getSettings } from '../../data/repo/meta';
import { TOPICS, type Topic } from '../../engine/generators/types';
import { Button, Chip, Field, Segmented, ToggleGroup } from '../../ui/controls';
import { Dial } from '../../ui/Dial';
import { Screen } from '../../ui/Screen';
import { difficultiesLabel, DIFFICULTY_LABEL, TOPIC_LABEL } from './display';
import { startDrill } from './startDrill';
import styles from './QuantSetupScreen.module.css';

/** Drill lengths on the dial: 5 to 40 in steps of 5. */
const LENGTHS = [5, 10, 15, 20, 25, 30, 35, 40] as const;

export function QuantSetupScreen() {
  const navigate = useNavigate();
  const [s, setS] = useState<QuantSettings>(DEFAULT_QUANT);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    getSettings().then((st) => setS(st.quant));
  }, []);

  const set = (patch: Partial<QuantSettings>) => setS((prev) => ({ ...prev, ...patch }));
  const picked = s.topics === 'mixed' ? [] : s.topics;

  const toggleTopic = (t: Topic) => {
    const next = picked.includes(t) ? picked.filter((x) => x !== t) : [...picked, t];
    set({ topics: next.length === 0 || next.length === TOPICS.length ? 'mixed' : next });
  };

  const start = async () => {
    setStarting(true);
    const session = await startDrill(s);
    navigate(`/quant/session/${session.id}`);
  };

  const minutes = Math.round((s.secondsPerQuestion * s.length) / 60);

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

        <Field label="Difficulty" hint={s.difficulties.length > 1 ? `${difficultiesLabel(s.difficulties)}, mixed` : 'Pick one or more'}>
          <ToggleGroup
            label="Difficulty"
            value={s.difficulties}
            onChange={(difficulties) => set({ difficulties })}
            options={([1, 2, 3] as const).map((d) => ({ value: d, label: DIFFICULTY_LABEL[d] }))}
          />
        </Field>

        <Field label="Questions" hint="Swipe to choose">
          <Dial label="Questions" values={LENGTHS} value={s.length} onChange={(length) => set({ length })} />
        </Field>

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

        <Field label="Timer" hint={s.timer === 'per-set' ? `${s.secondsPerQuestion}s a question · about ${minutes} min` : 'Time still recorded'}>
          <Segmented
            label="Timer"
            value={s.timer}
            onChange={(timer) => set({ timer })}
            options={[
              { value: 'per-set', label: 'Timed set' },
              { value: 'untimed', label: 'Untimed' },
            ]}
          />
        </Field>
      </div>

      <div className={styles.startBar}>
        <Button block onClick={start} disabled={starting}>
          {starting ? 'Building your drill…' : `Start ${s.length} questions`}
        </Button>
      </div>
    </Screen>
  );
}
