import { create } from 'zustand';
import api from './api';
import { clearDisposableLocalData, clearRuntimeCaches } from './appUpdates';

const STORAGE_KEY = 'tb_menu_version';

/** Changes whenever the admin edits a dish or setting. Pages that show menu data refetch when it changes. */
export const useMenuVersion = create<{ version: string | null }>(() => ({ version: null }));

async function checkMenuVersion(): Promise<void> {
  try {
    const res = await api.get('/menu-version');
    const latest = String(res.data.version);
    const known = localStorage.getItem(STORAGE_KEY);
    if (latest === known) return;
    localStorage.setItem(STORAGE_KEY, latest);
    if (known === null) return; // first visit: the page just loaded fresh data anyway
    clearDisposableLocalData();
    await clearRuntimeCaches();
    useMenuVersion.setState({ version: latest });
  } catch {
    // offline or server busy: try again at the next check
  }
}

export function startMenuVersionWatcher(): void {
  void checkMenuVersion();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void checkMenuVersion();
  });
  window.addEventListener('online', () => { void checkMenuVersion(); });
}
