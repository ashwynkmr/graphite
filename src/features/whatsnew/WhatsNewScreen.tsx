import { Button } from '../../ui/controls';
import { Wordmark } from '../../ui/Wordmark';
import styles from './WhatsNewScreen.module.css';

/** Changes each release, and shows once to anyone who had the app before it (0048). */
export const RELEASE = '3.0.0';

const GROUPS: { title: string; items: { name: string; what: string }[] }[] = [
  {
    title: 'Quant',
    items: [
      { name: 'Twice the questions', what: 'More than 3,200 now, up from 1,500. Your progress carries over.' },
      { name: 'Five new subjects', what: 'Algebra, geometry, number properties, statistics and probability.' },
      { name: 'Comparison', what: 'Quantity A against Quantity B, in the exam’s format and order. Find it under Topics.' },
      { name: 'Clearer explanations', what: '231 questions have a better explanation on Results.' },
      { name: 'Submit in reach', what: 'Long questions now fit, with Submit always on screen.' },
    ],
  },
  {
    title: 'Vocab',
    items: [
      { name: 'Harder Sentence Equivalence', what: '294 longer, exam-style sentences. Watch for two words that match each other but don’t fit.' },
      { name: 'See the sentence again', what: 'Results now show the sentence, so you can see why a pair was right.' },
    ],
  },
  {
    title: 'Getting around',
    items: [{ name: 'Quick tour', what: 'A short walk through each tab. Find it in Settings.' }],
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
