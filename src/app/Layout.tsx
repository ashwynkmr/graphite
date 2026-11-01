import { Outlet } from 'react-router-dom';
import { TabBar } from './TabBar';
import styles from './Layout.module.css';

/** Tabbed screens. Full-screen session routes (Phase 1, step 5) sit outside this layout. */
export function Layout() {
  return (
    <div className={styles.shell}>
      <main className={styles.main}>
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}
