/// <reference lib="webworker" />
// The service worker: offline caching, the update hand-over, and the daily reminder.
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { sendPlan } from './app/push-api';
import { getProfile, logReminderSent } from './data/repo/meta';
import { currentWakeTimes, studySummary } from './data/repo/reminder-plan';
import { loadHome } from './data/repo/stats';
import { toDay } from './engine/dates';
import { reminderText } from './features/personal/nudgeText';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: (string | { url: string; revision: string | null })[] };

const BASE = import.meta.env.BASE_URL;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL(`${BASE}index.html`)));

// The update page's "Update now" (0030).
self.addEventListener('message', (event) => {
  if ((event.data as { type?: string } | null)?.type === 'SKIP_WAITING') void self.skipWaiting();
});

/** Written here from data on the phone: the server only ever sends an empty wake-up (0037). */
async function composeReminder(): Promise<string> {
  try {
    const now = new Date();
    const [profile, summary, home] = await Promise.all([getProfile(), studySummary(now.getTime()), loadHome(toDay(now), now.getHours())]);
    // Logged before the next plan is made, so it knows this one was sent.
    await logReminderSent(now.getTime(), summary.paused?.id ?? null);
    return reminderText({ name: profile?.name ?? null, nudge: home.nudge, hour: now.getHours(), ...summary });
  } catch {
    // The phone must show something for every push, or it may stop delivering them.
    return 'Time for a session.';
  }
}

/** Each wake-up plans the next ones, so reminders keep going while the app stays closed. */
async function replan(): Promise<void> {
  try {
    const subscription = await self.registration.pushManager.getSubscription();
    if (subscription) await sendPlan(subscription, await currentWakeTimes());
  } catch {
    // The rest of the last plan still applies.
  }
}

self.addEventListener('push', (event) => {
  event.waitUntil(
    composeReminder()
      .then((body) => self.registration.showNotification('Graphite', { body, icon: `${BASE}icon-192.png`, badge: `${BASE}icon-192.png`, tag: 'reminder' }))
      .then(replan),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((open) => {
      const existing = open[0];
      return existing ? existing.focus() : self.clients.openWindow(BASE);
    }),
  );
});
