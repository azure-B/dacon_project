import { useState } from 'react';
import { Button, Card, MaterialIcon } from '../../components/common';
import './AiFeedback.css';

const SIDE_ITEMS = [
  { id: 'overview', icon: 'analytics', label: '개요', active: true },
  { id: 'portfolio', icon: 'description', label: '포트폴리오 보고서' },
  { id: 'risk', icon: 'settings_applications', label: '리스크 설정' },
  { id: 'audit', icon: 'history', label: '감사 로그' },
  { id: 'security', icon: 'shield', label: '보안' },
];

const SPENDING = [
  { icon: 'restaurant', iconWrap: 'bg-primary-container/10 text-primary-container', name: '식비', desc: '외식, 식자재, 커피 등', amount: '₩1,207,500', change: 'up', changeText: '12%' },
  { icon: 'home', iconWrap: 'bg-secondary-container/20 text-on-secondary-container', name: '주거/통신', desc: '월세, 관리비, 통신비 등', amount: '₩690,000', change: 'flat', changeText: '변동없음' },
  { icon: 'directions_car', iconWrap: 'bg-[#00b47d]/10 text-[#00b47d]', name: '교통/차량', desc: '대중교통, 주유, 택시', amount: '₩517,500', change: 'down', changeText: '5%' },
  { icon: 'shopping_bag', iconWrap: 'bg-surface-variant text-on-surface-variant', name: '쇼핑', desc: '의류, 잡화, 온라인 쇼핑', amount: '₩414,000', change: 'up', changeText: '2%' },
  { icon: 'subscriptions', iconWrap: 'bg-surface-tint/10 text-surface-tint', name: '구독', desc: 'OTT, 소프트웨어, 멤버십', amount: '₩276,000', change: 'warn', changeText: 'AI 경고' },
];

const MONTHS = [
  { label: '3월', height: '40%' },
  { label: '4월', height: '55%' },
  { label: '5월', height: '45%' },
  { label: '6월', height: '60%' },
  { label: '7월', height: '50%' },
  { label: '8월', height: '75%', current: true },
];

