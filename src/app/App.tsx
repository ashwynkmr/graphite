import { useEffect, useState, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from './Layout';
import { setInSession, syncReminder } from './reminders';
import { UpdateScreen } from './UpdateScreen';
import { useAsync } from './useAsync';
import { useUpdatePrompt } from './useUpdatePrompt';
import { getProfile, getReminderAsked, getWhatsNewSeen, setReminderAsked, setWhatsNewSeen } from '../data/repo/meta';
import { HomeScreen } from '../features/home/HomeScreen';
import { QuantSetupScreen } from '../features/quant/QuantSetupScreen';
import { DrillScreen } from '../features/quant/DrillScreen';
import { ResultsScreen } from '../features/results/ResultsScreen';
import { BrowseScreen } from '../features/vocab/BrowseScreen';
import { VocabSetupScreen } from '../features/vocab/VocabSetupScreen';
import { VocabSessionScreen } from '../features/vocab/VocabSessionScreen';
import { VocabResultsScreen } from '../features/vocab/VocabResultsScreen';
import { MistakesScreen } from '../features/mistakes/MistakesScreen';
import { ProgressScreen } from '../features/progress/ProgressScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { NotesCheckScreen } from '../features/personal/NotesCheckScreen';
import { ProfileProvider, useProfile } from '../features/personal/ProfileContext';
import { remindersOff, ReminderScreen } from '../features/reminders/ReminderScreen';
import { RELEASE, WhatsNewScreen } from '../features/whatsnew/WhatsNewScreen';

async function owesWhatsNew(): Promise<boolean> {
  const [profile, seen] = await Promise.all([getProfile(), getWhatsNewSeen()]);
  return profile !== null && seen !== RELEASE;
}

/** The reminder offer shows once, after any What's New, to someone who has the app and no reminders (0059). */
async function owesReminderOffer(): Promise<boolean> {
  const [profile, asked] = await Promise.all([getProfile(), getReminderAsked()]);
  return profile !== null && !asked && (await remindersOff());
}

/** Settings' copy of the screen. */
function WhatsNewPage() {
  const navigate = useNavigate();
  return <WhatsNewScreen doneLabel="Back to Settings" onDone={() => navigate('/settings', { replace: true })} />;
}

/** Home's card opens this on iPhone, for the Home Screen steps. */
function ReminderPage() {
  const navigate = useNavigate();
  return <ReminderScreen doneLabel="Back to Home" onDone={() => navigate('/', { replace: true })} />;
}

function Routed() {
  const { profile, loaded } = useProfile();
  // Asked once as the app starts: only someone who had the app before this release is owed the news.
  const { data: owed } = useAsync(owesWhatsNew);
  const [dismissed, setDismissed] = useState(false);
  const { data: offerOwed } = useAsync(owesReminderOffer);
  const [offered, setOffered] = useState(false);
  const { pathname } = useLocation();
  if (!loaded) return null;
  if (!profile) return <OnboardingScreen />;
  // A session or a notification's question comes first; the news waits for the next ordinary screen.
  const busy = pathname.includes('/session/') || pathname === '/notes-check';
  if (owed && !dismissed && !busy) {
    return (
      <WhatsNewScreen
        doneLabel="Back to studying"
        onDone={() => {
          setDismissed(true);
          void setWhatsNewSeen(RELEASE);
        }}
      />
    );
  }
  if (offerOwed && !offered && !busy) {
    return (
      <ReminderScreen
        doneLabel="Back to studying"
        onDone={() => {
          setOffered(true);
          void setReminderAsked();
        }}
      />
    );
  }
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomeScreen />} />
        <Route path="quant" element={<QuantSetupScreen />} />
        <Route path="vocab" element={<VocabSetupScreen />} />
        <Route path="vocab/browse" element={<BrowseScreen />} />
        <Route path="mistakes" element={<MistakesScreen />} />
        <Route path="progress" element={<ProgressScreen />} />
        <Route path="settings" element={<SettingsScreen />} />
      </Route>
      {/* Full-screen: no tab bar */}
      <Route path="notes-check" element={<NotesCheckScreen />} />
      <Route path="whats-new" element={<WhatsNewPage />} />
      <Route path="reminders" element={<ReminderPage />} />
      <Route path="quant/session/:id" element={<DrillScreen />} />
      <Route path="results/:id" element={<ResultsScreen />} />
      <Route path="vocab/session/:id" element={<VocabSessionScreen />} />
      <Route path="vocab/results/:id" element={<VocabResultsScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const SESSION_RENEW_MS = 10 * 60 * 1000;

/** Finishing or leaving a session changes what's worth a reminder, so each move between screens replans. */
function ReminderSync() {
  const { pathname } = useLocation();
  const inSession = pathname.includes('/session/');
  useEffect(() => {
    setInSession(inSession);
    void syncReminder();
    if (!inSession) return;
    // A long session outlasts one quiet window, so it keeps asking for more.
    const timer = setInterval(() => void syncReminder(), SESSION_RENEW_MS);
    return () => clearInterval(timer);
  }, [pathname, inSession]);
  return null;
}

/** Shows the update screen as soon as a new build is ready, or when an active session ends. */
function UpdateGate({ children }: { children: ReactNode }) {
  const { needRefresh, reload } = useUpdatePrompt();
  const inSession = useLocation().pathname.includes('/session/');
  if (needRefresh && !inSession) return <UpdateScreen onUpdate={reload} />;
  return children;
}

export function App() {
  return (
    <HashRouter>
      <UpdateGate>
        <ReminderSync />
        <ProfileProvider>
          <Routed />
        </ProfileProvider>
      </UpdateGate>
    </HashRouter>
  );
}
