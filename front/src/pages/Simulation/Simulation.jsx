import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, MaterialIcon, SegmentedControl, WipBadge } from '../../components/common';
import { PageContainer } from '../../components/layout';
import { api } from '../../services/api';
import { getAccessToken } from '../../services/authStorage';
import './Simulation.css';

const SCENARIOS = [
  { id: 'hold', icon: 'trending_flat', title: '지금처럼 쭉', desc: '지금 패턴 그대로 가보면' },
  { id: 'save', icon: 'savings', title: '한 달 10만원 모으기', desc: '아낀 돈을 저축으로 돌리면' },
  { id: 'repay', icon: 'payments', title: '한 달 10만원 더 갚기', desc: '빚 원금부터 줄여보면' },
  { id: 'rate', icon: 'percent', title: '금리가 오른다면', desc: '기준금리 +1%p일 때' },
];

const RANGE_OPTIONS = [
  { id: '1y', label: '1년' },
  { id: '3y', label: '3년' },
  { id: '5y', label: '5년' },
];

const QUICK_CHIPS = [
  '금리가 0.5% 오르면?',
  '보너스 500만원을 빚 갚는데 쓰면?',
  '배달비를 월 10만원 줄이면?',
  '생활비를 15% 줄이면?',
];

const DEFAULT_CHART = {
  assetPath: 'M0,85 L25,84 L50,83 L75,82 L100,81',
  holdPath: 'M0,85 L25,84 L50,83 L75,82 L100,81',
  debtPath: 'M0,45 L25,45 L50,45 L75,45 L100,45',
  yMaxLabel: '',
};

const CHART_ASSET = '#18C77A';
const CHART_DEBT = '#FF5C4D';
const CHART_HOLD = '#869488';

