/// <reference lib="webworker" />
// The service worker: offline caching, the update hand-over, and the daily reminder.
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { sendPlan } from './app/push-api';
import { getProfile, getReminderPlan, logReminderSent, nextNoteCount, setNotesOn } from './data/repo/meta';
import { currentWakeTimes, notesForProfile, studySummary } from './data/repo/reminder-plan';
import { loadHome } from './data/repo/stats';
import { toDay } from './engine/dates';
import { noteIndex, wakeKind } from './engine/scheduling/reminder-plan';
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

/** A session on screen right now, in any open window of the app. */
async function sessionOnScreen(): Promise<boolean> {
  const open = await self.clients.matchAll({ type: 'window' });
  return open.some((client) => client.visibilityState === 'visible' && client.url.includes('/session/'));
}

/** Each wake-up plans the next ones, so reminders keep going while the app stays closed. */
async function replan(): Promise<void> {
  try {
    const subscription = await self.registration.pushManager.getSubscription();
    if (subscription) await sendPlan(subscription, await currentWakeTimes(await sessionOnScreen()));
  } catch {
    // The rest of the last plan still applies.
  }
}

const NOTE_TITLE = 'Ashwyn says';
const ASK_TAG = 'notes-question';

/** A personal note, if this wake-up was planned as one and the notes still open for this user (0041). */
async function showPersonal(kind: 'note' | 'ask'): Promise<boolean> {
  const icon = `${BASE}icon-192.png`;
  const notes = await notesForProfile();
  if (!notes?.length) return false;
  if (kind === 'ask') {
    const options = {
      body: 'Still happy getting these notes from me? Tap to tell me.',
      icon,
      badge: icon,
      tag: ASK_TAG,
      // Phones without answer buttons (iPhones) open the question in the app instead.
      actions: [
        { action: 'keep', title: 'Yes, keep them' },
        { action: 'stop', title: 'Not for now' },
      ],
    };
    await self.registration.showNotification(NOTE_TITLE, options as NotificationOptions);
  } else {
    await self.registration.showNotification(NOTE_TITLE, { body: notes[noteIndex(await nextNoteCount(), notes.length)]!, icon, badge: icon, tag: 'note' });
  }
  return true;
}

async function showWake(): Promise<void> {
  // No interruptions during a session. Plans leave these gaps already; this catches one already on its way.
  if (await sessionOnScreen()) return;
  const kind = wakeKind(await getReminderPlan().catch(() => []), Date.now());
  if (kind !== 'study' && (await showPersonal(kind).catch(() => false))) return;
  const icon = `${BASE}icon-192.png`;
  await self.registration.showNotification('Graphite', { body: await composeReminder(), icon, badge: icon, tag: 'reminder' });
}

self.addEventListener('push', (event) => {
  event.waitUntil(showWake().then(replan));
});

async function openApp(path: string): Promise<void> {
  const url = `${BASE}${path}`;
  const open = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const existing = open[0];
  if (!existing) {
    await self.clients.openWindow(url);
    return;
  }
  await existing.focus();
  if (path) await existing.navigate(url).catch(() => null);
}

self.addEventListener('notificationclick', (event) => {
  const { tag } = event.notification;
  event.notification.close();
  if (tag !== ASK_TAG) {
    event.waitUntil(openApp(''));
  } else if (event.action === 'keep' || event.action === 'stop') {
    event.waitUntil(setNotesOn(event.action === 'keep').then(replan));
  } else {
    event.waitUntil(openApp('#/notes-check'));
  }
});
