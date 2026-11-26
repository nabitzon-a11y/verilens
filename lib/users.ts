import 'server-only';
import type { PioneerProfile, PioneerUser } from '@/types';
import { TRUST, clampTrust, getTrustTier } from './constants';
import { getRepository } from './repository';

/** 구버전(0~100) 신뢰도 사용자를 1000점 체계로 1회 환산 (멱등) */
export function migrateTrust(user: PioneerUser): PioneerUser {
  if (user.trustScale === TRUST.SCALE) return user;
  return {
    ...user,
    trustScore: clampTrust(user.trustScore * TRUST.LEGACY_MULTIPLIER),
    trustScale: TRUST.SCALE,
  };
}

export async function getOrCreateUser(uid: string, username: string, isDemo: boolean): Promise<PioneerUser> {
  const repo = getRepository();
  const now = new Date().toISOString();
  const existing = await repo.getUser(uid);

  if (existing) {
    const migrated = migrateTrust(existing);
    if (existing.username === username && migrated === existing) return existing;
    return repo.upsertUser({ ...migrated, username, updatedAt: now });
  }

  return repo.upsertUser({
    uid,
    username,
    isDemo,
    trustScore: TRUST.INITIAL,
    trustScale: TRUST.SCALE,
    streak: 0,
    balance: 0,
    totalEarned: 0,
    totalClaimed: 0,
    setsCompleted: 0,
    botFlags: 0,
    createdAt: now,
    updatedAt: now,
  });
}

export function toProfile(raw: PioneerUser): PioneerProfile {
  const user = migrateTrust(raw);
  const tier = getTrustTier(user.trustScore);
  return {
    uid: user.uid,
    username: user.username,
    isDemo: user.isDemo,
    trustScore: user.trustScore,
    streak: user.streak,
    balance: user.balance,
    totalEarned: user.totalEarned,
    totalClaimed: user.totalClaimed,
    setsCompleted: user.setsCompleted,
    tier: tier.tier,
    tierLabel: tier.label,
    freeSubmitTickets: user.freeSubmitTickets ?? 0,
  };
}
