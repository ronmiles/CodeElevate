export const NEW_DASHBOARD_LS_KEY = 'dashboard:useNew';

export function getIsNewDesign(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(NEW_DASHBOARD_LS_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setIsNewDesign(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NEW_DASHBOARD_LS_KEY, enabled ? 'true' : 'false');
    // trigger storage listeners in same tab by manual event dispatch if needed
    try {
      window.dispatchEvent(
        new StorageEvent('storage', { key: NEW_DASHBOARD_LS_KEY })
      );
    } catch {
      // noop
    }
  } catch {
    // noop
  }
}
