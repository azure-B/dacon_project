import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, MaterialIcon, ProgressBar, WipBadge } from '../../components/common';
import useCountUp from '../../hooks/useCountUp';
import { api } from '../../services/api';
import { getAccessToken } from '../../services/authStorage';
import './Dashboard.css';

function formatWon(value) {
  if (value == null || !Number.isFinite(Number(value))) return '-';
  return `₩ ${Math.round(Number(value)).toLocaleString('ko-KR')}`;
}

function buildAdvice({ surplus, payment, debt }) {
  if (surplus != null && surplus > 0 && payment > 0) {
    const allocate = Math.round(Number(surplus) * 0.4);
    return {
      body: `이번 달 남는 돈의 약 40%(${formatWon(allocate)})를 추가 상환에 쓰면, 월 상환 ${formatWon(payment)} 부담을 앞당길 수 있어요.`,
      meta: debt != null ? `등록 부채 잔액 ${formatWon(debt)}` : '부채 분석에서 상환 순서를 확인하세요.',
    };
  }
  if (debt != null && Number(debt) > 0) {
    return {
      body: '등록된 부채가 있어요. 고금리부터 정리하는 순서를 부채 분석에서 확인해볼까요?',
      meta: `총 부채 ${formatWon(debt)}`,
    };
  }
  return {
    body: '자산·수입·가계부를 채우면, 남는 돈을 어디에 쓸지 AI가 우선순위를 제안해요.',
    meta: '데이터 연동 후 전략 제언이 활성화됩니다.',
  };
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [summary, setSummary] = useState(null);
  const [monthExpense, setMonthExpense] = useState(null);
  const [planApplied, setPlanApplied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setErrorMessage('');

      if (!getAccessToken()) {
        if (!cancelled) {
          setSummary(null);
          setMonthExpense(null);
          setErrorMessage('login');
          setIsLoading(false);
        }
        return;
      }

      try {
        const now = new Date();
        const [debt, book] = await Promise.all([
          api.analyzeDebt({}),
          api.getAccountBookSummary({
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          }),
        ]);
        if (cancelled) return;
        setSummary(debt?.summary || null);
        setMonthExpense(book?.totalExpense ?? null);
      } catch (error) {
        if (cancelled) return;
        if (error?.status === 401) {
          setErrorMessage('login');
        } else {
          setErrorMessage(error?.message || '홈 데이터를 불러오지 못했어요.');
        }
        setSummary(null);
        setMonthExpense(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const assets = summary?.totalAssets;
  const debt = summary?.totalDebt;
  const income = summary?.monthlyIncome;
  const payment = summary?.monthlyPayment || 0;
  const expense = monthExpense;
  const surplus =
    income != null && expense != null ? Math.max(0, Number(income) - Number(expense)) : null;
  const netWorth =
    assets != null && debt != null ? Number(assets) - Number(debt) : assets != null ? Number(assets) : null;
  const target = summary?.targetAmount;
  const progress =
    target && assets != null && Number(target) > 0
      ? Math.min(100, Math.round((Number(assets) / Number(target)) * 100))
      : null;

  const incomeNum = income != null ? Number(income) : 0;
  const expenseNum = expense != null ? Number(expense) : 0;
  const fixedShare = incomeNum > 0 ? Math.min(100, Math.round((payment / incomeNum) * 100)) : 0;
  const variableShare =
    incomeNum > 0 ? Math.min(100 - fixedShare, Math.round((Math.max(0, expenseNum - payment) / incomeNum) * 100)) : 0;
  const surplusShare = Math.max(0, 100 - fixedShare - variableShare);

  const healthScore = useMemo(() => {
    if (income == null || !Number.isFinite(Number(income)) || Number(income) <= 0) return null;
    const dsr = (Number(payment) / Number(income)) * 100;
    const score = Math.round(Math.max(20, Math.min(98, 100 - dsr * 1.2)));
    return score;
  }, [income, payment]);

  const advice = buildAdvice({ surplus, payment, debt });
  const dataReady = !isLoading && !errorMessage;

  const netWorthDisplay = useCountUp(dataReady ? netWorth : null);
  const assetsDisplay = useCountUp(dataReady ? assets : null);
  const debtDisplay = useCountUp(dataReady ? debt : null);
  const surplusDisplay = useCountUp(dataReady ? surplus : null);
  const incomeDisplay = useCountUp(dataReady ? income : null);
  const expenseDisplay = useCountUp(dataReady ? expense : null);

  const handlePlanClick = () => {
    setPlanApplied(true);
    window.setTimeout(() => setPlanApplied(false), 2800);
  };

  return (
    <div className="dashboard page-shell max-w-[1440px] w-full mx-auto px-3 sm:px-margin-mobile lg:px-margin py-space-xl flex flex-col gap-space-2xl">
      {isLoading ? (
        <Card variant="architectural" className="p-md md:p-lg section-reveal flex items-center gap-md">
          <MaterialIcon name="progress_activity" className="text-primary text-headline-md animate-spin" />
          <p className="text-body-md font-body-md text-editorial-sage-muted m-0">홈 숫자를 불러오는 중…</p>
        </Card>
      ) : null}

      {!isLoading && errorMessage === 'login' ? (
        <Card variant="architectural" className="p-md md:p-lg section-reveal">
          <p className="text-body-md font-body-md text-editorial-sage-light m-0 mb-sm">
            로그인하면 내 자산·빚·가계부가 여기에 모여요.
          </p>
          <Link to="/login">
            <Button variant="extruded" className="h-[44px] px-md">
              로그인하기
            </Button>
          </Link>
        </Card>
      ) : null}

      {!isLoading && errorMessage && errorMessage !== 'login' ? (
        <Card variant="charcoal" className="p-md md:p-lg section-reveal border border-signal-risk/30">
          <p className="text-body-sm font-body-sm text-signal-risk m-0" role="alert">
            {errorMessage}
          </p>
        </Card>
      ) : null}

      {/* Hero */}
      <section className="section-reveal flex flex-col gap-space-lg">
        <Card
          variant="architectural"
          className="p-space-xl lg:p-space-2xl flex flex-col gap-space-xl relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg pb-space-lg border-b border-border-subtle">
            <div className="flex flex-col gap-2 min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-signal-positive" />
                <span className="font-label-caps text-label-caps text-on-surface-variant tracking-widest">
                  종합 운용 순자산 가치
                </span>
              </div>
              <div className="flex flex-wrap items-baseline gap-space-md">
                <h1 className="font-display text-[2.5rem] sm:text-display text-editorial-sage-light tracking-tight leading-none financial-value">
                  {isLoading ? '…' : formatWon(netWorthDisplay)}
                </h1>
                {progress != null ? (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-signal-positive-subtle text-signal-positive font-label-numeric text-label-numeric">
                    <MaterialIcon name="flag" className="text-[14px]" />
                    <span>목표 대비 {progress}%</span>
                  </div>
                ) : null}
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xl leading-relaxed mt-1">
                등록된 자산과 부채를 기준으로 오늘 위치를 보여줍니다. 가계부 지출이 반영되면 잉여 흐름도 함께
                계산됩니다.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-lg">
            <div className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-on-surface-variant tracking-wider">총 자산</span>
              <span className="font-headline-md text-headline-md text-editorial-sage-light tracking-tight financial-value">
                {formatWon(assetsDisplay)}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">등록 자산 합계</span>
            </div>
            <div className="flex flex-col gap-1 sm:border-l sm:border-border-subtle sm:pl-space-lg">
              <span className="font-label-caps text-label-caps text-on-surface-variant tracking-wider">총 부채</span>
              <span className="font-headline-md text-headline-md text-editorial-sage-light tracking-tight financial-value">
                {formatWon(debtDisplay)}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                월 상환 {formatWon(payment)}
              </span>
            </div>
            <div className="flex flex-col gap-1 sm:border-l sm:border-border-subtle sm:pl-space-lg">
              <span className="font-label-caps text-label-caps text-on-surface-variant tracking-wider">월 순 잉여</span>
              <span className="font-headline-md text-headline-md text-editorial-sage-light tracking-tight financial-value">
                {surplus != null ? `+${formatWon(surplusDisplay)}` : '-'}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">수입 − 이번 달 지출</span>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl section-reveal section-reveal-delay-1">
        {/* Primary column */}
        <div className="lg:col-span-7 flex flex-col gap-space-xl">
          <Card variant="architectural" className="p-space-lg lg:p-space-xl flex flex-col gap-space-md" hoverLift>
            <div className="flex items-center justify-between gap-sm">
              <span className="font-label-caps text-label-caps text-on-surface-variant tracking-wider">AI 전략 제언</span>
              <span className="font-label-numeric text-label-numeric text-on-surface-variant">API 기반</span>
            </div>
            <blockquote className="font-headline-sm text-headline-sm text-editorial-sage-light leading-relaxed tracking-tight m-0">
              “{advice.body}”
            </blockquote>
            <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs text-on-surface-variant font-body-sm text-body-sm">
              <span>{advice.meta}</span>
              <div className="flex items-center gap-space-xs">
                <Link to="/debt-analysis">
                  <Button variant="secondary" className="px-md py-1.5 rounded-full text-label-numeric">
                    세부 근거 검토
                  </Button>
                </Link>
                <Link to="/simulation">
                  <Button variant="pill" className="px-md py-1.5">
                    시뮬레이션
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          <Card variant="architectural" className="p-space-lg lg:p-space-xl flex flex-col gap-space-lg" hoverLift>
            <div className="flex items-center justify-between gap-sm">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant tracking-widest">연산 분석</span>
                <h2 className="font-headline-md text-headline-md text-editorial-sage-light tracking-tight m-0">
                  월간 현금 흐름
                </h2>
              </div>
              <span className="font-label-numeric text-label-numeric text-on-surface-variant">
                {new Date().getFullYear()}년 {new Date().getMonth() + 1}월
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center font-label-numeric text-label-numeric text-on-surface-variant">
                <span>
                  총 유입:{' '}
                  <strong className="text-editorial-sage-light font-medium">{formatWon(incomeDisplay)}</strong>
                </span>
                <span>
                  총 지출:{' '}
                  <strong className="text-editorial-sage-light font-medium">{formatWon(expenseDisplay)}</strong>
                </span>
              </div>
              <div className="w-full h-2.5 bg-surface-charcoal rounded-full flex gap-1 overflow-hidden">
                <div
                  className="dashboard__flow-seg h-full rounded-full bg-primary/80"
                  style={{ width: dataReady ? `${fixedShare}%` : '0%' }}
                  title="대출 상환"
                />
                <div
                  className="dashboard__flow-seg h-full rounded-full bg-surface-container-highest"
                  style={{ width: dataReady ? `${variableShare}%` : '0%' }}
                  title="기타 지출"
                />
                <div
                  className="dashboard__flow-seg h-full rounded-full bg-editorial-sage-muted/70"
                  style={{ width: dataReady ? `${surplusShare}%` : '0%' }}
                  title="순 잉여"
                />
              </div>
              <div className="flex items-center gap-space-md font-label-caps text-label-caps text-on-surface-variant pt-1">
                <span>상환 {fixedShare}%</span>
                <span>•</span>
                <span>변동 {variableShare}%</span>
                <span>•</span>
                <span>잉여 {surplusShare}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm pt-space-xs border-t border-border-subtle">
              <div className="py-space-xs flex flex-col gap-0.5">
                <span className="font-label-caps text-label-caps text-on-surface-variant">월 유입</span>
                <span className="font-headline-sm text-headline-sm text-editorial-sage-light financial-value">
                  {formatWon(incomeDisplay)}
                </span>
              </div>
              <div className="py-space-xs flex flex-col gap-0.5">
                <span className="font-label-caps text-label-caps text-on-surface-variant">총 지출</span>
                <span className="font-headline-sm text-headline-sm text-editorial-sage-light financial-value">
                  {formatWon(expenseDisplay)}
                </span>
              </div>
              <div className="py-space-xs flex flex-col gap-0.5">
                <span className="font-label-caps text-label-caps text-on-surface-variant">순 잉여</span>
                <span className="font-headline-sm text-headline-sm text-editorial-sage-light financial-value">
                  {formatWon(surplusDisplay)}
                </span>
              </div>
            </div>
          </Card>

          <Card variant="architectural" className="p-space-lg lg:p-space-xl flex flex-col gap-space-md" hoverLift>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant tracking-widest">
                  지출 모니터링
                </span>
                <h2 className="font-headline-md text-headline-md text-editorial-sage-light tracking-tight m-0">
                  가계부 바로가기
                </h2>
              </div>
              <Link
                to="/ai-feedback"
                className="font-label-numeric text-label-numeric text-on-surface-variant hover:text-editorial-sage-light transition-colors inline-flex items-center gap-1"
              >
                전체 내역 <MaterialIcon name="arrow_forward" className="text-[16px]" />
              </Link>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant m-0">
              이번 달 지출 합계{' '}
              <strong className="text-editorial-sage-light">{formatWon(expenseDisplay)}</strong>
              . 상세 거래·카테고리 분석은 AI 가계부에서 확인하세요.
            </p>
            <Link to="/ai-feedback" className="self-start">
              <Button variant="secondary" className="px-md py-2">
                AI 가계부 열기
              </Button>
            </Link>
          </Card>
        </div>

        {/* Secondary column */}
        <div className="lg:col-span-5 flex flex-col gap-space-xl section-reveal section-reveal-delay-2">
          <Card variant="architectural" className="p-space-lg lg:p-space-xl flex flex-col gap-space-md" hoverLift>
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-on-surface-variant tracking-widest">목표 진행</span>
              <span className="font-label-numeric text-label-numeric text-on-surface-variant">
                {progress != null ? `${progress}%` : '-'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-headline-md text-headline-md text-editorial-sage-light tracking-tight m-0">
                내가 가고 싶은 곳
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant m-0">프로필에 등록한 목표 금액 대비 현황</p>
            </div>
            <div className="flex items-baseline justify-between pt-space-xs gap-2 flex-wrap">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-headline-lg text-headline-lg text-editorial-sage-light tracking-tight financial-value">
                  {formatWon(assetsDisplay)}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">/ {formatWon(target)}</span>
              </div>
            </div>
            <ProgressBar value={progress ?? 0} heightClass="h-2" barClassName="bg-primary/80" animate={dataReady} />
            <Button
              variant="extruded"
              className="w-full py-space-sm px-space-lg mt-space-xs"
              onClick={handlePlanClick}
              disabled={!dataReady || surplus == null || surplus <= 0}
            >
              {planApplied ? (
                <span>✓ 절감 플랜 동기화 완료</span>
              ) : (
                <span>남는 돈 절감 플랜 가동하기</span>
              )}
            </Button>
            {!dataReady || surplus == null || surplus <= 0 ? (
              <p className="font-body-sm text-body-sm text-outline m-0">잉여가 계산되면 플랜 버튼이 활성화됩니다.</p>
            ) : null}
          </Card>

          <Card variant="architectural" className="p-space-lg flex items-center justify-between gap-md" hoverLift>
            <div className="flex flex-col gap-1 min-w-0">
              <span className="font-label-caps text-label-caps text-on-surface-variant tracking-wider">
                AI 재무 건전도 지수
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-lg text-headline-lg text-editorial-sage-light tracking-tight">
                  {healthScore ?? '-'}
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">/ 100</span>
              </div>
              <div className="flex items-center gap-space-xs flex-wrap">
                <span className="px-space-xs py-0.5 rounded bg-surface-container text-on-surface-variant font-label-caps text-label-caps">
                  {healthScore == null ? '데이터 필요' : healthScore >= 70 ? '안정권' : '개선 권고'}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">월 상환/수입 비율 기반</span>
              </div>
            </div>
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36" aria-hidden>
                <path
                  className="text-surface-charcoal"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="text-primary dashboard__ring"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={`${healthScore ?? 0}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <MaterialIcon name="shield_with_heart" className="text-primary text-[18px]" />
              </div>
            </div>
          </Card>

          <Card variant="architectural" className="p-space-lg flex flex-col gap-space-md" hoverLift>
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-on-surface-variant tracking-wider">
                부채 상환 최적화
              </span>
              <WipBadge />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-body-sm text-body-sm text-on-surface-variant">월 상환액</span>
              <span className="font-headline-md text-headline-md text-editorial-sage-light tracking-tight financial-value">
                {formatWon(payment)}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed m-0">
              고금리 우선·소액 우선 시나리오는 부채 분석에서 바로 적용해볼 수 있어요.
            </p>
            <Link
              to="/debt-analysis"
              className="w-full py-space-sm px-space-md rounded-DEFAULT bg-surface-container hover:bg-surface-bright text-editorial-sage-light font-label-numeric text-label-numeric flex items-center justify-between transition-all"
            >
              <span>시뮬레이션 적용 검증</span>
              <MaterialIcon name="arrow_forward" className="text-[18px]" />
            </Link>
          </Card>

          <div className="grid grid-cols-2 gap-space-md section-reveal section-reveal-delay-3">
            <Link to="/simulation">
              <Card
                variant="frosted"
                className="p-space-md rounded-lg flex flex-col justify-between gap-space-sm h-full"
                hoverLift
              >
                <div className="flex items-center justify-between">
                  <MaterialIcon name="savings" className="text-secondary text-[22px]" />
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-editorial-sage-light">만약에 시뮬</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">궤적 비교</span>
                </div>
              </Card>
            </Link>
            <Link to="/ai-report">
              <Card
                variant="frosted"
                className="p-space-md rounded-lg flex flex-col justify-between gap-space-sm h-full"
                hoverLift
              >
                <div className="flex items-center justify-between">
                  <MaterialIcon name="file_download" className="text-primary text-[22px]" />
                  <span className="font-label-caps text-label-caps text-primary">REPORT</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-editorial-sage-light">AI 리포트</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">심층 진단</span>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
