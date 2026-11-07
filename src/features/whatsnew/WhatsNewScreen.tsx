import { Button } from '../../ui/controls';
import { Wordmark } from '../../ui/Wordmark';
import styles from './WhatsNewScreen.module.css';

/** Changes each release, and shows once to anyone who had the app before it (0048). */
export const RELEASE = '3.1.0';

const GROUPS: { title: string; items: { name: string; what: string }[] }[] = [
  {
    title: 'Vocab',
    items: [
      { name: 'Pick a difficulty', what: 'Easy, Medium, Hard or Adaptive for Choices, Fill the blank and Sentence equivalence. Find it under Vocab, once one of those is on.' },
      { name: 'Hard is exam-style', what: '“Closest in meaning?” questions, and new exam sentences with trap words.' },
      { name: 'Adaptive', what: 'Words you know well are asked harder, new ones easier.' },
    ],
  },
  {
    title: 'Results and sharing',
    items: [
      { name: 'Rulers', what: 'Each row shows how much you got right as a ruler, with the count and percentage beside it.' },
      { name: 'Weakest first', what: 'Topics run from weakest to strongest, on results and share cards.' },
      { name: 'A Progress report card', what: 'Share from Progress for your countdown, then Quant and Verbal side by side.' },
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
