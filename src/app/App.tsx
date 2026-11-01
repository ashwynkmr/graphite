import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './Layout';
import { HomeScreen } from '../features/home/HomeScreen';
import { QuantSetupScreen } from '../features/quant/QuantSetupScreen';
import { DrillScreen } from '../features/quant/DrillScreen';
import { ResultsScreen } from '../features/results/ResultsScreen';
import { VocabSetupScreen } from '../features/vocab/VocabSetupScreen';
import { VocabSessionScreen } from '../features/vocab/VocabSessionScreen';
import { VocabResultsScreen } from '../features/vocab/VocabResultsScreen';
import { MistakesScreen } from '../features/mistakes/MistakesScreen';
import { ProgressScreen } from '../features/progress/ProgressScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { ProfileProvider, useProfile } from '../features/personal/ProfileContext';

function Routed() {
  const { profile, loaded } = useProfile();
  if (!loaded) return null;
  if (!profile) return <OnboardingScreen />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomeScreen />} />
        <Route path="quant" element={<QuantSetupScreen />} />
        <Route path="vocab" element={<VocabSetupScreen />} />
        <Route path="mistakes" element={<MistakesScreen />} />
        <Route path="progress" element={<ProgressScreen />} />
        <Route path="settings" element={<SettingsScreen />} />
      </Route>
      {/* Full-screen: no tab bar */}
      <Route path="quant/session/:id" element={<DrillScreen />} />
      <Route path="results/:id" element={<ResultsScreen />} />
      <Route path="vocab/session/:id" element={<VocabSessionScreen />} />
      <Route path="vocab/results/:id" element={<VocabResultsScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <HashRouter>
      <ProfileProvider>
        <Routed />
      </ProfileProvider>
    </HashRouter>
  );
}
