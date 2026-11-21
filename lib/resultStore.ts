import type { SetResult } from '@/types';

/** 마지막 세트 결과를 탭 세션에 보관 (/verify → /verify/result 전달용) */
const KEY = 'vl_last_result';

export function saveLastResult(result: SetResult): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(result));
  } catch {
    /* 무시 */
  }
}

export function loadLastResult(): SetResult | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SetResult) : null;
  } catch {
    return null;
  }
}