export default function AiFeedback() {
  const [period, setPeriod] = useState('month');
  const [sideTab, setSideTab] = useState('overview');

  return (
    <div className="flex min-h-full antialiased">
      <nav className="h-[calc(100vh-4rem)] w-64 sticky top-16 bg-surface-container-low border-r border-outline-variant flex-col py-md gap-sm z-40 hidden md:flex shrink-0">
        {SIDE_ITEMS.map((item) => {
          const active = sideTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSideTab(item.id)}
              className={
                active
                  ? 'bg-secondary-container text-on-secondary-container rounded-lg mx-2 my-1 px-md py-sm flex items-center gap-md scale-95 duration-150'
                  : 'text-on-surface-variant hover:bg-surface-variant mx-2 my-1 rounded-lg px-md py-sm flex items-center gap-md hover:text-on-surface transition-all group'
              }
            >
              <MaterialIcon name={item.icon} filled={active} className={active ? '' : 'group-hover:text-primary transition-colors'} />
              <span className="text-label-md font-label-md">{item.label}</span>
            </button>
          );
        })}
        <div className="mt-auto px-md pb-md flex flex-col gap-sm">
          <div className="flex items-center gap-sm">
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-label-sm">
              UW
            </div>
            <div>
              <div className="text-label-md font-label-md font-bold text-on-surface">심층 분석</div>
              <div className="text-label-sm font-label-sm text-on-surface-variant">기관 등급</div>
            </div>
          </div>
          <Button fullWidth className="py-sm mt-sm">
            보고서 생성
          </Button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-lg overflow-x-hidden">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-lg gap-md border-b border-outline-variant pb-md">
            <div>
              <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-on-surface">AI 가계부 분석</h1>
              <p className="text-body-md font-body-md text-on-surface-variant mt-sm">인공지능 기반 지출 패턴 분석 및 최적화 제안</p>
            </div>
            <div className="flex gap-sm bg-surface-container-low p-1 rounded-lg border border-outline-variant self-start md:self-auto">
              {[
                { id: 'day', label: '일간' },
                { id: 'week', label: '주간' },
                { id: 'month', label: '월간' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPeriod(item.id)}
                  className={`px-md py-xs rounded-md text-label-md font-label-md ${
                    period === item.id
                      ? 'bg-surface shadow-sm text-primary font-medium'
                      : 'text-on-surface-variant hover:bg-surface-variant transition-colors'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            <Card className="col-span-1 lg:col-span-4 bg-gradient-to-br from-surface to-surface-container-low p-lg flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container rounded-full blur-3xl opacity-20 -mr-10 -mt-10 pointer-events-none" />
              <div className="flex items-center gap-sm mb-md z-10">
                <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
                  <MaterialIcon name="smart_toy" className="text-[18px]" />
                </div>
                <h2 className="text-headline-sm font-headline-sm text-on-surface">AI 인사이트</h2>
              </div>
              <div className="flex flex-col gap-sm flex-1 z-10">
                <div className="bg-surface-bright rounded-lg p-md border border-outline-variant/50 shadow-sm flex items-start gap-md">
                  <MaterialIcon name="trending_up" className="text-error mt-xs" />
                  <div>
                    <p className="text-body-md font-body-md text-on-surface leading-snug">
                      이번 달 <span className="font-bold text-error">식비</span>가 지난달보다 <span className="font-bold">12% 증가</span>
                      했습니다.
                    </p>
                    <p className="text-label-sm font-label-sm text-on-surface-variant mt-xs">외식 비중이 30% 증가한 것이 주요 원인입니다.</p>
                  </div>
                </div>
                <div className="bg-surface-bright rounded-lg p-md border border-outline-variant/50 shadow-sm flex items-start gap-md">
                  <MaterialIcon name="savings" className="text-on-tertiary-container mt-xs" />
                  <div>
                    <p className="text-body-md font-body-md text-on-surface leading-snug">
                      사용하지 않는 구독서비스를 정리하면 월{' '}
                      <span className="font-bold text-on-tertiary-container">19,000원을 절약</span>할 수 있습니다.
                    </p>
                    <p className="text-label-sm font-label-sm text-on-surface-variant mt-xs">최근 3개월간 미사용: '스트리밍 A', '디지털 매거진'</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" fullWidth className="mt-md py-sm z-10 bg-surface-container-high hover:bg-surface-variant">
                상세 분석 보기
              </Button>
            </Card>

            <Card className="col-span-1 lg:col-span-8 p-lg flex flex-col">
              <div className="flex justify-between items-center mb-lg">
                <h2 className="text-headline-sm font-headline-sm text-on-surface">월별 지출 추이</h2>
                <button type="button" className="text-on-surface-variant hover:text-primary" aria-label="더보기">
                  <MaterialIcon name="more_vert" />
                </button>
              </div>
              <div className="flex-1 flex items-end justify-between gap-sm md:gap-md pt-xl relative min-h-[240px]">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
                  <div className="w-full border-t border-outline-variant/30" />
                  <div className="w-full border-t border-outline-variant/30" />
                  <div className="w-full border-t border-outline-variant/30" />
                  <div className="w-full border-t border-outline-variant/30" />
                  <div className="w-full border-t border-outline-variant/30" />
                </div>
                {MONTHS.map((month) => (
                  <div key={month.label} className="flex flex-col items-center gap-xs z-10 group w-full relative">
                    {month.current ? (
                      <div className="absolute -top-8 bg-primary text-on-primary text-[10px] py-1 px-2 rounded font-bold whitespace-nowrap">
                        예상 달성
                      </div>
                    ) : null}
                    <div
                      className={`w-full max-w-[40px] rounded-t-sm ${
                        month.current
                          ? 'bg-primary shadow-sm'
                          : 'bg-secondary-fixed-dim group-hover:bg-secondary-container transition-colors'
                      }`}
                      style={{ height: month.height }}
                    />
                    <span className={`text-label-sm font-label-sm ${month.current ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                      {month.label}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="col-span-1 lg:col-span-5 p-lg flex flex-col">
              <h2 className="text-headline-sm font-headline-sm text-on-surface mb-md">카테고리별 분포</h2>
              <div className="flex-1 flex flex-col items-center justify-center py-md">
                <div
                  className="relative w-48 h-48 rounded-full mb-lg"
                  style={{
                    background:
                      'conic-gradient(#1a365d 0% 35%, #7db6ff 35% 55%, #00b47d 55% 70%, #cbdbf5 70% 82%, #455f88 82% 90%, #c4c6cf 90% 100%)',
                  }}
                >
                  <div className="absolute inset-4 bg-surface rounded-full flex flex-col items-center justify-center shadow-inner">
                    <span className="text-label-sm font-label-sm text-on-surface-variant">총 지출</span>
                    <span className="text-headline-sm font-headline-sm font-bold text-on-surface">₩3,450,000</span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-md px-sm">
                  <div className="flex items-center gap-xs">
                    <div className="w-3 h-3 rounded-full bg-primary-container" />
                    <span className="text-label-sm font-label-sm">식비 (35%)</span>
                  </div>
                  <div className="flex items-center gap-xs">
                    <div className="w-3 h-3 rounded-full bg-secondary-container" />
                    <span className="text-label-sm font-label-sm">주거 (20%)</span>
                  </div>
                  <div className="flex items-center gap-xs">
                    <div className="w-3 h-3 rounded-full bg-[#00b47d]" />
                    <span className="text-label-sm font-label-sm">교통 (15%)</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="col-span-1 lg:col-span-7 p-0 flex flex-col overflow-hidden">
              <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
                <h2 className="text-headline-sm font-headline-sm text-on-surface">상세 지출 내역</h2>
                <button type="button" className="text-label-md font-label-md text-primary hover:underline">
                  전체보기
                </button>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[400px]">
                {SPENDING.map((item, index) => (
                  <div
                    key={item.name}
                    className={`flex items-center justify-between p-md hover:bg-surface-container-low transition-colors ${
                      index === SPENDING.length - 1 ? '' : 'border-b border-outline-variant/50'
                    }`}
                  >
                    <div className="flex items-center gap-md">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.iconWrap}`}>
                        <MaterialIcon name={item.icon} />
                      </div>
                      <div>
                        <div className="text-body-md font-body-md text-on-surface font-medium">{item.name}</div>
                        <div className="text-label-sm font-label-sm text-on-surface-variant">{item.desc}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-body-md font-body-md text-on-surface font-semibold">{item.amount}</div>
                      <ChangeHint change={item.change} text={item.changeText} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangeHint({ change, text }) {
  if (change === 'warn') {
    return <div className="text-label-sm font-label-sm text-error flex items-center justify-end gap-xs font-bold">{text}</div>;
  }
  if (change === 'up') {
    return (
      <div className="text-label-sm font-label-sm text-error flex items-center justify-end gap-xs">
        <MaterialIcon name="arrow_upward" className="text-[14px]" /> {text}
      </div>
    );
  }
  if (change === 'down') {
    return (
      <div className="text-label-sm font-label-sm text-[#00b47d] flex items-center justify-end gap-xs">
        <MaterialIcon name="arrow_downward" className="text-[14px]" /> {text}
      </div>
    );
  }
  return (
    <div className="text-label-sm font-label-sm text-on-surface-variant flex items-center justify-end gap-xs">
      <MaterialIcon name="horizontal_rule" className="text-[14px]" /> {text}
    </div>
  );
}
