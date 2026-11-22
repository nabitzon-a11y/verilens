import 'server-only';
import { requireUser } from './auth';
import { HttpError } from './http';

const DEFAULT_ADMINS = ['psk7522', 'demo_pioneer'];

export function isAdminUsername(username: string): boolean {
  const raw = process.env.ADMIN_USERNAMES?.trim();
  const list = raw
    ? raw
        .split(',')
        .map((s) => s.trim().replace(/^@/, '').toLowerCase())
        .filter(Boolean)
    : DEFAULT_ADMINS;
  return list.includes(username.trim().replace(/^@/, '').toLowerCase());
}

export async function requireAdmin(req: Request) {
  const ctx = await requireUser(req);
  if (!isAdminUsername(ctx.user.username)) {
    throw new HttpError(403, `관리자 권한이 없습니다. (@${ctx.user.username})`, 'FORBIDDEN');
  }
  return ctx;
}
