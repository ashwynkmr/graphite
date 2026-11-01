import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './Layout';
import { HomeScreen } from '../features/home/HomeScreen';
import { QuantSetupScreen } from '../features/quant/QuantSetupScreen';
import { VocabSetupScreen } from '../features/vocab/VocabSetupScreen';
import { MistakesScreen } from '../features/mistakes/MistakesScreen';
import { ProgressScreen } from '../features/progress/ProgressScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomeScreen />} />
          <Route path="quant" element={<QuantSetupScreen />} />
          <Route path="vocab" element={<VocabSetupScreen />} />
          <Route path="mistakes" element={<MistakesScreen />} />
          <Route path="progress" element={<ProgressScreen />} />
          <Route path="settings" element={<SettingsScreen />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
