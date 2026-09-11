import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, MaterialIcon, ProgressBar, WipBadge } from '../../components/common';
import { PageContainer } from '../../components/layout';
import useCountUp from '../../hooks/useCountUp';
import { api } from '../../services/api';
import { getAccessToken } from '../../services/authStorage';
import './AiReport.css';

const SIDE_ITEMS = [
  { id: 'overview', icon: 'overview', label: '한눈에' },
  { id: 'portfolio', icon: 'description', label: '돈 흐름' },
  { id: 'risk', icon: 'settings_applications', label: '조심할 점', wip: true },
  { id: 'audit', icon: 'history', label: '지난 기록', wip: true },
  { id: 'security', icon: 'shield', label: '보안', wip: true },
];

const CATEGORY_ICONS = {
  식비: 'restaurant',
  카페: 'local_cafe',
  교통: 'directions_car',
  주거: 'home',
  쇼핑: 'shopping_bag',
  구독: 'subscriptions',
  통신: 'phonelink_ring',
  의료: 'medical_services',
  대출: 'account_balance',
  소비: 'payments',
};

function formatWon(value) {
  if (value == null || !Number.isFinite(Number(value))) return '-';
  return `₩${Math.round(Number(value)).toLocaleString('ko-KR')}`;
}

function difficultyClass(label) {
  if (label === '어려움' || label === '보통') {
    return 'bg-signal-advisory-subtle text-signal-advisory';
  }
  return 'bg-signal-positive-subtle text-primary';
}

function mapSavingsRows(recommendations = []) {
  return recommendations.map((item, index) => ({
    key: `${item.category}-${index}`,
    icon: CATEGORY_ICONS[item.category] || 'tune',
    category: item.category || item.title || '절감',
    detail: item.detail || item.title || '',
    amount: formatWon(item.estimatedMonthlySaving),
    saving: Number(item.estimatedMonthlySaving) || 0,
    difficulty: item.difficulty || '쉬움',
    difficultyClass: difficultyClass(item.difficulty || '쉬움'),
  }));
}

function mapProblems(evaluation) {
  const tops = evaluation?.summary?.topCategories || [];
  if (tops.length > 0) {
    return tops.slice(0, 3).map((item, index) => ({
      number: String(index + 1).padStart(2, '0'),
      title: `${item.category} 지출 점검`,
      desc: `${item.category}에 ${Number(item.amount || 0).toLocaleString('ko-KR')}원을 썼어요.`,
      variant: index === 0 ? 'risk' : index === 1 ? 'advisory' : 'default',
      badge: index === 0 ? '위험' : index === 1 ? '경고' : '권고',
    }));
  }
  if (evaluation?.insight) {
    return [
      {
        number: '01',
        title: '한눈에 본 포인트',
        desc: evaluation.insight,
        variant: 'advisory',
        badge: '권고',
      },
    ];
  }
  return [];
}

/** Build chart bars from evaluation categories or recommendation savings — never fake months. */
function buildChartBars(evaluation, recommendations = []) {
  const tops = evaluation?.summary?.topCategories || [];
  if (tops.length > 0) {
    const max = Math.max(...tops.map((t) => Number(t.amount) || 0), 1);
    return tops.slice(0, 6).map((item, index) => {
      const amount = Number(item.amount) || 0;
      return {
        key: `cat-${item.category}-${index}`,
        label: item.category || `항목 ${index + 1}`,
        amount,
        heightPct: Math.max(10, Math.round((amount / max) * 100)),
        highlight: index === 0,
      };
    });
  }

  if (recommendations.length > 0) {
    const max = Math.max(...recommendations.map((r) => Number(r.estimatedMonthlySaving) || 0), 1);
    return recommendations.slice(0, 6).map((item, index) => {
      const amount = Number(item.estimatedMonthlySaving) || 0;
      return {
        key: `rec-${item.category || item.title}-${index}`,
        label: item.category || item.title || `권고 ${index + 1}`,
        amount,
        heightPct: Math.max(10, Math.round((amount / max) * 100)),
        highlight: index === 0,
      };
    });
  }

  return [];
}

