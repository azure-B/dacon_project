import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, MaterialIcon, ProgressBar, SegmentedControl } from '../../components/common';
import { PageContainer } from '../../components/layout';
import useCountUp from '../../hooks/useCountUp';
import { api } from '../../services/api';
import { getAccessToken } from '../../services/authStorage';
import './DebtAnalysis.css';

const RISK_LABELS = {
  low: '낮음',
  medium: '보통',
  high: '높음',
};

const RISK_STYLE = {
  low: {
    border: 'border-signal-positive/30',
    badge: 'bg-signal-positive-subtle text-signal-positive',
    icon: 'text-signal-positive',
  },
  medium: {
    border: 'border-signal-advisory/30',
    badge: 'bg-signal-advisory-subtle text-signal-advisory',
    icon: 'text-signal-advisory',
  },
  high: {
    border: 'border-signal-risk/30',
    badge: 'bg-signal-risk-subtle text-signal-risk',
    icon: 'text-signal-risk',
  },
};

const CHART_COLORS = ['bg-primary', 'bg-signal-risk', 'bg-outline', 'bg-secondary', 'bg-signal-advisory'];
const CHART_TEXT = ['text-primary', 'text-signal-risk', 'text-outline', 'text-secondary', 'text-signal-advisory'];

const SORT_OPTIONS = [
  { id: 'avalanche', label: '고금리 우선' },
  { id: 'snowball', label: '소액 우선' },
];

function formatWon(value) {
  if (value == null || !Number.isFinite(Number(value))) return '-';
  return `₩ ${Math.round(Number(value)).toLocaleString('ko-KR')}`;
}

function formatRate(loan) {
  const min = loan?.이자율_최저 ?? loan?.interestRate;
  const max = loan?.이자율_최고;
  if (min == null && max == null) return '-';
  if (min != null && max != null && min !== max) return `${min}% ~ ${max}%`;
  return `${min ?? max}%`;
}

function formatPeriod(loan) {
  return loan?.대출_기간 || loan?.remaining || '-';
}

function getLoanRate(loan) {
  const rate = loan?.이자율_최고 ?? loan?.이자율_최저 ?? loan?.interestRate;
  const num = Number(rate);
  return Number.isFinite(num) ? num : null;
}

function getLoanProgress(loan) {
  const balance = Number(loan?.balance);
  const original = Number(
    loan?.originalAmount ?? loan?.originalBalance ?? loan?.principal ?? loan?.대출원금
  );
  if (!Number.isFinite(balance) || !Number.isFinite(original) || original <= 0) return null;
  const repaidPct = Math.max(0, Math.min(100, Math.round(((original - balance) / original) * 100)));
  return { original, repaidPct };
}

function getDebtErrorMessage(error) {
  if (error?.status === 401 || error?.code === 'unauthorized' || error?.code === 'invalid token') {
    return '로그인이 필요합니다. 로그인 후 다시 시도해주세요.';
  }
  if (error?.status === 502 || error?.code === 'ai unavailable') {
    return '지금은 연결이 원활하지 않아요. 잠시 후 다시 시도해주세요.';
  }
  if (error?.status === 500 || error?.code === 'debt adjustment failed') {
    return '빚 정리를 불러오는 중 문제가 생겼어요. 잠시 후 다시 눌러주세요.';
  }
  return error?.message || '빚 정리를 불러오지 못했어요.';
}

function buildLoanSegments(loans, totalDebt) {
  if (!loans?.length || !totalDebt) return [];
  let offset = 0;
  return loans.map((loan, index) => {
    const balance = Number(loan.balance) || 0;
    const percent = Math.max(0, Math.min(100, (balance / totalDebt) * 100));
    const segment = {
      key: loan.id || `${loan.상품명}-${index}`,
      label: loan.상품명 || loan.상품_유형 || `대출 ${index + 1}`,
      balance,
      percent,
      offset,
      colorClass: CHART_COLORS[index % CHART_COLORS.length],
      textClass: CHART_TEXT[index % CHART_TEXT.length],
    };
    offset -= percent;
    return segment;
  });
}

function recommendationKey(item, index) {
  return `${item.title}-${index}`;
}

