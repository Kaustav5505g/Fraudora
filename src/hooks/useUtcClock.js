import { useState, useEffect } from 'react';

/**
 * useUtcClock — returns a live UTC timestamp string formatted as
 * "UTC YYYY-MM-DD HH:MM:SS", updating every second.
 * Uses Date.toISOString() slicing — no libraries needed.
 * Cleans up interval on unmount.
 *
 * @returns {string} formatted UTC clock string
 */
export function useUtcClock() {
  const [clock, setClock] = useState(() => formatUtc());

  useEffect(() => {
    const id = setInterval(() => setClock(formatUtc()), 1000);
    return () => clearInterval(id);
  }, []);

  return clock;
}

/** Slice ISO string: "2024-05-01T14:32:00.000Z" → "UTC 2024-05-01 14:32:00" */
function formatUtc() {
  const iso = new Date().toISOString(); // e.g. "2024-05-01T14:32:00.123Z"
  const date = iso.slice(0, 10);        // "2024-05-01"
  const time = iso.slice(11, 19);       // "14:32:00"
  return `UTC ${date} ${time}`;
}
