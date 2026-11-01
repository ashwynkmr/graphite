// Reminders, and the app's only runtime network call. Opt-in. The phone decides when to be woken,
// from how the user is studying, and tells the server only those times (0037). Studying never depends on it.
import { getReminderTime, setNotesOn, setReminderTime } from '../data/repo/meta';
import { currentWakeTimes, notesForProfile } from '../data/repo/reminder-plan';
import { deleteSubscription, pushServerConfigured, sendPlan } from './push-api';

const PUBLIC_KEY = import.meta.env.VITE_PUSH_PUBLIC_KEY as string | undefined;

export type ReminderSupport = 'ok' | 'not-configured' | 'needs-install' | 'unsupported';

export function reminderSupport(): ReminderSupport {
  if (!pushServerConfigured || !PUBLIC_KEY) return 'not-configured';
  if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) return 'ok';
  // iPhones only offer push to an app opened from the Home Screen.
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ? 'needs-install' : 'unsupported';
}

function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const raw = atob(base64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(base64url.length / 4) * 4, '='));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function currentSubscription(): Promise<PushSubscription | null> {
  if (reminderSupport() !== 'ok') return null;
  const registration = await navigator.serviceWorker.getRegistration();
  return registration ? registration.pushManager.getSubscription() : null;
}

export interface ReminderState {
  on: boolean;
  time: string;
}

export async function reminderState(): Promise<ReminderState> {
  const [subscription, time] = await Promise.all([currentSubscription(), getReminderTime()]);
  return { on: subscription !== null, time };
}

export type TurnOnResult = 'on' | 'blocked' | 'offline';

/** Must run straight after a tap: browsers only ask for permission then. */
export async function turnOnReminder(time: string): Promise<TurnOnResult> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'blocked';
  const registration = await navigator.serviceWorker.ready;
  const previous = await getReminderTime();
  let subscription: PushSubscription | null = null;
  try {
    subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUBLIC_KEY!) });
    await setReminderTime(time);
    if (await sendPlan(subscription, await currentWakeTimes())) return 'on';
  } catch {
    // Offline, or the phone's push service is unreachable.
  }
  // Half on would look on here and never fire.
  await setReminderTime(previous);
  await subscription?.unsubscribe().catch(() => false);
  return 'offline';
}

/** Saves a new usual time. False if the server couldn't be reached; the old plan then still applies. */
export async function changeReminderTime(time: string): Promise<boolean> {
  const subscription = await currentSubscription();
  if (!subscription) return false;
  const previous = await getReminderTime();
  await setReminderTime(time);
  try {
    if (await sendPlan(subscription, await currentWakeTimes())) return true;
  } catch {
    // Handled below.
  }
  await setReminderTime(previous);
  return false;
}

/** Stops reminders on this phone even if the server can't be told; it drops the address at the next send. */
export async function turnOffReminder(): Promise<void> {
  const subscription = await currentSubscription();
  if (!subscription) return;
  const { endpoint } = subscription;
  await subscription.unsubscribe().catch(() => false);
  await deleteSubscription(endpoint).catch(() => undefined);
}

let lastSent = '';
let inSession = false;

/** Told by the screen, so nothing is planned to arrive during a session. */
export function setInSession(active: boolean): void {
  inSession = active;
}

/** Sends a new plan if studying has changed it. Silent, and does nothing unless reminders are on. */
export async function syncReminder(keepalive = false): Promise<void> {
  try {
    const subscription = await currentSubscription();
    if (!subscription) return;
    const wakeTimes = await currentWakeTimes(inSession);
    const key = JSON.stringify([subscription.endpoint, wakeTimes]);
    if (key === lastSent) return;
    if (await sendPlan(subscription, wakeTimes, keepalive)) lastSent = key;
  } catch {
    // Offline: the last plan still applies, and the next one replaces it.
  }
}

export async function noteState(): Promise<{ eligible: boolean }> {
  return { eligible: (await notesForProfile()) !== null };
}

export async function changeNotes(on: boolean): Promise<void> {
  await setNotesOn(on);
  await syncReminder();
}

/** Leaving the app is the moment a session gets paused or a plan goes stale. */
export function watchForReplan(): void {
  void syncReminder();
  document.addEventListener('visibilitychange', () => {
    // A hidden session is a paused one, so its quiet ends. Coming back restores it.
    if (document.visibilityState === 'hidden') {
      const was = inSession;
      inSession = false;
      void syncReminder(true).finally(() => {
        inSession = was;
      });
    } else {
      void syncReminder();
    }
  });
}
