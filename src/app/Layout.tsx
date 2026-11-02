import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { getTutorialOwed } from '../data/repo/meta';
import { Tutorial, useTutorial } from '../features/tutorial/Tutorial';
import { TabBar } from './TabBar';
import styles from './Layout.module.css';

/** Tabbed screens. Full-screen session routes (Phase 1, step 5) sit outside this layout. */
export function Layout() {
  const { open, start } = useTutorial();
  useEffect(() => {
    void getTutorialOwed().then((owed) => {
      if (owed) start();
    });
  }, [start]);
  return (
    <div className={styles.shell}>
      <main className={styles.main}>
        <Outlet />
      </main>
      <TabBar />
      {open && <Tutorial />}
    </div>
  );
}
