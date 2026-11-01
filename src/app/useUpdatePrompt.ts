import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Registers the service worker. When a new build is ready, `needRefresh` turns true and
 * Home shows a quiet "Update available" bar. Never shown mid-session.
 */
export function useUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  return { needRefresh, reload: () => updateServiceWorker(true) };
}
