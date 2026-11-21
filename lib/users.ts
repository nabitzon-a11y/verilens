import 'server-only';
import type { PioneerProfile, PioneerUser } from '@/types';
import { TRUST, getTrustTier } from './constants';
import { getRepository } from './repository';

export async function getOrCreateUser(uid: string, username: string, isDemo: boolean): Promise<PioneerUser> {
  const repo = getRepository();
  const now = new Date().toISOString();
  const existing = await repo.getUser(uid);

  if (existing) {
    if (existing.username === username) return existing;
    return repo.upsertUser({ ...existing, username, updatedAt: now });
  }

  return repo.upsertUser({
    uid,
    username,
    isDemo,
    trustScore: TRUST.INITIAL,
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

export function toProfile(user: PioneerUser): PioneerProfile {
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
  };
}
