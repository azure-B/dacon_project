import { useState } from 'react';
import { Button, Card, MaterialIcon } from '../../components/common';
import './Simulation.css';

const SCENARIOS = [
  { id: 'hold', icon: 'trending_flat', title: '현재 유지', desc: '현재의 수입/지출 패턴 유지' },
  { id: 'save', icon: 'savings', title: '월 10만원 저축', desc: '지출 절감액을 저축으로 전환', active: true },
  { id: 'repay', icon: 'payments', title: '월 10만원 추가 상환', desc: '대출 원금 우선 상환 전략' },
  { id: 'rate', icon: 'percent', title: '금리 변동', desc: '스트레스 테스트 (기준금리 +1%)' },
];

export default function Simulation() {
  const [prompt, setPrompt] = useState('배달비를 월 10만원 줄이면?');
  const [activeScenario, setActiveScenario] = useState('save');
  const [range, setRange] = useState('1y');

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 p-margin-mobile md:p-margin-desktop flex flex-col gap-xl">
        <header className="flex flex-col gap-sm">
          <h1 className="text-headline-lg-mobile md:text-display-lg font-display-lg text-primary">재무 시뮬레이션</h1>
          <p className="text-body-sm md:text-body-lg font-body-lg text-on-surface-variant max-w-2xl">
            다양한 금융 시나리오를 바탕으로 미래의 자산 및 부채 흐름을 예측하고 최적의 전략을 도출합니다.
          </p>
        </header>

        <section className="w-full max-w-4xl mx-auto">
          <form
            className="bg-surface-container-lowest border border-outline-variant rounded-xl p-sm shadow-sm flex items-center transition-all focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20"
            onSubmit={handleSubmit}
          >
            <MaterialIcon name="smart_toy" className="text-outline ml-sm mr-sm" />
            <input
              className="w-full bg-transparent border-none focus:ring-0 text-body-sm md:text-body-md font-body-md text-on-surface placeholder:text-outline h-12"
              placeholder="예: 배달비를 월 10만원 줄이면? 또는 매달 20만원을 추가 상환하면?"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <Button type="submit" className="px-md md:px-lg py-sm ml-sm whitespace-nowrap h-auto">
              <MaterialIcon name="play_arrow" className="text-[18px]" />
              <span className="hidden md:inline">시뮬레이션 실행</span>
              <span className="md:hidden">실행</span>
            </Button>
          </form>
          <div className="flex gap-sm mt-sm flex-wrap">
            <span className="text-label-sm font-label-sm text-on-surface-variant py-1">추천 질문:</span>
            <button
              type="button"
              className="text-label-sm font-label-sm bg-surface-container-low text-on-surface-variant px-sm py-1 rounded-full border border-outline-variant hover:bg-surface-variant transition-colors"
              onClick={() => setPrompt('금리가 0.5% 오르면?')}
            >
              금리가 0.5% 오르면?
            </button>
            <button
              type="button"
              className="text-label-sm font-label-sm bg-surface-container-low text-on-surface-variant px-sm py-1 rounded-full border border-outline-variant hover:bg-surface-variant transition-colors"
              onClick={() => setPrompt('보너스 500만원을 빚 갚는데 쓰면?')}
            >
              보너스 500만원을 빚 갚는데 쓰면?
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
          {SCENARIOS.map((item) => {
            const isActive = activeScenario === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveScenario(item.id)}
                className={`bg-surface-container-lowest p-md rounded-lg shadow-sm text-left transition-shadow group ${
                  isActive
                    ? 'border-2 border-secondary relative overflow-hidden'
                    : 'border border-outline-variant hover:shadow-md focus:border-secondary focus:ring-1 focus:ring-secondary'
                }`}
              >
                {isActive ? (
                  <div className="absolute top-0 right-0 bg-secondary text-on-secondary px-2 py-1 rounded-bl-lg text-[10px] font-bold">
                    활성 시나리오
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

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          <Card className="lg:col-span-2 p-md md:p-lg flex flex-col overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-sm md:gap-0 mb-md">
              <div>
                <h2 className="text-headline-sm font-headline-sm text-primary">자산/부채 추이 시뮬레이션</h2>
                <p className="text-body-sm font-body-sm text-on-surface-variant mt-xs">시나리오: 월 10만원 저축 (배달비 절감)</p>
              </div>
              <div className="flex bg-surface-container-low rounded-lg p-xs self-start md:self-auto">
                {[
                  { id: '3m', label: '3개월' },
                  { id: '6m', label: '6개월' },
                  { id: '1y', label: '1년' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRange(item.id)}
                    className={`px-sm py-xs text-label-sm font-label-sm rounded-md ${
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
            <div className="flex-1 min-h-[250px] md:min-h-[300px] relative mt-md border-b border-l border-outline-variant ml-8 md:ml-10">
              <div className="absolute left-[-35px] md:left-[-45px] top-0 h-full flex flex-col justify-between text-[10px] text-on-surface-variant">
                <span>1.5억</span>
                <span>1.0억</span>
                <span>5천만</span>
                <span>0</span>
              </div>
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="w-full border-t border-outline-variant border-dashed opacity-50" />
                <div className="w-full border-t border-outline-variant border-dashed opacity-50" />
                <div className="w-full border-t border-outline-variant border-dashed opacity-50" />
                <div className="w-full" />
              </div>
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M0,80 L20,75 L40,65 L60,55 L80,45 L100,30" fill="none" stroke="#2B6CB0" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <path
                  d="M0,80 L20,78 L40,75 L60,72 L80,70 L100,65"
                  fill="none"
                  opacity="0.5"
                  stroke="#2B6CB0"
                  strokeDasharray="2,2"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M0,40 L20,42 L40,43 L60,45 L80,48 L100,50" fill="none" stroke="#ba1a1a" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="absolute bottom-[-25px] w-full flex justify-between text-[10px] text-on-surface-variant px-1 md:px-sm">
                <span>현재</span>
                <span>3개월</span>
                <span>6개월</span>
                <span>9개월</span>
                <span>1년</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-sm md:gap-lg mt-xl pt-sm">
              <div className="flex items-center gap-xs">
                <div className="w-3 h-3 rounded-full bg-[#2B6CB0]" />
                <span className="text-label-sm font-label-sm text-on-surface-variant">예상 총 자산</span>
              </div>
              <div className="flex items-center gap-xs">
                <div className="w-3 h-3 rounded-full border border-[#2B6CB0] bg-transparent flex items-center justify-center">
                  <div className="w-full border-t border-[#2B6CB0] border-dashed" />
                </div>
                <span className="text-label-sm font-label-sm text-on-surface-variant">현재 유지 시 (자산)</span>
              </div>
              <div className="flex items-center gap-xs">
                <div className="w-3 h-3 rounded-full bg-error" />
                <span className="text-label-sm font-label-sm text-on-surface-variant">예상 총 부채</span>
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-md">
            <Card className="p-md flex-1">
              <div className="flex items-center gap-sm mb-md">
                <MaterialIcon name="psychology" className="text-secondary" />
                <h3 className="text-headline-sm font-headline-sm text-primary">인공지능 시뮬레이션 결과</h3>
              </div>
              <div className="bg-surface-container-low rounded-lg p-sm mb-md border-l-4 border-secondary">
                <p className="text-body-md font-body-md text-on-surface">
                  매월 배달비 10만원을 절감하여 연 5% 수익률의 적금에 투자할 경우, 1년 뒤 자산이 <strong>1,227,000원</strong> 추가
                  증가합니다.
                </p>
              </div>
              <div className="flex flex-col gap-sm">
                <div className="flex justify-between items-center py-xs border-b border-outline-variant">
                  <span className="text-body-sm font-body-sm text-on-surface-variant">1년 후 예상 자산 격차</span>
                  <span className="text-label-md font-label-md text-[#00b47d] font-bold">+ 120만 원</span>
                </div>
                <div className="flex justify-between items-center py-xs border-b border-outline-variant">
                  <span className="text-body-sm font-body-sm text-on-surface-variant">목표 달성 시기 단축</span>
                  <span className="text-label-md font-label-md text-primary font-bold">2개월 단축</span>
                </div>
                <div className="flex justify-between items-center py-xs border-b border-outline-variant">
                  <span className="text-body-sm font-body-sm text-on-surface-variant">투자 수익률 (연환산)</span>
                  <span className="text-label-md font-label-md text-primary font-bold">5.0%</span>
                </div>
              </div>
            </Card>
            <div className="bg-primary-container text-on-primary-container rounded-xl shadow-sm p-md">
              <h4 className="text-headline-sm font-headline-sm mb-xs text-on-primary-fixed">전략 제안</h4>
              <p className="text-body-sm font-body-sm mb-md opacity-90">
                현재 시나리오가 긍정적입니다. 해당 전략을 실제 재무 목표에 적용하시겠습니까?
              </p>
              <Button variant="secondary" fullWidth className="py-sm">
                자동이체 설정하기
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
