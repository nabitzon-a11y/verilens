import type { AdminOverviewResponse } from '@/types';
import { requireAdmin } from '@/lib/admin';
import { GAME } from '@/lib/constants';
import { ok, withErrorHandling } from '@/lib/http';
import { getRepository } from '@/lib/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 관리자 전용 통계 · 유저 · 의뢰 문항 현황 */
export const GET = withErrorHandling(async (req) => {
  await requireAdmin(req);
  const repo = getRepository();

  const [users, requesterMissions, sets, ledger] = await Promise.all([
    repo.listUsers(),
    repo.listMissions({ origin: 'requester' }),
    repo.listSets(),
    repo.listAllLedger(),
  ]);

  const voteLists = await Promise.all(requesterMissions.map((m) => repo.getVotes(m.id)));

  let totalVotes = 0;
  const missionItems = requesterMissions
    .map((m, idx) => {
      const votes = voteLists[idx];
      const a = votes.filter((c) => c === 'A').length;
      const b = votes.filter((c) => c === 'B').length;
      totalVotes += votes.length;
      const consensus =
        votes.length >= GAME.CONSENSUS_PANEL_SIZE && a !== b ? (a > b ? ('A' as const) : ('B' as const)) : null;

      return {
        id: m.id,
        prompt: m.prompt,
        kind: m.kind,
        mode: m.mode,
        status: m.status,
        requesterUid: m.requesterUid,
        votes: { A: a, B: b },
        reports: m.reportCount ?? 0,
        consensus,
        createdAt: m.createdAt,
      };
    })
    .sort((x, y) => {
      if (y.reports !== x.reports) return y.reports - x.reports;
      if (x.status !== y.status) return x.status === 'active' ? -1 : 1;
      return y.createdAt.localeCompare(x.createdAt);
    });

  const u2aRevenuePi = ledger
    .filter((e) => e.type === 'submission_payment' && e.status === 'settled')
    .reduce((acc, e) => acc + Math.abs(e.amount), 0);
  const a2uRewardedPi = ledger
    .filter((e) => e.type === 'reward' && e.status === 'settled')
    .reduce((acc, e) => acc + Math.max(0, e.amount), 0);
  const a2uClaimedPi = ledger
    .filter((e) => e.type === 'claim' && e.status === 'settled')
    .reduce((acc, e) => acc + Math.abs(e.amount), 0);

  const recentUsers = [...users]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 20)
    .map((u) => ({
      uid: u.uid,
      username: u.username,
      isDemo: u.isDemo,
      trustScore: u.trustScore,
      setsCompleted: u.setsCompleted,
      balance: u.balance,
      botFlags: u.botFlags,
      updatedAt: u.updatedAt,
    }));

  const payload: AdminOverviewResponse = {
    summary: {
      totalUsers: users.length,
      piUsers: users.filter((u) => !u.isDemo).length,
      demoUsers: users.filter((u) => u.isDemo).length,
      totalSets: sets.length,
      completedSets: sets.filter((s) => !!s.submittedAt).length,
      totalMissions: missionItems.length,
      activeMissions: missionItems.filter((m) => m.status === 'active').length,
      closedMissions: missionItems.filter((m) => m.status === 'closed').length,
      reportedMissions: missionItems.filter((m) => m.reports > 0).length,
      totalVotes,
      u2aRevenuePi: Number(u2aRevenuePi.toFixed(4)),
      a2uRewardedPi: Number(a2uRewardedPi.toFixed(4)),
      a2uClaimedPi: Number(a2uClaimedPi.toFixed(4)),
    },
    recentUsers,
    requesterMissions: missionItems,
  };

  return ok(payload);
});
