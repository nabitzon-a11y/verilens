'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Coins,
  FileText,
  ImagePlus,
  Image as ImageIcon,
  Info,
  Loader2,
  Lock,
  ScanFace,
  Sparkles,
  Upload,
} from 'lucide-react';
import clsx from 'clsx';
import type { DraftResponse, MissionKind, MissionMode, MyMissionItem, PaymentCompleteResponse } from '@/types';
import { useApp } from '@/components/AppProvider';
import { LoginPanel } from '@/components/LoginPanel';
import { api } from '@/lib/apiClient';
import { GAME, WALLET } from '@/lib/constants';
import { errorMessage, formatDateTime } from '@/lib/format';
import { ACCEPTED_IMAGE_TYPES, compressImage } from '@/lib/image';
import { paySubmissionFee } from '@/lib/piSdk';

type Stage = 'creating' | 'approving' | 'signing' | 'completing';

const STAGE_LABEL: Record<Stage | 'draft', string> = {
  draft: '문항 저장 중…',
  creating: '결제 생성 중…',
  approving: '서버 결제 승인 중…',
  signing: '지갑 서명 대기 중…',
  completing: '블록체인 완료 확인 중…',
};

const TEXT_MIN = 10;
const TEXT_MAX = 600;

const PROMPT_PRESETS: Record<MissionMode, Record<MissionKind, readonly string[]>> = {
  single: {
    text: [
      '이 글은 실제 사람이 썼을까요, AI가 썼을까요?',
      '실제 구매자 후기일까요, AI 생성 리뷰일까요?',
      '이 글에서 AI 특유의 부자연스러움이 느껴지나요?',
    ],
    image: [
      '이 이미지는 실제 원본일까요, AI 생성물일까요?',
      '실제 카메라 촬영 사진일까요, 합성 이미지일까요?',
    ],
  },
  compare: {
    text: [
      '어느 쪽이 실제 사람이 직접 쓴 글일까요?',
      '실제 경험에 기반한 후기는 어느 쪽인가요?',
      'AI가 지어내지 않은 자연스러운 글은?',
    ],
    image: [
      '어느 쪽이 AI가 만들지 않은 원본 장면일까요?',
      '실제 카메라로 찍은 사진은 어느 쪽인가요?',
      '합성 흔적이 없는 자연스러운 이미지는?',
    ],
  },
};

const SOURCE_PRESETS = ['뉴스 기사', '배달앱 리뷰', '쇼핑몰 상품평', 'SNS 게시글', '커뮤니티 답변', '카페/식당 후기'] as const;

const TEXT_SAMPLES = {
  ko: {
    single: {
      prompt: '실제 구매자 후기일까요, AI 생성 리뷰일까요?',
      sourceLabel: '쇼핑몰 상품평',
      a: '비 오는 날 출근길에 처음 신어봤는데 발목 뒤꿈치가 살짝 쓸리긴 해도 방수는 확실히 되네요. 다만 바닥이 생각보다 미끄러워서 지하철 계단 내려갈 땐 조심해야 할 듯합니다.',
    },
    compare: {
      prompt: '어느 쪽이 실제 사람이 직접 쓴 글일까요?',
      sourceLabel: '배달앱 리뷰',
      a: '김치찌개 국물이 진해서 밥 두 공기 뚝딱했어요. 다만 계란말이가 조금 식어서 온 건 아쉽네요. 다음엔 매장 가서 먹어보려고요.',
      b: '신선한 재료와 정성스러운 조리가 어우러져 최고의 맛을 선사합니다. 깔끔한 포장과 신속한 배달 서비스까지 완벽한 만족감을 경험하실 수 있습니다.',
    },
  },
  en: {
    single: {
      prompt: 'Is this a real buyer review or AI-generated?',
      sourceLabel: 'Product Review',
      a: 'Wore these on my rainy commute today—waterproofing held up great, though the heel rubbed a bit on the first mile. Watch out on wet subway stairs since the sole feels slightly slick.',
    },
    compare: {
      prompt: 'Which one was written by a real human?',
      sourceLabel: 'Delivery Review',
      a: 'Broth was rich enough that I finished two bowls of rice. The rolled omelet arrived a little lukewarm, which was a minor letdown, so I will dine in next time.',
      b: 'Fresh ingredients and meticulous preparation combine to deliver an extraordinary culinary experience. Clean packaging and prompt delivery ensure complete satisfaction.',
    },
  },
} as const;

