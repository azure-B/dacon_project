import { Card, MaterialIcon } from '../../components/common';
import './Dashboard.css';

const SUMMARY_CARDS = [
  {
    title: '현재 보유 자산',
    icon: 'account_balance_wallet',
    iconClass: 'text-secondary',
    value: '₩ 3,000,000',
    hint: '+2.4% 전월 대비',
    hintClass: 'text-tertiary-fixed-dim',
  },
  {
    title: '현재 부채',
    icon: 'credit_card_off',
    iconClass: 'text-error',
    value: '₩ 8,500,000',
    hint: '-1.2% 전월 대비',
    hintClass: 'text-error',
  },
  {
    title: '월 수입',
    icon: 'payments',
    iconClass: 'text-secondary',
    value: '₩ 4,200,000',
    hint: '정기 급여',
    hintClass: 'text-on-surface-variant',
  },
  {
    title: '월 지출',
    icon: 'shopping_cart',
    iconClass: 'text-on-surface-variant',
    value: '₩ 2,800,000',
    hint: '예산의 66% 사용',
    hintClass: 'text-on-surface-variant',
  },
];

export default function Dashboard() {
  return (
    <div className="flex flex-1 relative max-w-container-max mx-auto w-full page-shell min-w-0">
      <div className="flex-1 px-3 sm:px-margin-mobile md:px-margin-desktop py-lg md:py-xl w-full max-w-[1200px] mx-auto min-w-0">
        <header className="mb-lg md:mb-xl">
          <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-primary mb-xs break-keep">재무 대시보드</h1>
          <p className="text-body-sm md:text-body-md font-body-md text-on-surface-variant">현재 재무 상태와 목표 진행률을 확인하세요.</p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-sm sm:gap-md mb-lg md:mb-xl">
          {SUMMARY_CARDS.map((card) => (
            <div
              key={card.title}
              className="glass-card rounded-xl p-md flex flex-col justify-between min-h-[7.5rem] sm:h-32 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex justify-between items-center mb-sm gap-sm min-w-0">
                <h3 className="text-label-md font-label-md text-on-surface-variant truncate">{card.title}</h3>
                <MaterialIcon name={card.icon} className={`${card.iconClass} text-xl shrink-0`} />
              </div>
              <div className="min-w-0">
                <p className="text-headline-sm sm:text-headline-md font-headline-md text-primary financial-value">{card.value}</p>
                <p className={`text-label-sm font-label-sm mt-xs ${card.hintClass}`}>{card.hint}</p>
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg md:gap-xl mb-lg md:mb-xl">
          <div className="lg:col-span-1 flex flex-col gap-md">
            <div className="glass-card rounded-xl p-md md:p-lg flex flex-col">
              <h2 className="text-headline-sm font-headline-sm text-primary mb-md">현금 흐름 분석</h2>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-xs py-sm border-b border-outline-variant">
                <span className="text-body-sm font-body-sm text-on-surface-variant">월 고정지출</span>
                <span className="text-body-md font-body-md text-primary font-medium financial-value">₩ 1,500,000</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-xs py-sm pt-md">
                <span className="text-body-sm font-body-sm text-on-surface-variant">월 잉여 자금</span>
                <span className="text-body-md font-body-md text-tertiary-fixed-dim font-bold financial-value">₩ 1,400,000</span>
              </div>
              <div className="mt-lg pt-lg border-t border-outline-variant">
                <p className="text-label-sm font-label-sm text-on-surface-variant mb-sm flex items-center gap-xs">
                  <MaterialIcon name="info" className="text-xs" /> AI 인사이트
                </p>
                <p className="text-body-sm font-body-sm text-primary bg-surface-container-low p-sm rounded-lg border border-outline-variant">
                  잉여 자금의 40%를 부채 상환에 할당하는 것을 권장합니다.
                </p>
              </div>
            </div>
          </div>

          <Card className="lg:col-span-2 glass-card p-md md:p-lg relative overflow-hidden border-0 min-w-0">
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(#002045 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />
            <h2 className="text-headline-sm font-headline-sm text-primary mb-lg relative z-10">재무 목표 로드맵</h2>
            <div className="mb-xl relative z-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-sm gap-sm sm:gap-0">
                <div>
                  <p className="text-label-sm font-label-sm text-on-surface-variant mb-xs">단기 목표: 비상금 확보</p>
                  <p className="text-headline-sm sm:text-headline-md font-headline-md text-primary financial-value break-words">
                    ₩ 3,000,000 <span className="text-body-sm font-body-sm text-on-surface-variant font-normal">/ ₩ 10,000,000</span>
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-headline-sm font-headline-sm text-secondary font-bold">30%</span>
                </div>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-4 mb-2 overflow-hidden border border-outline-variant">
                <div className="progress-bar-gradient h-4 rounded-full" style={{ width: '30%' }} />
              </div>
              <div className="flex justify-between text-label-sm font-label-sm text-on-surface-variant">
                <span>현재 자산</span>
                <span>목표 자산</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md relative z-10">
              <div className="bg-surface p-md rounded-lg border border-outline-variant flex items-start gap-sm">
                <MaterialIcon name="trending_flat" className="text-on-surface-variant mt-xs" />
                <div>
                  <p className="text-label-md font-label-md text-primary mb-xs">현재 조건 유지 시</p>
                  <p className="text-body-sm font-body-sm text-on-surface-variant">
                    목표 달성까지 <strong className="text-primary">약 18개월</strong> 예상
                  </p>
                </div>
              </div>
              <div className="bg-secondary-container p-md rounded-lg border border-secondary-fixed-dim flex items-start gap-sm">
                <MaterialIcon name="trending_up" className="text-on-secondary-container mt-xs" />
                <div>
                  <p className="text-label-md font-label-md text-on-secondary-container mb-xs">최적화 시뮬레이션</p>
                  <p className="text-body-sm font-body-sm text-on-secondary-container">
                    월 15만원 절감 시 <strong className="text-primary font-bold">약 14개월</strong> 예상
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