export default function Simulation() {
  const [prompt, setPrompt] = useState('배달비를 월 10만원 줄이면?');
  const [activeScenario, setActiveScenario] = useState(null);
  const [range, setRange] = useState('5y');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState(null);

  const activeMeta = SCENARIOS.find((item) => item.id === activeScenario) || null;
  const chart = result?.chart || DEFAULT_CHART;
  const chartKey = `${chart.assetPath}|${chart.debtPath}|${chart.holdPath}`;
  const xLabels = chart.xLabels || ['현재', '1년', '2년', '3년', '4년', '5년'];
  const gapLabelKey = result?.range === '5y' || range === '5y' ? '5년 뒤 자산 차이' : '기간 끝 자산 차이';

  const runSimulation = useCallback(
    async ({ scenario, promptText, rangeOverride } = {}) => {
      setErrorMessage('');

      if (!getAccessToken()) {
        setErrorMessage('로그인이 필요해요. 로그인하고 다시 시도해주세요.');
        return;
      }

      const nextScenario = scenario ?? activeScenario ?? 'custom';
      const nextRange = rangeOverride ?? range;

      setIsLoading(true);
      try {
        const data = await api.runSimulation({
          prompt: (promptText ?? prompt).trim(),
          scenario: nextScenario,
          range: nextRange,
        });
        setResult(data);
      } catch (error) {
        if (error?.status === 401) {
          setErrorMessage('로그인이 끊겼어요. 다시 로그인해주세요.');
        } else if (error?.status === 502) {
          setErrorMessage('지금은 연결이 원활하지 않아요. 잠시 후 다시 시도해주세요.');
        } else {
          setErrorMessage(error?.message || '계산에 실패했어요. 다시 시도해주세요.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [prompt, activeScenario, range]
  );

  /** 직접 질문 → 시나리오 카드 전부 off */
  const handleSubmit = (event) => {
    event.preventDefault();
    setActiveScenario(null);
    runSimulation({ scenario: 'custom' });
  };

  /** 시나리오 카드 → 선택·그래프 즉시 다시 그림 */
  const handleScenarioClick = (id) => {
    if (isLoading) return;
    setActiveScenario(id);
    runSimulation({ scenario: id });
  };

  const handleRangeChange = (id) => {
    if (isLoading || id === range) return;
    setRange(id);
    if (result || activeScenario) {
      runSimulation({
        scenario: activeScenario || 'custom',
        rangeOverride: id,
      });
    }
  };

  return (
    <PageContainer className="gap-space-2xl">
      <header className="section-reveal flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
        <div className="flex flex-col gap-sm min-w-0">
          <h1 className="font-display text-[2.5rem] sm:text-display lg:text-[4rem] text-editorial-sage-light tracking-tight leading-none m-0">
            만약에…
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl m-0">
            아래 시나리오를 하나 골라보거나, 궁금한 걸 직접 적고 「그려보기」를 눌러보세요.
          </p>
        </div>
        <SegmentedControl
          options={RANGE_OPTIONS}
          value={range}
          onChange={handleRangeChange}
          disabled={isLoading}
          className="self-start lg:self-auto shrink-0"
        />
      </header>

      <section className="section-reveal section-reveal-delay-1 flex flex-col gap-space-md">
        <form
          className="w-full bg-surface-charcoal border border-border-hairline/80 p-2 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center gap-2 shadow-lg"
          onSubmit={handleSubmit}
        >
          <div className="flex items-center gap-3 w-full px-4 py-2.5 bg-surface-architectural/80 rounded-xl min-w-0">
            <MaterialIcon name="neurology" className="text-outline text-[20px] shrink-0" />
            <input
              className="w-full min-w-0 bg-transparent border-none focus:ring-0 focus:outline-none font-body-md text-body-md text-editorial-sage-light placeholder:text-outline"
              placeholder="예: 배달비를 월 10만원 줄이면? 또는 매달 20만원을 추가 상환하면?"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
            />
            {prompt ? (
              <button
                type="button"
                className="text-outline hover:text-editorial-sage-light transition-colors p-1 shrink-0"
                onClick={() => setPrompt('')}
                disabled={isLoading}
                title="입력 초기화"
              >
                <MaterialIcon name="close" className="text-[18px]" />
              </button>
            ) : null}
          </div>
          <Button
            type="submit"
            variant="extruded"
            className="w-full md:w-auto shrink-0 px-6 py-3.5 rounded-xl"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <MaterialIcon name="progress_activity" className="text-[18px] animate-spin" />
                <span>연산 중…</span>
              </>
            ) : (
              <>
                <MaterialIcon name="bolt" className="text-[18px]" />
                <span>그려보기</span>
              </>
            )}
          </Button>
        </form>

        {errorMessage ? (
          <p className="text-body-sm font-body-sm text-signal-risk m-0" role="alert">
            {errorMessage}{' '}
            {errorMessage.includes('로그인') ? (
              <Link to="/login" className="underline text-editorial-sage-light">
                로그인
              </Link>
            ) : null}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider mr-1">
            추천 가상 변수:
          </span>
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              className="px-3.5 py-1.5 rounded-full bg-surface-charcoal hover:bg-surface-container-high border border-border-hairline text-editorial-sage-muted font-body-sm text-body-sm transition-all hover:text-primary min-h-[40px]"
              onClick={() => setPrompt(chip)}
              disabled={isLoading}
            >
              {chip}
            </button>
          ))}
        </div>
      </section>

      {/* Chart focal */}
      <Card
        variant="architectural"
        className="section-reveal section-reveal-delay-2 p-space-lg lg:p-space-xl flex flex-col gap-space-lg relative overflow-hidden"
      >
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-signal-risk/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md z-10">
          <div className="flex items-center gap-space-md min-w-0">
            <div className="w-12 h-12 rounded-xl bg-surface-charcoal border border-border-hairline flex items-center justify-center text-primary shadow-inner shrink-0">
              <MaterialIcon name="insights" className="text-[28px]" />
            </div>
            <div className="min-w-0">
              <h2 className="font-headline-md text-headline-md text-editorial-sage-light tracking-tight m-0">
                앞으로의 돈 흐름
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant m-0 mt-0.5">
                {result?.scenarioLabel || activeMeta?.title || '아직 시나리오를 고르지 않았어요'}
                {result?.rangeLabel ? ` · ${result.rangeLabel}` : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-space-md bg-surface-charcoal/80 border border-border-hairline px-4 py-2 rounded-xl self-start">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: CHART_ASSET, boxShadow: `0 0 8px ${CHART_ASSET}` }}
              />
              <span className="font-label-numeric text-label-numeric text-editorial-sage-muted">
                이 시나리오 자산
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: CHART_DEBT, boxShadow: `0 0 8px ${CHART_DEBT}` }}
              />
              <span className="font-label-numeric text-label-numeric text-editorial-sage-muted">남은 빚</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full border border-outline bg-transparent" />
              <span className="font-label-numeric text-label-numeric text-editorial-sage-muted">
                지금처럼 뒀을 때
              </span>
            </div>
          </div>
        </div>

        <div className="simulation__chart relative w-full min-h-[220px] sm:min-h-[280px] lg:min-h-[360px] bg-surface-charcoal/90 rounded-xl p-4 flex flex-col justify-between z-10 shadow-inner border border-border-hairline/60 chart-responsive--clip">
          <div className="absolute left-3 top-4 bottom-10 flex flex-col justify-between text-[10px] sm:text-xs text-on-surface-variant w-8 sm:w-10 pointer-events-none">
            <span className="truncate">{chart.yMaxLabel || '높음'}</span>
            <span className="truncate">중간</span>
            <span className="truncate">낮음</span>
            <span>0</span>
          </div>
          <div className="absolute inset-4 bottom-10 left-12 sm:left-14 flex flex-col justify-between pointer-events-none">
            <div className="w-full border-t border-border-subtle border-dashed opacity-50" />
            <div className="w-full border-t border-border-subtle border-dashed opacity-50" />
            <div className="w-full border-t border-border-subtle border-dashed opacity-50" />
            <div className="w-full" />
          </div>
          <svg
            key={chartKey}
            className="simulation__chart-svg absolute bottom-10 left-12 sm:left-14 right-4 top-4 transition-opacity duration-500 ease-out"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <path
              d={chart.assetPath}
              fill="none"
              stroke={CHART_ASSET}
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={chart.holdPath}
              fill="none"
              opacity="0.55"
              stroke={CHART_HOLD}
              strokeDasharray="3,3"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={chart.debtPath}
              fill="none"
              stroke={CHART_DEBT}
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="absolute bottom-2 left-12 sm:left-14 right-4 flex justify-between text-[10px] sm:text-xs text-on-surface-variant gap-1">
            {xLabels.map((label) => (
              <span key={label} className="truncate">
                {label}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* Scenario matrix */}
      <section className="section-reveal section-reveal-delay-3 flex flex-col gap-space-md">
        <div className="flex items-end justify-between gap-sm flex-wrap">
          <div>
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-wider">
              SCENARIO MATRIX
            </span>
            <h2 className="font-headline-md text-headline-md text-editorial-sage-light tracking-tight m-0">
              가상 시나리오 비교
            </h2>
          </div>
          <span className="font-body-sm text-body-sm text-outline hidden md:block">
            카드 클릭 시 해당 시나리오가 바로 적용됩니다
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {SCENARIOS.map((item) => {
            const isActive = activeScenario === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleScenarioClick(item.id)}
                disabled={isLoading}
                className={`text-left p-6 rounded-2xl shadow-sm flex flex-col justify-between gap-space-md relative transition-all duration-300 hover:-translate-y-0.5 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed ${
                  isActive
                    ? 'bg-surface-architectural border-2 border-primary'
                    : 'bg-surface-charcoal/80 border border-border-hairline hover:bg-surface-architectural'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-label-caps text-label-caps uppercase tracking-wider ${
                      isActive ? 'text-primary font-bold' : 'text-outline'
                    }`}
                  >
                    {isActive ? '선택된 시나리오' : '시나리오'}
                  </span>
                  <MaterialIcon
                    name={isActive ? 'check_circle' : 'radio_button_unchecked'}
                    className={isActive ? 'text-primary text-[22px]' : 'text-outline text-[20px]'}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <MaterialIcon
                      name={item.icon}
                      className={isActive ? 'text-primary' : 'text-on-surface-variant'}
                    />
                    <h3 className="font-headline-sm text-headline-sm text-editorial-sage-light m-0 font-bold">
                      {item.title}
                    </h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant m-0 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Results + WIP CTA */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg section-reveal">
        <Card variant="architectural" className="lg:col-span-2 p-space-lg flex flex-col gap-space-md" hoverLift>
          <div className="flex items-center gap-sm">
            <MaterialIcon name="insights" className="text-secondary" />
            <h3 className="font-headline-sm text-headline-sm text-editorial-sage-light m-0">
              이렇게 달라질 수 있어요
            </h3>
          </div>
          <div className="bg-surface-charcoal/80 rounded-lg p-space-md border-l-4 border-secondary">
            <p className="font-body-md text-body-md text-editorial-sage-light m-0">
              {isLoading
                ? '시나리오를 계산해 보는 중…'
                : result?.insight || '시나리오를 고르면 여기에 결과가 나타나요.'}
            </p>
          </div>
          <div className="flex flex-col gap-sm">
            <div className="flex justify-between items-center gap-sm py-xs border-b border-border-subtle">
              <span className="font-body-sm text-body-sm text-on-surface-variant min-w-0">{gapLabelKey}</span>
              <span className="font-label-numeric text-label-numeric text-signal-positive font-bold financial-value shrink-0">
                {result?.assetGapLabel || '-'}
              </span>
            </div>
            <div className="flex justify-between items-center gap-sm py-xs border-b border-border-subtle">
              <span className="font-body-sm text-body-sm text-on-surface-variant min-w-0">목표, 얼마나 빨라질까</span>
              <span className="font-label-numeric text-label-numeric text-editorial-sage-light font-bold shrink-0">
                {result?.goalAcceleration || '-'}
              </span>
            </div>
            <div className="flex justify-between items-center gap-sm py-xs border-b border-border-subtle">
              <span className="font-body-sm text-body-sm text-on-surface-variant min-w-0">가정한 연 수익률</span>
              <span className="font-label-numeric text-label-numeric text-editorial-sage-light font-bold shrink-0">
                {result?.annualReturn || '-'}
              </span>
            </div>
          </div>
          {result?.strategy ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant m-0 pt-space-xs">
              {result.strategy}
            </p>
          ) : null}
        </Card>

        <Card variant="frosted" className="p-space-lg flex flex-col gap-space-md justify-between">
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between gap-sm">
              <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                다음에 해볼 일
              </span>
              <WipBadge />
            </div>
            <h4 className="font-headline-sm text-headline-sm text-editorial-sage-light m-0">
              자동이체 연동
            </h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant m-0">
              {result?.strategy || '시나리오를 하나 골라보면 다음에 해볼 일을 알려드려요.'}
            </p>
          </div>
          <Button
            variant="extruded"
            fullWidth
            className="py-space-sm min-h-[44px]"
            type="button"
            disabled
            title="공사중"
          >
            자동이체 설정하기
            <WipBadge />
          </Button>
        </Card>
      </section>
    </PageContainer>
  );
}
