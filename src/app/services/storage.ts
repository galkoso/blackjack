import { InjectionToken } from '@angular/core';
export interface Persistence { read(key: string): unknown; write(key: string, value: unknown): void }
/** Replace this adapter with native storage when wrapping with Capacitor. */
export const PERSISTENCE = new InjectionToken<Persistence>('Persistence', {
  providedIn: 'root', factory: () => ({
    read(key) { try { return JSON.parse(localStorage.getItem(key) ?? 'null') as unknown; } catch { return null; } },
    write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Training still works when storage is unavailable. */ } },
  }),
});
