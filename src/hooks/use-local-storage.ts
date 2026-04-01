import { useCallback, useSyncExternalStore } from 'react';

/**
 * A generic hook for persisting state in localStorage.
 * Each generator/creator can use a different key to isolate its options.
 *
 * @example
 * const [options, setOptions, resetOptions] = useLocalStorage('mv-create-options', { aspectRatio: '16:9' });
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  validate?: (value: unknown) => T | undefined
): [T, (updater: T | ((prev: T) => T)) => void, () => void] {
  const subscribe = useCallback(
    (callback: () => void) => {
      const handler = (e: StorageEvent) => {
        if (e.key === key) callback();
      };
      window.addEventListener('storage', handler);
      // Custom event for same-tab updates
      window.addEventListener(`ls:${key}`, callback);
      return () => {
        window.removeEventListener('storage', handler);
        window.removeEventListener(`ls:${key}`, callback);
      };
    },
    [key]
  );

  const getSnapshot = useCallback(() => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }, [key]);

  const getServerSnapshot = useCallback(() => null, []);

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value: T = (() => {
    if (raw === null) return defaultValue;
    try {
      const parsed = JSON.parse(raw);
      if (validate) {
        return validate(parsed) ?? defaultValue;
      }
      return parsed as T;
    } catch {
      return defaultValue;
    }
  })();

  const setValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      try {
        const current = (() => {
          const r = localStorage.getItem(key);
          if (r === null) return defaultValue;
          try {
            const p = JSON.parse(r);
            if (validate) return validate(p) ?? defaultValue;
            return p as T;
          } catch {
            return defaultValue;
          }
        })();
        const next =
          typeof updater === 'function'
            ? (updater as (prev: T) => T)(current)
            : updater;
        localStorage.setItem(key, JSON.stringify(next));
        window.dispatchEvent(new Event(`ls:${key}`));
      } catch {}
    },
    [key, defaultValue, validate]
  );

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(key);
      window.dispatchEvent(new Event(`ls:${key}`));
    } catch {}
  }, [key]);

  return [value, setValue, reset];
}
