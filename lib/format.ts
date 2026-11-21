/** 화면 표시용 포맷터 (클라이언트/서버 공용) */

export function formatPi(value: number, digits = 3): string {
  return `${value.toFixed(digits)} π`;
}

export function formatSignedPi(value: number, digits = 3): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)} π`;
}

/** ms → mm:ss */
export function formatMmSs(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function errorMessage(err: unknown, fallback = '알 수 없는 오류가 발생했습니다.'): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
