import styles from './ReportProblem.module.css';

const ISSUES = 'https://github.com/ashwynkmr/graphite/issues/new';

/** Opens a GitHub issue with the item already filled in. Shown on results only, never during a session. */
export function ReportProblem({ id }: { id: string }) {
  const href = `${ISSUES}?template=content-problem.yml&id=${encodeURIComponent(id)}&title=${encodeURIComponent(`Content problem: ${id}`)}`;
  return (
    <a className={styles.link} href={href} target="_blank" rel="noreferrer">
      Report a problem
    </a>
  );
}
