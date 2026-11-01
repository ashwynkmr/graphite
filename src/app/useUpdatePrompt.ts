import { useRegisterSW } from 'virtual:pwa-register/react';

/** If the new build hasn't taken over by now, reload anyway: the update screen has no other exit. */
const RELOAD_FALLBACK_MS = 3000;

/**
 * Registers the service worker. When a new build is ready, `needRefresh` turns true and
 * the app is replaced by the update screen, except during an active session.
 */
export function useUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  const reload = () => {
    void updateServiceWorker(true);
    setTimeout(() => window.location.reload(), RELOAD_FALLBACK_MS);
  };
  return { needRefresh, reload };
}
