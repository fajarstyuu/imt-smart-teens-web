export class ApiError extends Error { constructor(message: string, public status = 0) { super(message); } }
const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4174/api';
let volatile: Record<string, string> = {};
let volatileAfterWriteFailure: Record<string, string> = {};
const storageKey = (role: string) => `imt-smart-teens-token-${role}`;
const legacyStorageKey = (role: string) => `rg-token-${role}`;
export const token = {
  get(role: string) {
    try {
      const current = localStorage.getItem(storageKey(role));
      const legacy = localStorage.getItem(legacyStorageKey(role));
      if (Object.prototype.hasOwnProperty.call(volatileAfterWriteFailure, role)) return volatileAfterWriteFailure[role];
      if (current) return current;
      if (!legacy) return '';
      // Migrate an existing authenticated session once; keep it usable even when
      // storage is read-only or full, and remove the old key only after the copy.
      try { localStorage.setItem(storageKey(role), legacy); localStorage.removeItem(legacyStorageKey(role)); } catch { /* preserve the legacy value for the next read */ }
      return legacy;
    } catch { return volatile[role] || ''; }
  },
  set(role: string, value: string) {
    volatile[role] = value;
    try {
      if (value) { localStorage.setItem(storageKey(role), value); localStorage.removeItem(legacyStorageKey(role)); }
      else { localStorage.removeItem(storageKey(role)); localStorage.removeItem(legacyStorageKey(role)); }
      delete volatileAfterWriteFailure[role];
    } catch {
      volatileAfterWriteFailure[role] = value;
      /* Keep this session in memory when persistence is unavailable. */
    }
  }
};
export async function request<T>(path: string, method = 'GET', body?: unknown, role = 'student'): Promise<T> {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${apiBase}${path}`, {method, headers: {'Content-Type':'application/json', ...(token.get(role) ? {Authorization:`Bearer ${token.get(role)}`} : {})}, body:body === undefined ? undefined : JSON.stringify(body), signal:controller.signal});
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.error || 'Permintaan belum berhasil. Coba lagi.', response.status);
    return data;
  } catch (e) { if (e instanceof ApiError) throw e; throw new ApiError('Tidak dapat terhubung. Periksa koneksi dan coba lagi.'); }
  finally { clearTimeout(timeout); }
}
