import { Button } from '../../ui/controls';
import { Wordmark } from '../../ui/Wordmark';
import styles from './WhatsNewScreen.module.css';

/** Changes each release, and shows once to anyone who had the app before it (0048). */
export const RELEASE = '2.0.0';

const GROUPS: { title: string; items: { name: string; what: string }[] }[] = [
  {
    title: 'Quant',
    items: [
      { name: 'Sprint', what: 'Answer as many as you can in 30 seconds to 15 minutes. Find it under Timer.' },
      { name: 'Adaptive', what: 'Each topic moves up or down a level with your results. Find it under Difficulty.' },
      { name: 'Your setups', what: 'Pick one topic and the settings you last used for it come back.' },
    ],
  },
  {
    title: 'Vocab',
    items: [
      { name: 'Browse', what: 'Search all 1,500 words by word, synonym or meaning.' },
      { name: 'Memory aids', what: 'A short hook for 231 of the hardest words, on the back of the card.' },
      { name: 'Round 2', what: 'Once you’ve seen every word, go through them again, weakest first.' },
    ],
  },
  {
    title: 'Progress',
    items: [
      { name: 'Trends', what: '14 days of accuracy and speed, for all topics or one, plus your weakest topics.' },
      { name: 'Share your history', what: 'Send a 7- or 14-day summary. It leaves out your name and your answers.' },
      { name: 'Mistake filters', what: 'Narrow the log by topic, and drill just those.' },
      { name: 'What to do next', what: 'Results now suggest your next step.' },
    ],
  },
];

export function WhatsNewScreen({ onDone, doneLabel }: { onDone: () => void; doneLabel: string }) {
  return (
    <main className={styles.page}>
      <header>
        <p className={styles.eyebrow}>
          <Wordmark />
        </p>
        <h1 className={styles.title}>What’s new</h1>
      </header>
      {GROUPS.map((group) => (
        <section key={group.title} className={styles.group}>
          <h2 className={styles.heading}>{group.title}</h2>
          <dl className={styles.list}>
            {group.items.map((item) => (
              <div key={item.name}>
                <dt className={styles.name}>{item.name}</dt>
                <dd className={styles.what}>{item.what}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      <div className={styles.done}>
        <Button block onClick={onDone}>
          {doneLabel}
        </Button>
      </div>
    </main>
  );
}
