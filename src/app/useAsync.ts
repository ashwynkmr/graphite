import { useCallback, useEffect, useState } from 'react';

/** Runs an async loader on mount (and when deps change); `reload` runs it again. */
export function useAsync<T>(load: () => Promise<T>, deps: unknown[] = []): { data: T | undefined; reload: () => void } {
  const [data, setData] = useState<T>();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    load().then((v) => live && setData(v));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, reload };
}