/** 두 텍스트의 유사도 (0~1, 2글자 바이그램 Jaccard) */
function textSimilarity(a: string, b: string): number {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '');
  const s1 = norm(a);
  const s2 = norm(b);
  if (s1.length < 4 || s2.length < 4) return 0;
  const bigrams = (s: string) => {
    const set = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
    return set;
  };
  const b1 = bigrams(s1);
  const b2 = bigrams(s2);
  let inter = 0;
  b1.forEach((g) => {
    if (b2.has(g)) inter++;
  });
  return inter / (b1.size + b2.size - inter);
}

export default function SubmitPage() {
  const { ready, profile, paymentsMode, refresh, lang } = useApp();
  const en = lang === 'en';

  const [mode, setMode] = useState<MissionMode>('single');
  const [kind, setKind] = useState<MissionKind>('text');
  const [prompt, setPrompt] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [imageA, setImageA] = useState<string | null>(null);
  const [imageB, setImageB] = useState<string | null>(null);
  const [rightsAgreed, setRightsAgreed] = useState(false);

  /** 결제 실패/취소 시 같은 draft 로 재시도 (내용이 바뀌면 초기화) */
  const [draftId, setDraftId] = useState<string | null>(null);
  const [busy, setBusy] = useState<Stage | 'draft' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<PaymentCompleteResponse | null>(null);
  const [mine, setMine] = useState<MyMissionItem[] | null>(null);

  const loadMine = useCallback(async () => {
    try {
      setMine(await api<MyMissionItem[]>('/api/missions/mine'));
    } catch {
      setMine([]);
    }
  }, []);

  useEffect(() => {
    if (profile) void loadMine();
  }, [profile, loadMine]);

  const touch = () => {
    setDraftId(null);
    setError(null);
  };

  const fillSample = () => {
    const sample = TEXT_SAMPLES[en ? 'en' : 'ko'][mode];
    setPrompt(sample.prompt);
    setSourceLabel(sample.sourceLabel);
    setTextA(sample.a);
    if (mode === 'compare' && 'b' in sample) {
      setTextB(sample.b);
    }
    touch();
  };

  if (!ready) return <Spinner />;
  if (!profile) return <LoginPanel title={en ? 'Sign in to submit an item' : '문항을 의뢰하려면 로그인하세요'} />;

  const isMockPayment = paymentsMode === 'mock' || profile.isDemo;
  const tooSimilar =
    mode === 'compare' &&
    kind === 'text' &&
    textA.trim().length >= TEXT_MIN &&
    textB.trim().length >= TEXT_MIN &&
    textA.trim() !== textB.trim() &&
    textSimilarity(textA, textB) >= 0.68;

  const closeMission = async (missionId: string) => {
    try {
      await api('/api/missions/close', { body: { missionId } });
      await loadMine();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const validation = (() => {
    if (kind === 'text') {
      if (textA.trim().length < TEXT_MIN) {
        return en ? `Text must be at least ${TEXT_MIN} characters.` : `텍스트를 ${TEXT_MIN}자 이상 입력하세요.`;
      }
      if (mode === 'compare') {
        if (textB.trim().length < TEXT_MIN) {
          return en ? `Both A and B must be at least ${TEXT_MIN} characters.` : `A와 B 모두 ${TEXT_MIN}자 이상 입력하세요.`;
        }
        if (textA.trim() === textB.trim()) return en ? 'A and B must be different.' : 'A와 B에 서로 다른 내용을 입력하세요.';
      }
    } else {
      if (!imageA) return en ? 'Please upload an image.' : '이미지를 올려 주세요.';
      if (mode === 'compare') {
        if (!imageB) return en ? 'Please upload both Image A and B.' : '이미지 A와 B를 모두 올려 주세요.';
        if (imageA === imageB) return en ? 'Please upload two different images.' : '서로 다른 이미지를 올려 주세요.';
      }
    }
    if (!rightsAgreed) return en ? 'Please agree to the copyright & rights warranty.' : '저작권 및 사용 권한 동의에 체크해 주세요.';
    return null;
  })();

  const submit = async () => {
    if (validation || busy) return;
    setError(null);
    try {
      let id = draftId;
      if (!id) {
        setBusy('draft');
        const body =
          kind === 'text'
            ? {
                kind,
                mode,
                prompt: prompt.trim() || undefined,
                sourceLabel: sourceLabel.trim() || undefined,
                a: textA.trim(),
                ...(mode === 'compare' ? { b: textB.trim() } : {}),
              }
            : {
                kind,
                mode,
                prompt: prompt.trim() || undefined,
                a: imageA,
                ...(mode === 'compare' ? { b: imageB } : {}),
              };
        const draft = await api<DraftResponse>('/api/missions/draft', { body });
        id = draft.draftId;
        setDraftId(id);
      }

      const result = await paySubmissionFee({
        draftId: id,
        paymentsMode,
        isDemoUser: profile.isDemo,
        onStage: setBusy,
      });

      setDone(result);
      setDraftId(null);
      void refresh();
      void loadMine();
    } catch (err) {
      setError(errorMessage(err, '등록에 실패했습니다.'));
    } finally {
      setBusy(null);
    }
  };

  const reset = () => {
    setDone(null);
    setPrompt('');
    setSourceLabel('');
    setTextA('');
    setTextB('');
    setImageA(null);
    setImageB(null);
    setRightsAgreed(false);
    setDraftId(null);
  };

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <h1 className="text-2xl font-black text-slate-900">{en ? 'Submit for Verification' : '판별 의뢰하기'}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          {en ? (
            <>
              Submit content and KYC-verified verifiers will determine the label via{' '}
              <b className="text-brand">{GAME.CONSENSUS_PANEL_SIZE}-human consensus</b> (auto-closes at {GAME.REQUESTER_TARGET_VOTES} votes).
            </>
          ) : (
            <>
              검수가 필요한 콘텐츠를 올리면 KYC 인증된 판별자들의 <b className="text-brand">{GAME.CONSENSUS_PANEL_SIZE}인 다수결</b>로 라벨이 확정되며, {GAME.REQUESTER_TARGET_VOTES}표가 모이면 자동 마감됩니다.
            </>
          )}
        </p>
      </header>

      {/* 출제 기준 가이드 */}
      <div className="flex gap-2.5 rounded-2xl border border-brand/20 bg-brand-soft/60 p-3.5 text-sm leading-relaxed text-slate-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <p>
          {en ? (
            <>
              <b className="text-slate-900">Submission Tips:</b> Include 2–4 sentences with tone, context, or lived details so human verifiers can judge clearly. Single-line plain facts can split votes.
            </>
          ) : (
            <>
              <b className="text-slate-900">좋은 의뢰 기준:</b> 단순 팩트 1줄보다 <b>화법·문맥·디테일 차이</b>가 드러나는 2~4문장을 올리셔야 다수결이 모입니다. 애매한 문항은 아래 현황에서 언제든 <b>마감</b>할 수 있어요.
            </>
          )}
        </p>
      </div>

      {done ? (
        <section className="card space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-human-dark" strokeWidth={1.5} />
          <div>
            <h2 className="text-xl font-bold text-slate-900">{en ? 'Added to Verification Pool' : '판별 풀에 등록되었습니다'}</h2>
            <p className="mt-1.5 text-sm text-slate-600">
              {WALLET.SUBMISSION_FEE_PI} Test-Pi {en ? 'payment completed' : '결제 완료'}
              {done.mock ? ' (Mock)' : ''} · {en ? 'Live in the next verification set.' : '다음 판별 세트부터 바로 노출됩니다.'}
            </p>
            <p className="mt-2 break-all font-mono text-xs text-slate-400">{done.paymentId}</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Link href="/verify" className="btn-primary">
              <ScanFace className="h-4 w-4" />
              {en ? 'Go Verify' : '판별하러 가기'}
            </Link>
            <button type="button" className="btn-ghost" onClick={reset}>
              {en ? 'Submit Another' : '새 문항 등록'}
            </button>
          </div>
        </section>
      ) : (
        <section className="card space-y-4">
          {/* 의뢰 방식: 단일 감별(1개) vs 비교(2개) */}
          <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1">
            {(
              [
                { id: 'single' as const, ko: '단일 감별 (1개)', en: 'Single Check (1)' },
                { id: 'compare' as const, ko: 'A/B 비교 (2개)', en: 'A/B Compare (2)' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setMode(opt.id);
                  touch();
                }}
                className={clsx(
                  'rounded-lg py-2.5 text-sm font-semibold transition',
                  mode === opt.id ? 'bg-white text-brand shadow-sm' : 'text-slate-600 hover:text-slate-900',
                )}
              >
                {en ? opt.en : opt.ko}
              </button>
            ))}
          </div>

          {/* 유형 */}
          <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1">
            {(['text', 'image'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setKind(k);
                  touch();
                }}
                className={clsx(
                  'flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition',
                  kind === k ? 'bg-brand text-white shadow-sm' : 'text-slate-600 hover:text-slate-900',
                )}
              >
                {k === 'text' ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                {k === 'text' ? (en ? 'Text' : '텍스트') : en ? 'Image' : '이미지'}
              </button>
            ))}
          </div>

          {kind === 'text' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={fillSample}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/15"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {en ? 'Fill Sample Text' : '예시 문장 자동 채우기'}
              </button>
            </div>
          )}

          <Field label={en ? 'Question (optional)' : '질문 (선택)'}>
            <input
              value={prompt}
              maxLength={80}
              onChange={(e) => {
                setPrompt(e.target.value);
                touch();
              }}
              placeholder={PROMPT_PRESETS[mode][kind][0]}
              className="input"
            />
            <PresetChips
              options={PROMPT_PRESETS[mode][kind]}
              value={prompt}
              onPick={(v) => {
                setPrompt(v);
                touch();
              }}
            />
          </Field>

          {kind === 'text' ? (
            <>
              <Field label={en ? 'Source Label (optional)' : '출처 형식 (선택)'}>
                <input
                  value={sourceLabel}
                  maxLength={30}
                  onChange={(e) => {
                    setSourceLabel(e.target.value);
                    touch();
                  }}
                  placeholder={en ? 'e.g. Product Review, News' : '예: 쇼핑몰 상품평, 뉴스 기사'}
                  className="input"
                />
                <PresetChips
                  options={SOURCE_PRESETS}
                  value={sourceLabel}
                  onPick={(v) => {
                    setSourceLabel(v);
                    touch();
                  }}
                />
              </Field>
              {(mode === 'single' ? (['A'] as const) : (['A', 'B'] as const)).map((side) => {
                const value = side === 'A' ? textA : textB;
                const label =
                  mode === 'single'
                    ? en
                      ? 'Content to Verify'
                      : '감별할 텍스트'
                    : en
                      ? `Content ${side}`
                      : `콘텐츠 ${side}`;
                return (
                  <Field key={side} label={label} hint={`${value.trim().length} / ${TEXT_MAX}`}>
                    <textarea
                      value={value}
                      maxLength={TEXT_MAX}
                      rows={4}
                      onChange={(e) => {
                        (side === 'A' ? setTextA : setTextB)(e.target.value);
                        touch();
                      }}
                      placeholder={en ? `Enter text (${TEXT_MIN}+ chars)` : `검수할 텍스트 (${TEXT_MIN}자 이상)`}
                      className="input resize-none leading-relaxed"
                    />
                  </Field>
                );
              })}
            </>
          ) : (
            <div className={clsx('grid gap-3', mode === 'single' ? 'grid-cols-1' : 'grid-cols-2')}>
              {(mode === 'single' ? (['A'] as const) : (['A', 'B'] as const)).map((side) => (
                <ImageSlot
                  key={side}
                  side={mode === 'single' ? undefined : side}
                  value={side === 'A' ? imageA : imageB}
                  onChange={(v) => {
                    (side === 'A' ? setImageA : setImageB)(v);
                    touch();
                  }}
                  onError={setError}
                />
              ))}
            </div>
          )}

          {/* 결제 */}
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
            <Coins className="h-6 w-6 shrink-0 text-pi-light" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-pi-light">
                {en ? `Submission Fee: ${WALLET.SUBMISSION_FEE_PI} Test-Pi` : `등록 수수료 ${WALLET.SUBMISSION_FEE_PI} Test-Pi`}
              </p>
              <p className="text-xs text-slate-600">{en ? 'Published immediately upon payment.' : '결제 완료 즉시 판별 풀에 등록됩니다.'}</p>
            </div>
            <span className={clsx('chip', isMockPayment ? 'bg-white text-slate-700' : 'bg-emerald-50 text-human-dark')}>
              {isMockPayment ? 'Mock' : 'Pi Testnet'}
            </span>
          </div>

          {/* 저작권·권리 보증 동의 */}
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-700">
            <input
              type="checkbox"
              checked={rightsAgreed}
              onChange={(e) => setRightsAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded accent-brand"
            />
            <span>
              {en ? (
                <>
                  I confirm I hold the copyright/license for this content (excerpt only, no infringing material) and accept responsibility under the{' '}
                  <Link href="/terms" className="font-semibold text-brand underline">
                    Terms
                  </Link>
                  .
                </>
              ) : (
                <>
                  등록하는 텍스트(발췌본)·이미지의 저작권 및 사용 권한을 보유하고 있으며, 권리 침해 시 책임이 의뢰자에게 있음을 확인합니다. (
                  <Link href="/terms" className="font-semibold text-brand underline">
                    이용약관
                  </Link>
                  )
                </>
              )}
            </span>
          </label>

          {tooSimilar && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm leading-relaxed text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-pi-light" />
              <p>
                {en
                  ? 'A and B look very similar and may be ambiguous for verifiers. Consider highlighting clearer differences or using Single Check.'
                  : 'A와 B 문장이 너무 비슷해 판별자들이 헷갈릴 수 있습니다. 차이를 조금 더 분명히 적거나 [단일 감별]을 이용해 보세요.'}
              </p>
            </div>
          )}

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          {!error && validation && (textA || textB || imageA || imageB) && (
            <p className="text-center text-xs text-slate-500">{validation}</p>
          )}

          <button type="button" className="btn-amber w-full py-4 text-base" onClick={submit} disabled={!!validation || !!busy}>
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />}
            {busy
              ? STAGE_LABEL[busy]
              : en
                ? `Pay ${WALLET.SUBMISSION_FEE_PI} Test-Pi & Submit`
                : `${WALLET.SUBMISSION_FEE_PI} Test-Pi 결제 및 등록`}
          </button>
          {draftId && !busy && (
            <p className="text-center text-xs text-slate-500">
              {en ? 'Retrying payment with your saved draft.' : '저장된 문항으로 결제를 다시 시도합니다.'}
            </p>
          )}
        </section>
      )}

      {/* 내 의뢰 현황 */}
      <section className="space-y-2.5">
        <p className="label px-1">{en ? 'My Submissions' : '내 의뢰 현황'}</p>
        {mine === null ? (
          <Spinner small />
        ) : mine.length === 0 ? (
          <p className="card text-center text-sm text-slate-500">
            {en ? 'No submissions yet.' : '아직 의뢰한 문항이 없습니다.'}
          </p>
        ) : (
          mine.map((m) => <MyMissionRow key={m.id} m={m} en={en} onClose={closeMission} />)
        )}
      </section>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm font-medium text-slate-700">
        <span>{label}</span>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function PresetChips({
  options,
  value,
  onPick,
}: {
  options: readonly string[];
  value: string;
  onPick: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 pt-0.5">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onPick(active ? '' : opt)}
            className={clsx(
              'rounded-full border px-3 py-1 text-xs transition',
              active
                ? 'border-brand bg-brand-soft font-semibold text-brand'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-brand/40 hover:text-slate-900',
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function ImageSlot({
  side,
  value,
  onChange,
  onError,
}: {
  side?: 'A' | 'B';
  value: string | null;
  onChange: (v: string | null) => void;
  onError: (msg: string | null) => void;
}) {
  const [loading, setLoading] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setLoading(true);
    onError(null);
    try {
      onChange(await compressImage(file));
    } catch (err) {
      onError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <label className="relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-brand/50">
      {side && (
        <span className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/75 text-xs font-black text-white">
          {side}
        </span>
      )}
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      ) : value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt={`업로드 이미지 ${side ?? ''}`} className="h-full w-full object-cover" />
      ) : (
        <>
          <ImagePlus className="h-7 w-7" />
          <span className="mt-1.5 text-xs">{side ? `이미지 ${side} 선택` : '이미지 선택'}</span>
        </>
      )}
      {value && !loading && (
        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-slate-900/75 px-2.5 py-0.5 text-xs text-white">
          <Upload className="h-3 w-3" />
          변경
        </span>
      )}
      <input
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        className="sr-only"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </label>
  );
}

const STATUS_STYLE: Record<MyMissionItem['status'], { label: string; cls: string }> = {
  draft: { label: '결제 대기', cls: 'bg-amber-50 text-pi-light' },
  active: { label: '판별 중', cls: 'bg-emerald-50 text-human-dark' },
  closed: { label: '종료', cls: 'bg-slate-100 text-slate-600' },
};

function MyMissionRow({
  m,
  en,
  onClose,
}: {
  m: MyMissionItem;
  en: boolean;
  onClose: (id: string) => Promise<void>;
}) {
  const [closing, setClosing] = useState(false);
  const total = m.votes.A + m.votes.B;
  const s = STATUS_STYLE[m.status];
  const isSingle = m.mode === 'single';

  const handleClose = async () => {
    setClosing(true);
    try {
      await onClose(m.id);
    } finally {
      setClosing(false);
    }
  };

  return (
    <article className="card space-y-2 py-3.5">
      <div className="flex items-center gap-2">
        {m.kind === 'text' ? <FileText className="h-4 w-4 text-slate-400" /> : <ImageIcon className="h-4 w-4 text-slate-400" />}
        <p className="flex-1 truncate text-base font-medium text-slate-900">{m.prompt}</p>
        <span className={clsx('chip', s.cls)}>{s.label}</span>
        {m.status === 'active' && (
          <button
            type="button"
            disabled={closing}
            onClick={() => void handleClose()}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            {closing ? '…' : en ? 'Close' : '마감'}
          </button>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{formatDateTime(m.createdAt)}</span>
        <span>
          {en ? 'Votes' : '실제 응답'} {total}/{GAME.REQUESTER_TARGET_VOTES} (
          {isSingle ? `${en ? 'Human' : '인간'} ${m.votes.A} · AI ${m.votes.B}` : `A ${m.votes.A} · B ${m.votes.B}`})
          {m.consensus && (
            <b className="ml-1 text-brand">
              → {isSingle ? (m.consensus === 'A' ? (en ? 'Human' : '인간 원본') : 'AI') : `${en ? 'Original' : '인간 원본'} ${m.consensus}`}
            </b>
          )}
        </span>
      </div>
    </article>
  );
}

function Spinner({ small }: { small?: boolean }) {
  return (
    <div className={clsx('flex justify-center text-slate-500', small ? 'py-6' : 'py-24')}>
      <Loader2 className="h-6 w-6 animate-spin text-brand" />
    </div>
  );
}