const PROBLEM_STYLES = {
  risk: {
    border: 'hover:border-signal-risk/40',
    badge: 'bg-signal-risk-subtle text-signal-risk',
    num: 'bg-signal-risk/15 text-signal-risk',
  },
  advisory: {
    border: 'hover:border-signal-advisory/40',
    badge: 'bg-signal-advisory-subtle text-signal-advisory',
    num: 'bg-signal-advisory/15 text-signal-advisory',
  },
  default: {
    border: 'hover:border-secondary/40',
    badge: 'bg-secondary/15 text-secondary',
    num: 'bg-secondary/15 text-secondary',
  },
};

function SavingsTableBody({ isLoading, errorMessage, savingsRows, onRetry }) {
  if (isLoading) {
    return (
      <tr>
        <td colSpan={4} className="py-10 px-md text-center">
          <div className="flex flex-col items-center gap-sm text-on-surface-variant">
            <MaterialIcon name="progress_activity" className="text-primary text-headline-md animate-spin" />
            <span className="text-body-sm font-body-sm">절감 항목을 불러오는 중…</span>
          </div>
        </td>
      </tr>
    );
  }

  if (errorMessage === 'login') {
    return (
      <tr>
        <td colSpan={4} className="py-10 px-md text-center">
          <p className="text-body-sm font-body-sm text-on-surface-variant m-0 mb-md break-keep">
            로그인하면 이번 달 절감 가능 항목을 볼 수 있어요.
          </p>
          <Link to="/login">
            <Button variant="extruded" className="h-[44px] px-md">
              로그인하기
            </Button>
          </Link>
        </td>
      </tr>
    );
  }

  if (errorMessage) {
    return (
      <tr>
        <td colSpan={4} className="py-10 px-md text-center">
          <p className="text-body-sm font-body-sm text-signal-risk m-0 mb-md break-keep" role="alert">
            {errorMessage}
          </p>
          <Button variant="secondary" className="h-[44px] px-md" onClick={onRetry}>
            다시 시도
          </Button>
        </td>
      </tr>
    );
  }

  if (savingsRows.length === 0) {
    return (
      <tr>
        <td colSpan={4} className="py-10 px-md text-center text-body-sm font-body-sm text-on-surface-variant break-keep">
          아직 추천 절감 항목이 없어요. 가계부에 거래를 더 기록하면 분석이 풍부해져요.
        </td>
      </tr>
    );
  }

  return savingsRows.map((row) => (
    <tr
      key={row.key}
      className="border-b border-border-subtle last:border-b-0 hover:bg-surface-container/40 transition-colors"
    >
      <td className="py-4 px-md">
        <div className="flex items-center gap-2">
          <MaterialIcon name={row.icon} className="text-[18px] text-secondary" />
          <span className="text-editorial-sage-light">{row.category}</span>
        </div>
      </td>
      <td className="py-4 px-md text-on-surface-variant">{row.detail}</td>
      <td className="py-4 px-md text-right font-bold text-primary financial-value">{row.amount}</td>
      <td className="py-4 px-md text-center">
        <span className={`inline-block px-2 py-1 text-xs rounded font-label-caps ${row.difficultyClass}`}>
          {row.difficulty}
        </span>
      </td>
    </tr>
  ));
}

