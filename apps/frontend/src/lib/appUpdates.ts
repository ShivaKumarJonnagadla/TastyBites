import { registerSW } from 'virtual:pwa-register';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const LAST_CLEANUP_KEY = 'tb_last_cleanup';

/**
 * Keys that are safe to throw away: they are copies of server settings and are re-created on the next visit.
 * Deliberately NOT listed (so users keep them): 'tastybites-auth' (login), 'tastybites-cart' (cart),
 * 'i18nextLng' (language), 'cookie-consent', 'tb_fridayDishOrder' (admin's saved dish order).
 */
export const DISPOSABLE_LOCAL_KEYS = ['show_kalaset'];

/** Remove runtime caches (e.g. remote images) but keep the service worker's own app-shell precache. */
export async function clearRuntimeCaches(): Promise<void> {
  if (!('caches' in window)) return;
  const keys = await caches.keys();
  await Promise.all(keys.filter((k) => !k.includes('precache')).map((k) => caches.delete(k)));
}

export function clearDisposableLocalData(): void {
  try { DISPOSABLE_LOCAL_KEYS.forEach((k) => localStorage.removeItem(k)); } catch { /* storage unavailable */ }
}

/** Once per day: drop disposable local data and runtime caches. */
async function dailyHousekeeping(): Promise<void> {
  try {
    const last = Number(localStorage.getItem(LAST_CLEANUP_KEY) || 0);
    if (Date.now() - last < DAY_MS) return;
    clearDisposableLocalData();
    await clearRuntimeCaches();
    localStorage.setItem(LAST_CLEANUP_KEY, String(Date.now()));
  } catch { /* never block the app on housekeeping */ }
}

/** Keep every device on the latest deploy: check for updates regularly and reload once when one is installed. */
export function setupAppUpdates(): void {
  void dailyHousekeeping();
  if (!('serviceWorker' in navigator)) return;

  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // First-ever install also fires this event; only reload when an older version was being replaced.
    if (!hadController || reloaded) return;
    reloaded = true;
    window.location.reload();
  });

  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => { registration.update().catch(() => undefined); };
      setInterval(check, HOUR_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    },
  });
}
