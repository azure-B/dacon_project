import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, MaterialIcon } from '../../components/common';
import { api } from '../../services/api';
import { getAccessToken } from '../../services/authStorage';
import './Simulation.css';

const SCENARIOS = [
  { id: 'hold', icon: 'trending_flat', title: '지금처럼 쭉', desc: '지금 패턴 그대로 가보면' },
  { id: 'save', icon: 'savings', title: '한 달 10만원 모으기', desc: '아낀 돈을 저축으로 돌리면' },
  { id: 'repay', icon: 'payments', title: '한 달 10만원 더 갚기', desc: '빚 원금부터 줄여보면' },
  { id: 'rate', icon: 'percent', title: '금리가 오른다면', desc: '기준금리 +1%p일 때' },
];

const DEFAULT_CHART = {
  assetPath: 'M0,85 L25,84 L50,83 L75,82 L100,81',
  holdPath: 'M0,85 L25,84 L50,83 L75,82 L100,81',
  debtPath: 'M0,45 L25,45 L50,45 L75,45 L100,45',
  yMaxLabel: '',
};

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
    <div className="flex flex-1 min-w-0 overflow-x-hidden page-shell">
      <div className="flex-1 p-3 sm:p-margin-mobile md:p-margin-desktop flex flex-col gap-lg md:gap-xl min-w-0">
        <header className="flex flex-col gap-sm">
          <h1 className="text-headline-lg-mobile md:text-display-lg font-display-lg text-primary">만약에…</h1>
          <p className="text-body-sm md:text-body-lg font-body-lg text-on-surface-variant max-w-2xl">
            아래 시나리오를 하나 골라보거나, 궁금한 걸 직접 적고 「그려보기」를 눌러보세요.
          </p>
        </header>

        <section className="w-full max-w-4xl mx-auto min-w-0">
          <form
            className="bg-surface-container-lowest border border-outline-variant rounded-xl p-sm shadow-sm flex flex-col sm:flex-row sm:items-center gap-sm transition-all focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20"
            onSubmit={handleSubmit}
          >
            <div className="flex items-center flex-1 min-w-0 w-full">
              <MaterialIcon name="edit_note" className="text-outline ml-sm mr-sm shrink-0" />
              <input
                className="w-full min-w-0 bg-transparent border-none focus:ring-0 text-body-sm md:text-body-md font-body-md text-on-surface placeholder:text-outline h-12"
                placeholder="예: 배달비를 월 10만원 줄이면? 또는 매달 20만원을 추가 상환하면?"
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="px-md md:px-lg py-sm sm:ml-sm whitespace-nowrap h-12 w-full sm:w-auto shrink-0" disabled={isLoading}>
              <MaterialIcon name="play_arrow" className="text-[18px]" />
              <span className="hidden md:inline">{isLoading ? '그려보는 중…' : '그려보기'}</span>
              <span className="md:hidden">{isLoading ? '그리는 중' : '그려보기'}</span>
            </Button>
          </form>
          {errorMessage ? (
            <p className="text-body-sm text-error mt-sm m-0" role="alert">
              {errorMessage}{' '}
              {errorMessage.includes('로그인') ? (
                <Link to="/login" className="underline">
                  로그인
                </Link>
              ) : null}
            </p>
          ) : null}
          <div className="flex gap-sm mt-sm flex-wrap">
            <span className="text-label-sm font-label-sm text-on-surface-variant py-1">이런 것도 궁금하지 않나요:</span>
            <button
              type="button"
              className="text-label-sm font-label-sm bg-surface-container-low text-on-surface-variant px-sm py-2 rounded-full border border-outline-variant hover:bg-surface-variant transition-colors min-h-[44px]"
              onClick={() => setPrompt('금리가 0.5% 오르면?')}
              disabled={isLoading}
            >
              금리가 0.5% 오르면?
            </button>
            <button
              type="button"
              className="text-label-sm font-label-sm bg-surface-container-low text-on-surface-variant px-sm py-2 rounded-full border border-outline-variant hover:bg-surface-variant transition-colors min-h-[44px]"
              onClick={() => setPrompt('보너스 500만원을 빚 갚는데 쓰면?')}
              disabled={isLoading}
            >
              보너스 500만원을 빚 갚는데 쓰면?
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-sm md:gap-md">
          {SCENARIOS.map((item) => {
            const isActive = activeScenario === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleScenarioClick(item.id)}
                disabled={isLoading}
                className={`bg-surface-container-lowest p-md rounded-lg shadow-sm text-left transition-shadow group min-h-[44px] ${
                  isActive
                    ? 'border-2 border-secondary relative overflow-hidden'
                    : 'border border-outline-variant hover:shadow-md focus:border-secondary focus:ring-1 focus:ring-secondary'
                }`}
              >
                {isActive ? (
                  <div className="absolute top-0 right-0 bg-secondary text-on-secondary px-2 py-1 rounded-bl-lg text-[10px] font-bold">
                    선택됨
                  </div>
                ) : null}
                <div className="flex justify-between items-start mb-sm">
                  <MaterialIcon
                    name={item.icon}
                    className={isActive ? 'text-secondary' : 'text-on-surface-variant group-hover:text-primary transition-colors'}
                  />
                </div>
                <h3 className="text-headline-sm font-headline-sm text-primary mb-xs">{item.title}</h3>
                <p className="text-body-sm font-body-sm text-on-surface-variant">{item.desc}</p>
              </button>
            );
          })}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-md lg:gap-lg min-w-0">
          <Card className="lg:col-span-2 p-md md:p-lg flex flex-col overflow-hidden min-w-0">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-sm md:gap-0 mb-md">
              <div>
                <h2 className="text-headline-sm font-headline-sm text-primary">앞으로의 돈 흐름</h2>
                <p className="text-body-sm font-body-sm text-on-surface-variant mt-xs">
                  {result?.scenarioLabel || activeMeta?.title || '아직 시나리오를 고르지 않았어요'}
                  {result?.rangeLabel ? ` · ${result.rangeLabel}` : ''}
                </p>
              </div>
              <div className="flex bg-surface-container-low rounded-lg p-xs self-start md:self-auto">
                {[
                  { id: '1y', label: '1년' },
                  { id: '3y', label: '3년' },
                  { id: '5y', label: '5년' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleRangeChange(item.id)}
                    disabled={isLoading}
                    className={`px-sm py-xs text-label-sm font-label-sm rounded-md min-h-[44px] min-w-[44px] ${
                      range === item.id
                        ? 'bg-surface-container-lowest shadow-sm text-primary font-bold'
                        : 'text-on-surface-variant hover:bg-surface-variant'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="chart-responsive--clip flex-1 min-h-[220px] sm:min-h-[250px] md:min-h-[300px] relative mt-md border-b border-l border-outline-variant pl-8 sm:pl-10 md:pl-12 pb-8">
              <div className="absolute left-0 top-0 h-[calc(100%-2rem)] flex flex-col justify-between text-[10px] sm:text-xs text-on-surface-variant w-7 sm:w-9 md:w-10 shrink-0">
                <span className="truncate">{chart.yMaxLabel || '높음'}</span>
                <span className="truncate">중간</span>
                <span className="truncate">낮음</span>
                <span>0</span>
              </div>
              <div className="absolute inset-0 bottom-8 left-8 sm:left-10 md:left-12 flex flex-col justify-between pointer-events-none">
                <div className="w-full border-t border-outline-variant border-dashed opacity-50" />
                <div className="w-full border-t border-outline-variant border-dashed opacity-50" />
                <div className="w-full border-t border-outline-variant border-dashed opacity-50" />
                <div className="w-full" />
              </div>
              <svg
                key={chartKey}
                className="absolute bottom-8 left-8 sm:left-10 md:left-12 right-0 h-[calc(100%-2rem)] w-[calc(100%-2rem)] sm:w-[calc(100%-2.5rem)] md:w-[calc(100%-3rem)] transition-all duration-500 ease-out"
                preserveAspectRatio="none"
                viewBox="0 0 100 100"
              >
                <path
                  d={chart.assetPath}
                  fill="none"
                  stroke="#2B6CB0"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d={chart.holdPath}
                  fill="none"
                  opacity="0.5"
                  stroke="#2B6CB0"
                  strokeDasharray="2,2"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d={chart.debtPath}
                  fill="none"
                  stroke="#ba1a1a"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <div className="absolute bottom-0 left-8 sm:left-10 md:left-12 right-0 flex justify-between text-[10px] sm:text-xs text-on-surface-variant gap-1">
                {xLabels.map((label) => (
                  <span key={label} className="truncate">
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-sm md:gap-lg mt-md md:mt-xl pt-sm">
              <div className="flex items-center gap-xs">
                <div className="w-3 h-3 rounded-full bg-[#2B6CB0]" />
                <span className="text-label-sm font-label-sm text-on-surface-variant">이 시나리오 자산</span>
              </div>
              <div className="flex items-center gap-xs">
                <div className="w-3 h-3 rounded-full border border-[#2B6CB0] bg-transparent flex items-center justify-center">
                  <div className="w-full border-t border-[#2B6CB0] border-dashed" />
                </div>
                <span className="text-label-sm font-label-sm text-on-surface-variant">지금처럼 뒀을 때</span>
              </div>
              <div className="flex items-center gap-xs">
                <div className="w-3 h-3 rounded-full bg-error" />
                <span className="text-label-sm font-label-sm text-on-surface-variant">남은 빚</span>
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-md">
            <Card className="p-md flex-1">
              <div className="flex items-center gap-sm mb-md">
                <MaterialIcon name="insights" className="text-secondary" />
                <h3 className="text-headline-sm font-headline-sm text-primary">이렇게 달라질 수 있어요</h3>
              </div>
              <div className="bg-surface-container-low rounded-lg p-sm mb-md border-l-4 border-secondary">
                <p className="text-body-md font-body-md text-on-surface">
                  {isLoading
                    ? '시나리오를 계산해 보는 중…'
                    : result?.insight || '시나리오를 고르면 여기에 결과가 나타나요.'}
                </p>
              </div>
              <div className="flex flex-col gap-sm">
                <div className="flex justify-between items-center gap-sm py-xs border-b border-outline-variant">
                  <span className="text-body-sm font-body-sm text-on-surface-variant min-w-0">{gapLabelKey}</span>
                  <span className="text-label-md font-label-md text-[#00b47d] font-bold financial-value shrink-0">
                    {result?.assetGapLabel || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-sm py-xs border-b border-outline-variant">
                  <span className="text-body-sm font-body-sm text-on-surface-variant min-w-0">목표, 얼마나 빨라질까</span>
                  <span className="text-label-md font-label-md text-primary font-bold shrink-0">
                    {result?.goalAcceleration || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-sm py-xs border-b border-outline-variant">
                  <span className="text-body-sm font-body-sm text-on-surface-variant min-w-0">가정한 연 수익률</span>
                  <span className="text-label-md font-label-md text-primary font-bold shrink-0">
                    {result?.annualReturn || '-'}
                  </span>
                </div>
              </div>
            </Card>
            <div className="bg-primary-container text-on-primary-container rounded-xl shadow-sm p-md">
              <h4 className="text-headline-sm font-headline-sm mb-xs text-on-primary-fixed">다음에 해볼 일</h4>
              <p className="text-body-sm font-body-sm mb-md opacity-90">
                {result?.strategy || '시나리오를 하나 골라보면 다음에 해볼 일을 알려드려요.'}
              </p>
              <Button variant="secondary" fullWidth className="py-sm min-h-[44px]" type="button" disabled title="공사중">
                자동이체 설정하기
                <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200/80">
                  공사중
                </span>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
