import { NavLink } from 'react-router-dom';
import { IconHome, IconMistakes, IconProgress, IconQuant, IconVocab } from './icons';
import styles from './TabBar.module.css';

const tabs = [
  { to: '/', label: 'Home', Icon: IconHome, end: true },
  { to: '/quant', label: 'Quant', Icon: IconQuant, end: false },
  { to: '/vocab', label: 'Vocab', Icon: IconVocab, end: false },
  { to: '/mistakes', label: 'Mistakes', Icon: IconMistakes, end: false },
  { to: '/progress', label: 'Progress', Icon: IconProgress, end: false },
];

export function TabBar() {
  return (
    <nav className={styles.bar} aria-label="Main">
      {tabs.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          data-tab={to}
          className={({ isActive }) => (isActive ? `${styles.tab} ${styles.active}` : styles.tab)}
        >
          <Icon />
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
