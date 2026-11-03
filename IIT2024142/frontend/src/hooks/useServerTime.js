import { useEffect, useRef } from "react";

// Module-level offset so it's shared across all hook instances
let _serverOffsetMs = 0;
let _synced = false;

/**
 * Returns the current server UTC time in milliseconds.
 * Falls back to Date.now() until the first sync completes.
 */
export function getServerNow() {
  return Date.now() + _serverOffsetMs;
}

/**
 * Hook that syncs the client clock to the server once per app session.
 * Call it once near the top of your app (e.g. App.jsx or a layout component).
 */
export function useServerTime() {
  const hasSynced = useRef(_synced);

  useEffect(() => {
    if (hasSynced.current) return;

    const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    async function sync() {
      try {
        const t0 = Date.now();
        const res = await fetch(`${BACKEND}/api/time`);
        const t1 = Date.now();
        const { utc } = await res.json();
        // Compensate for half the round-trip latency
        const serverNow = utc + (t1 - t0) / 2;
        _serverOffsetMs = serverNow - t1;
        _synced = true;
        hasSynced.current = true;
      } catch {
        // Network failure → keep offset = 0 (use local clock as fallback)
        console.warn("[useServerTime] Could not sync to server clock; using local time.");
      }
    }

    sync();
  }, []);
}
