import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applyTheme } from '../../app/theme';
import { useAsync } from '../../app/useAsync';
import { getSettings, updateSettings, type Settings } from '../../data/repo/meta';
import { Button, Field, Segmented } from '../../ui/controls';
import { Screen } from '../../ui/Screen';
import { useProfile } from '../personal/ProfileContext';
import { useTutorial } from '../tutorial/Tutorial';
import { BackupSection } from './BackupSection';
import { InstallSection } from './InstallSection';
import { ReminderSection } from './ReminderSection';
import { ResetSection } from './ResetSection';
import styles from './SettingsScreen.module.css';

const MIN_GOAL = 1;
const MAX_GOAL = 1500;

/** A daily goal. Saved when the field loses focus, so a half-typed number is never stored. */
function GoalField({ label, value, onSave }: { label: string; value: number; onSave: (n: number) => void }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  return (
    <Field label={label}>
      <input
        className={`${styles.input} tabular`}
        type="number"
        inputMode="numeric"
        min={MIN_GOAL}
        max={MAX_GOAL}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const n = Math.round(Number(text));
          if (!Number.isFinite(n) || text.trim() === '') return setText(String(value));
          const clamped = Math.min(MAX_GOAL, Math.max(MIN_GOAL, n));
          setText(String(clamped));
          if (clamped !== value) onSave(clamped);
        }}
      />
    </Field>
  );
}

export function SettingsScreen() {
  const startTutorial = useTutorial((t) => t.start);
  const { profile, save } = useProfile();
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  const { data: loaded, reload } = useAsync(getSettings);
  const [settings, setSettings] = useState<Settings>();

  useEffect(() => {
    setName(profile?.name ?? '');
  }, [profile]);

  useEffect(() => {
    if (loaded) setSettings(loaded);
  }, [loaded]);

  const dirty = name.trim() !== (profile?.name ?? '');
  const patch = async (p: Partial<Settings>) => setSettings(await updateSettings(p));

  return (
    <Screen title="Settings">
      <form
        className={styles.section}
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          await save({ name });
          setSaved(true);
        }}
      >
        <Field label="Your name">
          <input
            className={styles.input}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            maxLength={24}
            autoCapitalize="words"
          />
        </Field>
        <Button type="submit" variant="secondary" disabled={!dirty || !name.trim()}>
          {saved ? 'Saved' : 'Save'}
        </Button>
      </form>

      {settings && (
        <>
          <section className={styles.section}>
            <h2 className={styles.heading}>Study plan</h2>
            <div className={styles.pair}>
              <GoalField label="New words a day" value={settings.goals.newWords} onSave={(newWords) => patch({ goals: { ...settings.goals, newWords } })} />
              <GoalField label="Quant a day" value={settings.goals.quantQuestions} onSave={(quantQuestions) => patch({ goals: { ...settings.goals, quantQuestions } })} />
            </div>
            <Field label="Exam date">
              <input
                className={`${styles.input} ${styles.date} tabular`}
                type="date"
                value={settings.examDay}
                onChange={(e) => {
                  if (e.target.value) void patch({ examDay: e.target.value });
                }}
              />
            </Field>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>Drill defaults</h2>
            <Field label="Answer mode">
              <Segmented
                label="Answer mode"
                value={settings.quant.answerMode}
                onChange={(answerMode) => patch({ quant: { ...settings.quant, answerMode } })}
                options={[
                  { value: 'mix', label: 'Mix' },
                  { value: 'typed', label: 'Typed' },
                  { value: 'mcq', label: 'Choices' },
                ]}
              />
            </Field>
            <Field label="Time per question">
              <Segmented
                label="Time per question"
                value={settings.quant.secondsPerQuestion}
                onChange={(secondsPerQuestion) => patch({ quant: { ...settings.quant, secondsPerQuestion } })}
                options={[30, 45, 60, 90].map((n) => ({ value: n, label: `${n}s` }))}
              />
            </Field>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>Theme</h2>
            <Segmented
              label="Theme"
              value={settings.theme}
              onChange={(theme) => {
                applyTheme(theme);
                void patch({ theme });
              }}
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          </section>
        </>
      )}

      <Link to="/whats-new" className={styles.whatsNew}>
        What’s new
      </Link>
      <button type="button" className={styles.whatsNew} onClick={startTutorial}>
        Take the quick tour
      </button>

      <ReminderSection />
      <InstallSection />
      <BackupSection onRestored={reload} />
      <ResetSection onReset={reload} />
    </Screen>
  );
}
