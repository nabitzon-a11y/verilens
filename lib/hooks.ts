'use client';

import { useEffect, useState } from 'react';

/** intervalMs 마다 현재 시각(ms)을 갱신 — 카운트다운 표시용 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
