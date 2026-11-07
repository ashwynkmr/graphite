import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { changeNotes, noteState } from '../../app/reminders';
import { useAsync } from '../../app/useAsync';
import { Button } from '../../ui/controls';
import styles from './NotesCheckScreen.module.css';

/** The nightly question, for phones whose notifications can't show answer buttons (0041). */
export function NotesCheckScreen() {
  const { data } = useAsync(noteState);
  const [answer, setAnswer] = useState<boolean | null>(null);

  if (!data) return null;
  if (!data.eligible) return <Navigate to="/" replace />;

  const reply = async (keep: boolean) => {
    setAnswer(keep);
    await changeNotes(keep);
  };

  return (
    <main className={styles.page}>
      {answer === null ? (
        <>
          <h1 className={styles.question}>Still happy getting these notes from me?</h1>
          <p className={styles.sign}>— {data.from}</p>
          <div className={styles.actions}>
            <Button block onClick={() => reply(true)}>
              Yes, keep them coming
            </Button>
            <Button block variant="secondary" onClick={() => reply(false)}>
              Not for now
            </Button>
          </div>
        </>
      ) : (
        <>
          <h1 className={styles.question}>{answer ? 'Then they keep coming.' : 'Okay. No more notes for now.'}</h1>
          <p className={styles.sign}>{answer ? `See you in two hours. — ${data.from}` : `I’ll just ask once each night. — ${data.from}`}</p>
          <Link to="/" className={styles.home}>
            Back to Home
          </Link>
        </>
      )}
    </main>
  );
}
