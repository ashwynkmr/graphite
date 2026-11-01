import { useEffect, useState } from 'react';
import { Button, Field } from '../../ui/controls';
import { ComingSoon, Screen } from '../../ui/Screen';
import { useProfile } from '../personal/ProfileContext';
import styles from './SettingsScreen.module.css';

export function SettingsScreen() {
  const { profile, save } = useProfile();
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(profile?.name ?? '');
  }, [profile]);

  const dirty = name.trim() !== (profile?.name ?? '');

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
      <ComingSoon>Goals, exam date, theme, install and backup arrive in step 9.</ComingSoon>
    </Screen>
  );
}
