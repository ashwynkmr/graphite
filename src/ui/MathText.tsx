import { fractionLabel, tokenizeMath } from './math-text';
import styles from './MathText.module.css';

/** Text with its fractions stacked and its powers raised, as on the exam. */
export function MathText({ text }: { text: string }) {
  return (
    <>
      {tokenizeMath(text).map((token, i) => {
        if (token.kind === 'text') return token.text;
        if (token.kind === 'power') return <sup key={i} className={styles.power}>{token.text}</sup>;
        return (
          <span key={i} className={styles.number} role="img" aria-label={fractionLabel(token)}>
            {token.whole && <span className={styles.whole}>{token.whole}</span>}
            <span className={styles.fraction}>
              <span className={styles.top}>{token.top}</span>
              <span className={styles.bottom}>{token.bottom}</span>
            </span>
          </span>
        );
      })}
    </>
  );
}