export default function DebtAnalysis() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [sortMode, setSortMode] = useState('avalanche');
  const [checkedSavings, setCheckedSavings] = useState({});
  const [planApplied, setPlanApplied] = useState(false);

  const loadAnalysis = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setIsUnauthorized(false);

    if (!getAccessToken()) {
      setIsUnauthorized(true);
      setErrorMessage('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
      setData(null);
      setIsLoading(false);
      return;
    }

    try {
      const result = await api.analyzeDebt({});
      setData(result);
    } catch (error) {
      const unauthorized = error?.status === 401;
      setIsUnauthorized(unauthorized);
      setErrorMessage(getDebtErrorMessage(error));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, []);

  const summary = data?.summary;
  const loans = data?.loans || [];
  const assets = data?.assets || [];
  const recommendations = data?.recommendations || [];
  const segments = buildLoanSegments(loans, summary?.totalDebt);
  const disclaimer = data?.disclaimer;
  const dataReady = !isLoading && !!data && !!summary;

  useEffect(() => {
    const list = data?.recommendations || [];
    const next = {};
    list.forEach((item, index) => {
      if (item.estimatedMonthlySaving) {
        next[recommendationKey(item, index)] = true;
      }
    });
    setCheckedSavings(next);
    setPlanApplied(false);
  }, [data]);

  const sortedLoans = useMemo(() => {
    const list = [...loans];
    if (sortMode === 'snowball') {
      return list.sort((a, b) => (Number(a.balance) || 0) - (Number(b.balance) || 0));
    }
    return list.sort((a, b) => {
      const rateA = getLoanRate(a);
      const rateB = getLoanRate(b);
      if (rateA == null && rateB == null) return 0;
      if (rateA == null) return 1;
      if (rateB == null) return -1;
      return rateB - rateA;
    });
  }, [loans, sortMode]);

  const checkedSavingTotal = useMemo(() => {
    return recommendations.reduce((sum, item, index) => {
      const key = recommendationKey(item, index);
      if (!checkedSavings[key] || !item.estimatedMonthlySaving) return sum;
      return sum + Number(item.estimatedMonthlySaving);
    }, 0);
  }, [recommendations, checkedSavings]);

  const debtDisplay = useCountUp(dataReady ? summary?.totalDebt : null);
  const paymentDisplay = useCountUp(dataReady ? summary?.monthlyPayment : null);
  const dsrValue = summary?.dsrPercent != null ? Number(summary.dsrPercent) : null;
  const riskKey = summary?.riskLevel && RISK_STYLE[summary.riskLevel] ? summary.riskLevel : 'medium';
  const riskStyle = RISK_STYLE[riskKey];

  const toggleSaving = (key) => {
    setCheckedSavings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePlanClick = () => {
    setPlanApplied(true);
    window.setTimeout(() => setPlanApplied(false), 2800);
  };

  return (
    <PageContainer className="gap-space-2xl">
      <header className="section-reveal flex flex-col gap-sm">
        <h1 className="font-display text-[2.5rem] sm:text-display text-editorial-sage-light tracking-tight leading-none m-0 break-keep">
          빚, 조금 덜 무겁게
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl m-0">
          지금 가진 빚과 지출을 차분히 정리해 볼게요. 어려운 용어 없이요.
        </p>
      </header>

      {isLoading ? (
        <Card variant="architectural" className="p-md md:p-lg section-reveal flex items-center gap-md">
          <MaterialIcon name="progress_activity" className="text-primary text-headline-md animate-spin" />
          <p className="text-body-md font-body-md text-editorial-sage-muted m-0">빚 정리를 살펴보는 중…</p>
        </Card>
      ) : null}

      {!isLoading && errorMessage ? (
        <Card
          variant="charcoal"
          className={`p-md md:p-lg section-reveal border ${
            isUnauthorized ? 'border-border-hairline' : 'border-signal-risk/30'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
            <div className="min-w-0">
              <h3 className="font-headline-sm text-headline-sm text-editorial-sage-light m-0 mb-xs">
                분석을 표시할 수 없습니다
              </h3>
              <p
                className={`text-body-sm font-body-sm m-0 break-keep ${
                  isUnauthorized ? 'text-on-surface-variant' : 'text-signal-risk'
                }`}
                role="alert"
              >
                {errorMessage}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-sm shrink-0">
              {isUnauthorized ? (
                <Link to="/login">
                  <Button variant="extruded" className="h-[44px] px-md w-full sm:w-auto">
                    로그인하기
                  </Button>
                </Link>
              ) : (
                <Button variant="secondary" className="h-[44px] px-md" onClick={loadAnalysis}>
                  다시 시도
                </Button>
              )}
            </div>
          </div>
        </Card>
      ) : null}

      {dataReady ? (
        <>
          {/* Hero: total debt + DSR + composition */}
          <section className="section-reveal">
            <Card
              variant="frosted"
              className="p-space-lg lg:p-space-xl flex flex-col gap-space-xl relative overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
                <div className="lg:col-span-7 flex flex-col gap-space-md min-w-0">
                  <div className="flex items-center justify-between gap-sm flex-wrap">
                    <div className="flex items-center gap-2">
                      <MaterialIcon name="account_balance_wallet" className="text-outline text-[20px]" />
                      <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                        총 보유 부채 잔액
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {loans.length > 0 ? `등록 대출 ${loans.length}건` : '등록 대출 없음'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="font-display text-[2.5rem] sm:text-display text-editorial-sage-light tracking-tight leading-none m-0 financial-value">
                      {formatWon(debtDisplay)}
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant m-0 pt-1">
                      모아 둔 돈 {formatWon(summary.totalAssets)}
                      <span className="text-border-subtle mx-2">•</span>
                      한 달 수입 {formatWon(summary.monthlyIncome)}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-5 grid grid-cols-2 gap-space-md bg-surface-charcoal/80 rounded-DEFAULT p-space-md border border-border-subtle">
                  <div className="flex flex-col justify-between gap-2 min-w-0">
                    <div className="flex flex-col gap-1">
                      <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                        DSR 비율
                      </span>
                      <span className="font-display text-headline-lg text-editorial-sage-light tracking-tight financial-value">
                        {dsrValue != null ? `${dsrValue}%` : '-'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <ProgressBar
                        value={dsrValue ?? 0}
                        heightClass="h-1.5"
                        barClassName="bg-primary"
                        animate={dataReady}
                      />
                      <span className="font-label-caps text-label-caps text-primary">
                        {dsrValue == null
                          ? '수입 데이터 필요'
                          : dsrValue <= 40
                            ? '규제 상한(40%) 이내'
                            : '규제 상한(40%) 초과 주의'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between border-l border-border-subtle pl-space-md min-w-0">
                    <div className="flex flex-col gap-1">
                      <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                        월 총 상환액
                      </span>
                      <span className="font-headline-md text-headline-md text-editorial-sage-light tracking-tight financial-value">
                        {formatWon(paymentDisplay)}
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant m-0">
                      등록 대출 월 상환 합계
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-space-xs pt-space-md border-t border-border-subtle">
                <div className="flex items-center justify-between font-label-caps text-label-caps text-on-surface-variant gap-sm flex-wrap">
                  <span className="text-outline uppercase">포트폴리오 구성비</span>
                  {segments.length > 0 ? (
                    <span className="text-editorial-sage-muted">
                      {segments
                        .slice(0, 3)
                        .map((s) => `${s.label} ${s.percent.toFixed(1)}%`)
                        .join(' · ')}
                    </span>
                  ) : null}
                </div>
                <div className="h-2 w-full bg-surface-charcoal rounded-full flex gap-1 overflow-hidden">
                  {segments.length === 0 ? (
                    <div className="h-full w-full rounded-full bg-surface-container-highest/40" />
                  ) : (
                    segments.map((segment) => (
                      <div
                        key={segment.key}
                        className={`debt-analysis__seg h-full rounded-full ${segment.colorClass}`}
                        style={{ width: `${segment.percent}%` }}
                        title={segment.label}
                      />
                    ))
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-space-md gap-y-1 text-on-surface-variant font-label-caps text-label-caps pt-1">
                  {segments.length === 0 ? (
                    <span>등록된 대출이 없습니다.</span>
                  ) : (
                    segments.map((segment) => (
                      <span key={segment.key} className="inline-flex items-center gap-1.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${segment.colorClass}`} />
                        <span className="truncate">
                          {segment.label} {formatWon(segment.balance)}
                        </span>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </Card>
          </section>

          {/* Insight banner */}
          <Card
            variant="architectural"
            className={`section-reveal section-reveal-delay-1 p-space-md md:p-space-lg border ${riskStyle.border} flex flex-col sm:flex-row items-start gap-md`}
            hoverLift
          >
            <MaterialIcon
              name="tips_and_updates"
              filled
              className={`${riskStyle.icon} text-headline-lg shrink-0`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-sm mb-xs">
                <h3 className="font-headline-sm text-headline-sm text-editorial-sage-light m-0 break-keep">
                  이렇게 보여요
                </h3>
                <span
                  className={`font-label-caps text-label-caps px-2 py-1 rounded ${riskStyle.badge}`}
                >
                  리스크: {RISK_LABELS[summary.riskLevel] || summary.riskLevel || '-'}
                </span>
              </div>
              <p className="font-headline-sm text-headline-sm text-editorial-sage-light leading-relaxed break-keep m-0">
                {summary.insight}
              </p>
              {summary.comment ? (
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs m-0 break-keep">
                  {summary.comment}
                </p>
              ) : null}
            </div>
          </Card>

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start section-reveal section-reveal-delay-2">
            {/* Left: loans + assets */}
            <div className="lg:col-span-7 flex flex-col gap-space-lg min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div className="flex items-center gap-2">
                  <MaterialIcon name="format_list_bulleted" className="text-outline text-[20px]" />
                  <h3 className="font-headline-sm text-headline-sm text-editorial-sage-light m-0">
                    보유 대출 상품 상세 현황
                  </h3>
                </div>
                <SegmentedControl
                  options={SORT_OPTIONS}
                  value={sortMode}
                  onChange={setSortMode}
                  size="sm"
                  className="self-start sm:self-auto"
                />
              </div>

              <div className="flex flex-col gap-space-md">
                {sortedLoans.length === 0 ? (
                  <Card variant="architectural" className="p-space-md">
                    <p className="font-body-sm text-body-sm text-on-surface-variant m-0">
                      표시할 대출이 없습니다.
                    </p>
                  </Card>
                ) : (
                  sortedLoans.map((loan, index) => {
                    const rate = getLoanRate(loan);
                    const highRate = rate != null && rate >= 5;
                    const progress = getLoanProgress(loan);
                    return (
                      <Card
                        key={loan.id || `${loan.상품명}-${index}`}
                        variant="architectural"
                        className="p-space-lg flex flex-col gap-space-md min-w-0"
                        hoverLift
                      >
                        <div className="flex items-start justify-between gap-sm">
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-headline-sm text-headline-sm text-editorial-sage-light m-0 break-keep">
                                {loan.은행명 ? `${loan.은행명} ` : ''}
                                {loan.상품명 || '대출 상품'}
                              </h4>
                              <span
                                className={`font-label-caps text-label-caps ${
                                  highRate ? 'text-signal-risk font-semibold' : 'text-outline'
                                }`}
                              >
                                {loan.상품_유형 || loan.금융권_구분 || '대출'}
                              </span>
                            </div>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              {formatPeriod(loan)}
                            </span>
                          </div>
                          <div className="flex flex-col items-end shrink-0">
                            <span
                              className={`font-label-caps text-label-caps uppercase ${
                                highRate ? 'text-signal-risk font-semibold' : 'text-outline'
                              }`}
                            >
                              적용 금리
                            </span>
                            <span
                              className={`font-headline-sm text-headline-sm font-bold financial-value ${
                                highRate ? 'text-signal-risk' : 'text-editorial-sage-light'
                              }`}
                            >
                              {formatRate(loan)}
                            </span>
                          </div>
                        </div>

                        {progress ? (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between font-label-caps text-label-caps text-on-surface-variant gap-sm flex-wrap">
                              <span>원금 잔액</span>
                              <span className="font-label-numeric text-label-numeric text-editorial-sage-light financial-value">
                                {formatWon(loan.balance)}{' '}
                                <span className="text-outline">
                                  / {formatWon(progress.original)} ({progress.repaidPct}% 상환)
                                </span>
                              </span>
                            </div>
                            <ProgressBar
                              value={progress.repaidPct}
                              heightClass="h-1.5"
                              barClassName={highRate ? 'bg-signal-risk' : 'bg-editorial-sage-light'}
                              animate={dataReady}
                            />
                          </div>
                        ) : null}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm pt-space-xs border-t border-border-subtle font-label-numeric text-label-numeric">
                          <div>
                            <span className="font-label-caps text-label-caps text-outline block mb-xs">
                              대출 잔액
                            </span>
                            <span className="text-editorial-sage-light financial-value">
                              {formatWon(loan.balance)}
                            </span>
                          </div>
                          <div>
                            <span className="font-label-caps text-label-caps text-outline block mb-xs">
                              월 상환액
                            </span>
                            <span className="text-signal-risk financial-value">
                              {formatWon(loan.monthlyPayment)}
                            </span>
                          </div>
                          <div className="sm:text-right">
                            <span className="font-label-caps text-label-caps text-outline block mb-xs">
                              대출 기간
                            </span>
                            <span className="text-editorial-sage-muted">{formatPeriod(loan)}</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>

              <section className="flex flex-col gap-space-md">
                <div className="flex items-center gap-2">
                  <MaterialIcon name="savings" className="text-outline text-[20px]" />
                  <h3 className="font-headline-sm text-headline-sm text-editorial-sage-light m-0">
                    보유 자산
                  </h3>
                </div>
                {assets.length === 0 ? (
                  <Card variant="architectural" className="p-space-md">
                    <p className="font-body-sm text-body-sm text-on-surface-variant m-0">
                      표시할 자산이 없습니다.
                    </p>
                  </Card>
                ) : (
                  assets.map((asset, index) => (
                    <Card
                      key={asset.id || `${asset.상품명}-${index}`}
                      variant="architectural"
                      className="p-space-md min-w-0"
                      hoverLift
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-sm">
                        <div className="min-w-0">
                          <p className="font-body-md text-body-md font-semibold text-editorial-sage-light m-0 break-keep">
                            {asset.은행명 ? `${asset.은행명} · ` : ''}
                            {asset.상품명 || asset.상품_유형 || '자산'}
                          </p>
                          <p className="font-label-caps text-label-caps text-on-surface-variant m-0 mt-xs">
                            {asset.상품_유형 || (asset.isManual ? '수동 입력' : '금융상품')}
                          </p>
                        </div>
                        <span className="font-headline-sm text-headline-sm text-editorial-sage-light financial-value shrink-0">
                          {formatWon(asset.amount)}
                        </span>
                      </div>
                    </Card>
                  ))
                )}
              </section>
            </div>

            {/* Right: recommendations + goals */}
            <div className="lg:col-span-5 min-w-0 section-reveal section-reveal-delay-3">
              <Card
                variant="frosted"
                className="p-space-lg flex flex-col gap-space-lg lg:sticky lg:top-24 min-w-0"
              >
                <div className="flex items-start justify-between gap-sm">
                  <div className="flex flex-col">
                    <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                      지출 구조 최적화
                    </span>
                    <h3 className="font-headline-sm text-headline-sm text-editorial-sage-light mt-1 m-0">
                      목표 · 추천 절감 플랜
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-label-caps text-label-caps text-outline block">선택 절감액</span>
                    <span className="font-headline-sm text-headline-sm text-signal-positive font-bold financial-value">
                      {formatWon(checkedSavingTotal)}
                    </span>
                  </div>
                </div>

                <div className="rounded-DEFAULT border border-border-subtle bg-surface-charcoal/80 p-space-md space-y-sm">
                  <MetricRow label="목표 금액" value={formatWon(summary.targetAmount)} />
                  <MetricRow
                    label="목표 기간"
                    value={summary.targetPeriod != null ? `${summary.targetPeriod}개월` : '-'}
                  />
                  <MetricRow label="월 상환액" value={formatWon(summary.monthlyPayment)} />
                </div>

                <div className="flex flex-col gap-space-sm">
                  <h4 className="font-label-numeric text-label-numeric text-editorial-sage-light m-0 flex items-center gap-xs">
                    <span className="w-2 h-2 rounded-full bg-secondary" /> 추천 조치
                  </h4>
                  {recommendations.length === 0 ? (
                    <p className="p-space-md text-body-sm font-body-sm text-on-surface-variant m-0 rounded-DEFAULT bg-surface-charcoal/80">
                      추천 항목이 없습니다.
                    </p>
                  ) : (
                    recommendations.map((item, index) => {
                      const key = recommendationKey(item, index);
                      const hasSaving = !!item.estimatedMonthlySaving;
                      return (
                        <div
                          key={key}
                          className="p-space-md rounded-DEFAULT bg-surface-charcoal/80 flex flex-col gap-space-sm"
                        >
                          <div className="flex items-start justify-between gap-sm">
                            <div className="min-w-0">
                              <p className="font-label-caps text-label-caps text-secondary m-0 mb-xs">
                                {item.category || '추천'}
                              </p>
                              <p className="font-label-numeric text-label-numeric text-editorial-sage-light m-0 break-keep">
                                {item.title}
                              </p>
                              <p className="font-body-sm text-body-sm text-on-surface-variant m-0 mt-xs break-keep">
                                {item.detail}
                              </p>
                            </div>
                            {hasSaving ? (
                              <span className="font-label-numeric text-label-numeric text-editorial-sage-light shrink-0 financial-value">
                                −{formatWon(item.estimatedMonthlySaving)}
                              </span>
                            ) : null}
                          </div>
                          {hasSaving ? (
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded bg-canvas-deep accent-primary text-primary focus:ring-0 cursor-pointer"
                                checked={!!checkedSavings[key]}
                                onChange={() => toggleSaving(key)}
                              />
                              <span className="font-body-sm text-body-sm text-on-surface-variant">
                                절감 플랜에 포함
                              </span>
                            </label>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-space-md rounded-DEFAULT bg-surface-architectural border border-border-subtle flex items-center justify-between gap-sm">
                  <span className="font-label-caps text-label-caps text-outline">
                    확보되는 월 추가 상환 가용액
                  </span>
                  <span className="font-headline-sm text-headline-sm text-signal-positive font-bold financial-value">
                    + {formatWon(checkedSavingTotal)}
                  </span>
                </div>

                <Button
                  variant="extruded"
                  className="w-full py-3.5 px-space-lg"
                  onClick={handlePlanClick}
                  disabled={checkedSavingTotal <= 0}
                >
                  {planApplied ? (
                    <span>✓ 플랜 실행 완료</span>
                  ) : (
                    <>
                      <span>플랜 실행</span>
                      <MaterialIcon name="arrow_forward" className="text-[18px]" />
                    </>
                  )}
                </Button>
                {checkedSavingTotal <= 0 ? (
                  <p className="font-body-sm text-body-sm text-outline m-0">
                    절감액이 있는 추천을 선택하면 플랜을 실행할 수 있어요.
                  </p>
                ) : null}

                {disclaimer ? (
                  <div className="pt-space-md border-t border-border-subtle space-y-xs">
                    <p className="font-label-caps text-label-caps text-on-surface-variant m-0 flex items-start gap-xs">
                      <MaterialIcon name="info" className="text-[16px] shrink-0 mt-0.5" />
                      <span>{disclaimer.partialResults || disclaimer.dataSource}</span>
                    </p>
                    {disclaimer.variableConditions ? (
                      <p className="font-label-caps text-label-caps text-on-surface-variant m-0 pl-[22px]">
                        {disclaimer.variableConditions}
                      </p>
                    ) : null}
                    {disclaimer.confirmBeforeApply ? (
                      <p className="font-label-caps text-label-caps text-on-surface-variant m-0 pl-[22px]">
                        {disclaimer.confirmBeforeApply}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </Card>
            </div>
          </section>
        </>
      ) : null}
    </PageContainer>
  );
}

function MetricRow({ label, value }) {
  return (
    <div className="flex justify-between items-center gap-sm">
      <span className="font-label-caps text-label-caps text-on-surface-variant">{label}</span>
      <span className="font-label-numeric text-label-numeric text-editorial-sage-light financial-value">
        {value}
      </span>
    </div>
  );
}
