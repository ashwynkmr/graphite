import type { Word } from '../../content/schema';
import { splitExample } from './display';
import styles from './ExampleSentence.module.css';

/** The example sentence with its word in bold. Only for where the word is already showing, never a quiz. */
export function ExampleSentence({ word }: { word: Pick<Word, 'example' | 'exampleForm'> }) {
  const parts = splitExample(word.example, word.exampleForm);
  if (!parts) return <>{word.example}</>;
  return (
    <>
      {parts.before}
      <strong className={styles.word}>{parts.word}</strong>
      {parts.after}
    </>
  );
}