export default function AiReport() {
  const [sideTab, setSideTab] = useState('portfolio');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [pdfFeedback, setPdfFeedback] = useState('');
  const [shareFeedback, setShareFeedback] = useState('');

  const loadEvaluation = useCallback(async () => {
    setErrorMessage('');
    if (!getAccessToken()) {
      setEvaluation(null);
      setErrorMessage('login');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.runSpendingEvaluation({ period: 'monthly' });
      setEvaluation(result);
    } catch (error) {
      if (error?.status === 401) {
        setErrorMessage('login');
      } else if (error?.status === 502) {
        setErrorMessage('지금은 연결이 원활하지 않아요. 잠시 후 다시 시도해주세요.');
      } else {
        setErrorMessage(error?.message || '절감 항목을 불러오지 못했어요.');
      }
      setEvaluation(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvaluation();
  }, [loadEvaluation]);

  const savingsRows = mapSavingsRows(evaluation?.recommendations || []);
  const totalSaving = savingsRows.reduce((sum, row) => sum + row.saving, 0);
  const problems = mapProblems(evaluation);
  const chartBars = buildChartBars(evaluation, evaluation?.recommendations || []);
  const hasLoggedInData = !isLoading && errorMessage !== 'login' && !errorMessage;
  const savingDisplay = useCountUp(hasLoggedInData ? totalSaving : null);

  const handlePdfClick = () => {
    setPdfFeedback('준비 중');
    window.setTimeout(() => setPdfFeedback(''), 1800);
  };

  const handleShareClick = () => {
    setShareFeedback('준비 중');
    window.setTimeout(() => setShareFeedback(''), 1800);
  };

  const reportPeriodLabel = (() => {
    const now = new Date();
    return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}`;
  })();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-stretch antialiased min-w-0 bg-canvas-deep">
      <aside className="hidden md:flex flex-col w-64 shrink-0 self-stretch min-h-[calc(100vh-4rem)] sticky top-16 bg-surface-charcoal/90 border-r border-border-hairline py-md gap-sm z-40">
        <div className="px-md mb-md">
          <div className="flex items-center gap-sm mb-xs">
            <div className="w-8 h-8 rounded-DEFAULT bg-surface-architectural border border-border-hairline flex items-center justify-center text-primary">
              <MaterialIcon name="summarize" className="text-[20px]" />
            </div>
            <div>
              <h2 className="font-label-caps text-label-caps text-editorial-sage-light tracking-wider">한 장 요약</h2>
              <p className="text-label-sm font-label-sm text-on-surface-variant m-0">이번 달 돈 흐름</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-1 px-sm">
          {SIDE_ITEMS.map((item) => {
            const active = sideTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={item.wip}
                onClick={() => !item.wip && setSideTab(item.id)}
                className={
                  active
                    ? 'flex items-center gap-md px-md py-3 text-label-numeric font-label-numeric bg-primary-container text-on-primary-container rounded-lg mx-2 my-1 shadow-[0_2px_0_#0D6D43] disabled:opacity-50 disabled:cursor-not-allowed'
                    : 'flex items-center gap-md px-md py-3 text-label-numeric font-label-numeric text-on-surface-variant hover:bg-surface-architectural hover:text-editorial-sage-light mx-2 my-1 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                }
              >
                <MaterialIcon name={item.icon} filled={active} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.wip ? <WipBadge /> : null}
              </button>
            );
          })}
        </nav>
        <div className="px-md mt-auto">
          <Button fullWidth className="py-sm inline-flex items-center justify-center gap-1" disabled>
            <MaterialIcon name="add_chart" className="text-[18px]" />
            보고서 생성
            <WipBadge />
          </Button>
        </div>
      </aside>

      <PageContainer className="flex-1 gap-space-xl py-md md:py-space-xl">
        <nav className="md:hidden flex gap-sm overflow-x-auto hide-scrollbar pb-sm border-b border-border-hairline -mx-1 px-1 section-reveal">
          {SIDE_ITEMS.map((item) => {
            const active = sideTab === item.id;
            return (
              <button
                key={`mobile-${item.id}`}
                type="button"
                disabled={item.wip}
                onClick={() => !item.wip && setSideTab(item.id)}
                className={`shrink-0 px-md py-2 rounded-full text-label-sm font-label-md min-h-[44px] inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                  active
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-[0_2px_0_#0D6D43]'
                    : 'bg-surface-architectural text-on-surface-variant border border-border-hairline'
                }`}
              >
                {item.label}
                {item.wip ? <WipBadge /> : null}
              </button>
            );
          })}
        </nav>

        {/* Meta bar + editorial title */}
        <header className="section-reveal flex flex-col gap-space-md">
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-architectural border border-border-hairline">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="font-label-caps text-label-caps text-editorial-sage-light tracking-wider uppercase">
                VOL. · 정밀 재무 진단 리포트 ({reportPeriodLabel})
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm">
              <Button
                variant="outline"
                className="px-space-md py-1.5 h-auto rounded-full inline-flex items-center gap-1.5"
                disabled
                onClick={handleShareClick}
              >
                <MaterialIcon name="share" className="text-[16px]" />
                {shareFeedback || '보고서 공유'}
                <WipBadge />
              </Button>
              <Button
                variant="extruded"
                className="px-space-md py-1.5 h-auto rounded-full inline-flex items-center gap-1.5"
                disabled
                onClick={handlePdfClick}
              >
                <MaterialIcon name={pdfFeedback ? 'sync' : 'download'} className={`text-[16px] ${pdfFeedback ? 'animate-spin' : ''}`} />
                {pdfFeedback || 'PDF 다운로드'}
                <WipBadge />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-end pb-space-md border-b border-border-subtle">
            <div className="lg:col-span-8 flex flex-col gap-space-xs min-w-0">
              <span className="font-label-caps text-label-caps text-primary tracking-[0.2em] uppercase">
                QUANT ACTUARIAL AUDIT
              </span>
              <h1 className="font-display text-headline-lg lg:text-display text-editorial-sage-light tracking-tight font-bold m-0 break-keep">
                AI 심층 재무 보고서
                <span className="block text-on-surface-variant text-headline-md font-headline-md font-normal mt-1">
                  Actuarial Intelligence &amp; Cash Velocity Dossier
                </span>
              </h1>
            </div>
            <div className="lg:col-span-4 pb-1 min-w-0">
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed m-0 break-keep">
                {evaluation?.insight ||
                  '가계 수지 분석이 지출 행동·고정 대출·금리 위험을 교차 검증해 도출한 맞춤형 전략 보고서입니다.'}
              </p>
            </div>
          </div>
        </header>

        {/* Focal KPI + WIP goal */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg section-reveal section-reveal-delay-1">
          <Card
            variant="frosted"
            className="lg:col-span-6 p-space-xl relative overflow-hidden flex flex-col justify-between"
            hoverLift
          >
            <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between gap-2 mb-space-md flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-charcoal border border-border-hairline font-label-caps text-label-caps text-editorial-sage-light">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  월간 최적화 여력
                </span>
                {hasLoggedInData && savingsRows.length > 0 ? (
                  <span className="font-label-numeric text-label-numeric text-primary font-semibold">
                    추천 {savingsRows.length}개 항목
                  </span>
                ) : null}
              </div>
              <p className="font-label-caps text-label-caps text-on-surface-variant mb-1 m-0">월 예상 절감 가능 유동성</p>
              <div className="flex items-baseline gap-2 mb-space-sm flex-wrap">
                <span className="font-display text-headline-lg lg:text-display text-primary tracking-tight font-bold financial-value">
                  {isLoading ? '…' : hasLoggedInData ? formatWon(savingDisplay) : '-'}
                </span>
                <span className="font-body-sm text-body-sm text-editorial-sage-muted">/ 월간 추가 잉여액</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg leading-relaxed m-0 break-keep">
                {hasLoggedInData && savingsRows.length > 0
                  ? '권고 프로토콜을 따르면 단기 현금 흐름을 개선할 수 있어요. 아래 절감 표를 확인해 보세요.'
                  : '절감 항목 표와 문제점 진단을 확인하면 실행 우선순위가 보여요.'}
              </p>
            </div>
            <div className="pt-space-md border-t border-border-subtle flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-charcoal border border-border-hairline flex items-center justify-center">
                  <MaterialIcon name="tune" className="text-secondary text-[20px]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps text-outline">시뮬레이션</span>
                  <span className="font-label-numeric text-label-numeric text-editorial-sage-light font-medium">
                    세부 조정으로 이동
                  </span>
                </div>
              </div>
              <Link to="/simulation" className="shrink-0">
                <Button variant="extruded" className="px-space-lg py-3 h-auto w-full sm:w-auto">
                  시뮬레이터 실행
                  <MaterialIcon name="arrow_forward" className="text-[20px]" />
                </Button>
              </Link>
            </div>
          </Card>

          <Card
            variant="frosted"
            className="lg:col-span-6 p-space-xl relative overflow-hidden flex flex-col justify-between"
            hoverLift
          >
            <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between gap-2 mb-space-md flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-charcoal border border-border-hairline font-label-caps text-label-caps text-editorial-sage-light">
                  <MaterialIcon name="rocket_launch" className="text-[14px] text-primary" />
                  순자산 가속 궤적
                </span>
                <WipBadge />
              </div>
              <div className="flex flex-col gap-1 mb-space-sm">
                <span className="font-label-caps text-label-caps text-on-surface-variant">목표 달성 로드맵</span>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="font-display text-headline-lg lg:text-display text-editorial-sage-light tracking-tight font-bold">
                    —
                  </span>
                  <span className="font-label-numeric text-label-numeric text-outline">목표 연동 준비 중</span>
                </div>
              </div>
              <div className="my-space-md p-space-md rounded-DEFAULT bg-surface-charcoal border border-border-hairline">
                <div className="flex items-center justify-between font-label-caps text-label-caps text-outline mb-2 gap-2 flex-wrap">
                  <span>현재</span>
                  <span className="text-editorial-sage-muted font-semibold">1차 목표</span>
                  <span className="text-primary font-semibold">최종 도달</span>
                </div>
                <ProgressBar value={0} heightClass="h-3" barClassName="progress-bar-gradient" animate={false} />
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed m-0 break-keep">
                목표·순자산 궤적 산출은 곧 연동될 예정이에요. 지금은 절감 권고와 문제점 진단을 우선 활용해 주세요.
              </p>
            </div>
            <div className="pt-space-md border-t border-border-subtle flex items-center justify-between text-body-sm font-body-sm text-editorial-sage-muted gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <MaterialIcon name="hourglass_empty" className="text-outline text-[18px]" />
                <span>목표 모듈 WIP</span>
              </div>
              <WipBadge />
            </div>
          </Card>
        </section>

        {/* Chart + problems */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start section-reveal section-reveal-delay-2">
          <Card variant="frosted" className="lg:col-span-7 p-space-xl shadow-card" hoverLift>
            <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-lg">
              <div>
                <span className="font-label-caps text-label-caps text-secondary tracking-wider uppercase">
                  CASH FLOW DYNAMICS
                </span>
                <h2 className="font-headline-md text-headline-md text-editorial-sage-light tracking-tight font-bold mt-1 m-0">
                  지출 구성 · 절감 여력
                </h2>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 font-label-caps text-label-caps text-outline">
                  <span className="w-2.5 h-2.5 rounded-sm bg-primary" /> 상대 규모
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center gap-sm text-on-surface-variant py-space-xl justify-center">
                <MaterialIcon name="progress_activity" className="text-primary animate-spin" />
                <span className="text-body-sm font-body-sm">차트 데이터를 불러오는 중…</span>
              </div>
            ) : chartBars.length === 0 ? (
              <div className="rounded-DEFAULT bg-surface-charcoal border border-border-hairline p-space-lg text-center">
                <MaterialIcon name="bar_chart" className="text-outline text-[32px] mb-sm" />
                <p className="font-body-sm text-body-sm text-on-surface-variant m-0 break-keep">
                  {errorMessage === 'login'
                    ? '로그인하면 카테고리·권고 기반 차트를 볼 수 있어요.'
                    : '표시할 지출·권고 데이터가 아직 없어요. 가계부를 더 기록해 주세요.'}
                </p>
              </div>
            ) : (
              <div className="w-full bg-surface-container-lowest/70 rounded-DEFAULT p-space-md border border-border-subtle ai-report__chart-bars">
                <div className="h-64 w-full flex items-end justify-between gap-3 pt-6 pb-2 px-2 relative">
                  <div className="absolute inset-x-2 inset-y-6 flex flex-col justify-between pointer-events-none opacity-20">
                    <div className="w-full border-b border-outline" />
                    <div className="w-full border-b border-outline" />
                    <div className="w-full border-b border-outline" />
                    <div className="w-full border-b border-outline" />
                  </div>
                  {chartBars.map((bar, index) => (
                    <div
                      key={bar.key}
                      className="flex-1 flex flex-col items-center gap-2 group cursor-default h-full justify-end z-10 min-w-0"
                    >
                      <div
                        className={`text-label-caps font-label-caps transition-opacity ${
                          bar.highlight ? 'text-primary font-bold opacity-100' : 'text-on-surface-variant opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {formatWon(bar.amount)}
                      </div>
                      <div
                        className={`w-full max-w-[48px] flex flex-col justify-end rounded-t overflow-hidden shadow-md ai-report__bar-seg ${
                          bar.highlight ? 'border border-primary/40 shadow-[0_0_16px_rgba(24,199,122,0.4)]' : ''
                        }`}
                        style={{ animationDelay: `${index * 60}ms` }}
                      >
                        <div
                          className={`${bar.highlight ? 'bg-primary' : 'bg-primary/70'} group-hover:brightness-125 transition-all`}
                          style={{ height: `${Math.round((bar.heightPct / 100) * 180)}px` }}
                        />
                      </div>
                      <span
                        className={`font-label-caps text-label-caps truncate max-w-full ${
                          bar.highlight ? 'text-primary font-bold' : 'text-outline'
                        }`}
                        title={bar.label}
                      >
                        {bar.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasLoggedInData && evaluation?.insight ? (
              <div className="mt-space-md p-space-md rounded-DEFAULT bg-surface-architectural border border-border-hairline flex items-start gap-space-sm">
                <MaterialIcon name="insights" className="text-signal-positive text-[22px] shrink-0 mt-0.5" />
                <p className="font-body-sm text-body-sm text-editorial-sage-muted leading-relaxed m-0 break-keep">
                  <strong className="text-editorial-sage-light">AI 궤적 판별:</strong> {evaluation.insight}
                </p>
              </div>
            ) : null}
          </Card>

          <Card variant="frosted" className="lg:col-span-5 p-space-xl flex flex-col" hoverLift>
            <div className="flex items-center justify-between mb-space-lg gap-sm flex-wrap">
              <div>
                <span className="font-label-caps text-label-caps text-outline tracking-wider uppercase">
                  ACTUARIAL ANOMALY AUDIT
                </span>
                <h2 className="font-headline-md text-headline-md text-editorial-sage-light tracking-tight font-bold mt-1 m-0">
                  핵심 재무 문제점 진단
                </h2>
              </div>
              {problems.length > 0 ? (
                <span className="px-2.5 py-1 rounded-full bg-surface-charcoal border border-border-hairline font-label-caps text-label-caps text-editorial-sage-muted">
                  {problems.length}개 과제
                </span>
              ) : null}
            </div>

            <div className="flex flex-col gap-space-md flex-1">
              {isLoading ? (
                <div className="flex items-center gap-sm text-on-surface-variant py-md">
                  <MaterialIcon name="progress_activity" className="text-primary animate-spin" />
                  <span className="text-body-sm font-body-sm">분석 내용을 불러오는 중…</span>
                </div>
              ) : errorMessage === 'login' ? (
                <p className="text-body-sm font-body-sm text-on-surface-variant m-0 break-keep">
                  로그인하면 이번 달 지출 문제점을 볼 수 있어요.
                </p>
              ) : problems.length === 0 ? (
                <p className="text-body-sm font-body-sm text-on-surface-variant m-0 break-keep">
                  {errorMessage || '아직 짚을 문제점이 없어요. 가계부 기록을 더 쌓아보세요.'}
                </p>
              ) : (
                problems.map((problem) => {
                  const style = PROBLEM_STYLES[problem.variant] || PROBLEM_STYLES.default;
                  return (
                    <div
                      key={problem.number}
                      className={`p-space-md rounded-DEFAULT bg-surface-charcoal border border-border-hairline transition-all flex flex-col gap-2 ${style.border}`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-label-numeric text-[12px] font-bold shrink-0 ${style.num}`}
                          >
                            {problem.number}
                          </span>
                          <span className="font-headline-sm text-body-lg text-editorial-sage-light font-medium truncate">
                            {problem.title}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-label-caps text-label-caps font-bold ${style.badge}`}>
                          {problem.badge}
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed m-0 break-keep">
                        {problem.desc}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </section>

        {/* Recommendation protocols + table */}
        <section className="section-reveal section-reveal-delay-3">
          <Card variant="architectural" className="p-space-xl shadow-card">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-md border-b border-border-subtle mb-space-lg">
              <div>
                <span className="font-label-caps text-label-caps text-outline tracking-wider uppercase mb-1 block">
                  TACTICAL RECOMMENDATIONS
                </span>
                <h2 className="font-headline-lg text-headline-lg text-editorial-sage-light tracking-tight font-bold m-0">
                  즉시 실행 권고안 및 절감액
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1 m-0 break-keep">
                  권고 프로토콜을 따르면 월 현금 흐름을 방어할 수 있어요.
                </p>
              </div>
              <div className="px-space-lg py-space-sm rounded-DEFAULT bg-surface-charcoal border border-border-hairline flex flex-col items-start md:items-end shrink-0">
                <span className="font-label-caps text-label-caps text-outline uppercase">총 절감 가능 잉여액</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-md text-headline-md text-primary font-bold financial-value">
                    {hasLoggedInData ? `월 +${formatWon(savingDisplay).replace('₩', '')}` : '—'}
                  </span>
                </div>
                {hasLoggedInData && totalSaving > 0 ? (
                  <span className="font-label-numeric text-label-numeric text-on-surface-variant">
                    (연간 {formatWon(totalSaving * 12)} 확보)
                  </span>
                ) : null}
              </div>
            </div>

            {savingsRows.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg mb-space-xl">
                {savingsRows.slice(0, 3).map((row, index) => (
                  <div
                    key={row.key}
                    className="rounded-DEFAULT bg-surface-charcoal p-space-lg border border-border-subtle hover:border-primary/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-space-sm gap-2">
                        <span className="font-label-caps text-label-caps text-primary font-bold">
                          권고 {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="font-label-caps text-label-caps text-outline truncate">{row.category}</span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-editorial-sage-light font-bold mb-2 m-0 break-keep">
                        {row.detail || row.category}
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md leading-relaxed m-0 break-keep">
                        실행 난이도: {row.difficulty}
                      </p>
                    </div>
                    <div className="p-space-sm rounded bg-surface-container-high border border-border-hairline">
                      <span className="font-label-caps text-label-caps text-outline block mb-0.5">월 절감 효과</span>
                      <span className="font-headline-sm text-headline-sm text-primary font-bold financial-value">
                        + {row.amount} /월
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm mb-md">
              <div className="flex items-center gap-sm">
                <MaterialIcon name="tune" className="text-tertiary-fixed-dim" />
                <h3 className="font-headline-sm text-headline-sm text-editorial-sage-light m-0">절감 가능한 항목 세부내역</h3>
              </div>
              <Button
                variant="outline"
                className="h-[44px] px-md shrink-0 inline-flex items-center gap-1"
                onClick={loadEvaluation}
                disabled={isLoading}
              >
                <MaterialIcon name="refresh" className="text-[18px]" />
                {isLoading ? '불러오는 중…' : '새로고침'}
              </Button>
            </div>

            <div className="table-scroll rounded-DEFAULT border border-border-hairline overflow-hidden">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-surface-charcoal text-label-sm font-label-sm text-on-surface-variant border-b border-border-subtle">
                    <th className="py-3 px-md font-medium">카테고리</th>
                    <th className="py-3 px-md font-medium">상세 내용</th>
                    <th className="py-3 px-md font-medium text-right">예상 절감액 (월)</th>
                    <th className="py-3 px-md font-medium text-center">실행 난이도</th>
                  </tr>
                </thead>
                <tbody className="text-body-sm font-body-sm text-on-background bg-surface-architectural/40">
                  <SavingsTableBody
                    isLoading={isLoading}
                    errorMessage={errorMessage}
                    savingsRows={savingsRows}
                    onRetry={loadEvaluation}
                  />
                </tbody>
              </table>
            </div>

            <div className="mt-space-lg p-space-md rounded-DEFAULT bg-surface-charcoal border border-border-hairline flex flex-col sm:flex-row items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-sm min-w-0">
                <div className="w-10 h-10 rounded-DEFAULT bg-surface-container-high border border-border-hairline flex items-center justify-center shrink-0">
                  <MaterialIcon name="security" className="text-primary text-[20px]" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-headline-sm text-body-lg text-editorial-sage-light font-bold m-0">다음 실행</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant m-0 break-keep">
                    가계부·부채 분석으로 이어가며 권고를 실행해 보세요.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-space-sm w-full sm:w-auto justify-end">
                <Link to="/">
                  <Button variant="secondary" className="px-space-md py-2.5 h-auto">
                    <MaterialIcon name="home" className="text-[18px]" />
                    홈으로
                  </Button>
                </Link>
                <Link to="/debt-analysis">
                  <Button variant="extruded" className="px-space-lg py-2.5 h-auto">
                    <MaterialIcon name="bolt" className="text-[18px]" />
                    빚 정리로 가기
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </section>
      </PageContainer>
    </div>
  );
}
