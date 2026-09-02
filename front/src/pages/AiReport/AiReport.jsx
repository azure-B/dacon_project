import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, MaterialIcon } from '../../components/common';
import './AiReport.css';

const SIDE_ITEMS = [
  { id: 'overview', icon: 'overview', label: '개요' },
  { id: 'portfolio', icon: 'description', label: '포트폴리오 보고서', active: true },
  { id: 'risk', icon: 'settings_applications', label: '리스크 설정' },
  { id: 'audit', icon: 'history', label: '감사 로그' },
  { id: 'security', icon: 'shield', label: '보안' },
];

const CHART_MONTHS = [
  { label: '1월', segments: [{ bottom: 0, height: '40%', highlight: false }, { bottom: '40%', height: '30%' }, { bottom: '70%', height: '10%' }] },
  { label: '2월', segments: [{ bottom: 0, height: '42%', highlight: false }, { bottom: '42%', height: '28%' }, { bottom: '70%', height: '15%' }] },
  { label: '3월', segments: [{ bottom: 0, height: '45%', highlight: true }, { bottom: '45%', height: '32%' }, { bottom: '77%', height: '18%' }], current: true },
  { label: '4월', segments: [{ bottom: 0, height: '41%', highlight: false }, { bottom: '41%', height: '30%' }, { bottom: '71%', height: '12%' }] },
  { label: '5월', segments: [{ bottom: 0, height: '40%', highlight: false }, { bottom: '40%', height: '25%' }, { bottom: '65%', height: '10%' }] },
];

const PROBLEMS = [
  {
    title: '고정비 비중 과다',
    desc: '전체 수입의 52%가 고정비로 지출되어 유동성 확보가 어렵습니다.',
    variant: 'error',
    number: '1',
  },
  {
    title: '구독 서비스 중복',
    desc: '유사한 카테고리(엔터테인먼트, 소프트웨어)의 구독이 3건 중복됩니다.',
    variant: 'default',
    number: '2',
  },
  {
    title: '단기 부채 이자율 상승',
    desc: '최근 3개월간 변동금리 기반 단기 부채의 실효 이자율이 1.2%p 상승했습니다.',
    variant: 'default',
    number: '3',
  },
];

const SAVINGS_ROWS = [
  {
    icon: 'account_balance',
    category: '대출 대환',
    detail: '고금리 신용대출 -> 담보부 저금리 대환',
    amount: '₩150,000',
    difficulty: '보통',
    difficultyClass: 'bg-surface-variant text-on-surface-variant',
  },
  {
    icon: 'phonelink_ring',
    category: '통신비 최적화',
    detail: '데이터 사용량 기반 맞춤형 요금제 변경',
    amount: '₩45,000',
    difficulty: '쉬움',
    difficultyClass: 'bg-tertiary-fixed-dim/20 text-on-tertiary-container',
  },
  {
    icon: 'subscriptions',
    category: '미사용 구독 취소',
    detail: '최근 3개월 미접속 스트리밍 서비스 2건',
    amount: '₩32,000',
    difficulty: '매우 쉬움',
    difficultyClass: 'bg-tertiary-fixed-dim/20 text-on-tertiary-container',
  },
];

export default function AiReport() {
  const [sideTab, setSideTab] = useState('portfolio');

  return (
    <div className="flex min-h-full antialiased page-shell min-w-0">
      <aside className="hidden md:flex flex-col h-[calc(100vh-4rem)] w-64 sticky top-16 bg-surface-container-low border-r border-outline-variant py-md gap-sm z-40 shrink-0">
        <div className="px-md mb-md">
          <div className="flex items-center gap-sm mb-xs">
            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
              <MaterialIcon name="corporate_fare" className="text-[20px]" />
            </div>
            <div>
              <h2 className="text-label-md font-label-md font-bold text-on-surface">심층 분석</h2>
              <p className="text-label-sm font-label-sm text-on-surface-variant">기관 등급</p>
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
                onClick={() => setSideTab(item.id)}
                className={
                  active
                    ? 'flex items-center gap-md px-md py-3 text-label-md font-label-md bg-secondary-container text-on-secondary-container rounded-lg mx-2 my-1 scale-95 duration-150'
                    : 'flex items-center gap-md px-md py-3 text-label-md font-label-md text-on-surface-variant hover:bg-surface-variant mx-2 my-1 rounded-lg transition-all'
                }
              >
                <MaterialIcon name={item.icon} filled={active} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="px-md mt-auto">
          <Button fullWidth className="py-sm">
            <MaterialIcon name="add_chart" className="text-[18px]" />
            보고서 생성
          </Button>
        </div>
      </aside>

      <main className="flex-1 md:ml-0 w-full max-w-container-max mx-auto px-3 sm:px-margin-mobile md:px-margin-desktop py-md md:py-xl min-w-0 overflow-x-hidden">
        <nav className="md:hidden flex gap-sm overflow-x-auto hide-scrollbar pb-sm mb-md border-b border-outline-variant -mx-1 px-1">
          {SIDE_ITEMS.map((item) => {
            const active = sideTab === item.id;
            return (
              <button
                key={`mobile-${item.id}`}
                type="button"
                onClick={() => setSideTab(item.id)}
                className={`shrink-0 px-md py-2 rounded-full text-label-sm font-label-md min-h-[44px] ${
                  active
                    ? 'bg-secondary-container text-on-secondary-container font-bold'
                    : 'bg-surface-container-low text-on-surface-variant border border-outline-variant'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mb-lg md:mb-xl flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full mb-4">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span className="text-label-sm font-label-sm text-on-surface-variant tracking-wider uppercase">AI 생성 분석</span>
            </div>
            <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg-mobile md:font-headline-lg text-primary mb-2 break-keep">
              AI 심층 재무 보고서
            </h1>
            <p className="text-body-sm md:text-body-lg font-body-lg text-on-surface-variant break-keep">
              기준일: 2024년 5월 24일 · 분석 대상: 통합 포트폴리오 Alpha
            </p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-sm w-full md:w-auto">
            <Button variant="outline" className="px-4 py-2 h-12 sm:h-auto w-full sm:w-auto">
              <MaterialIcon name="download" className="text-[18px]" />
              PDF 다운로드
            </Button>
            <Button variant="secondary" className="px-4 py-2 h-12 sm:h-auto w-full sm:w-auto">
              <MaterialIcon name="share" className="text-[18px]" />
              보고서 공유
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-md md:gap-lg min-w-0">
          <div className="col-span-1 md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-md md:gap-lg mb-4">
            <Card className="p-md md:p-lg flex flex-col justify-center relative overflow-hidden group hover:shadow-level-2 transition-shadow border-0 min-w-0">
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-secondary-container rounded-full opacity-10 group-hover:scale-110 transition-transform duration-500" />
              <div className="flex items-center gap-sm mb-md text-secondary">
                <MaterialIcon name="savings" />
                <h3 className="text-headline-sm font-headline-sm">예상 절감액 (월간)</h3>
              </div>
              <div className="flex flex-wrap items-end gap-sm">
                <span className="text-headline-lg-mobile md:text-display-lg font-display-lg text-primary tracking-tight financial-value break-words">₩1,250,000</span>
                <span className="text-body-md font-body-md text-on-surface-variant mb-1 sm:mb-2">/ 월</span>
              </div>
              <div className="mt-sm flex items-center gap-2 text-on-tertiary-container">
                <MaterialIcon name="trending_up" className="text-[16px]" />
                <span className="text-label-md font-label-md">전월 대비 15% 추가 절감 가능</span>
              </div>
            </Card>

            <Card className="p-md md:p-lg flex flex-col justify-center relative overflow-hidden group hover:shadow-level-2 transition-shadow border-0 min-w-0">
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-tertiary-container rounded-full opacity-5 group-hover:scale-110 transition-transform duration-500" />
              <div className="flex items-center gap-sm mb-md text-tertiary-container">
                <MaterialIcon name="flag" />
                <h3 className="text-headline-sm font-headline-sm">목표 달성 예상 기간</h3>
              </div>
              <div className="flex items-end gap-sm">
                <span className="text-headline-lg-mobile md:text-display-lg font-display-lg text-primary tracking-tight break-words">14개월 단축</span>
              </div>
              <div className="mt-sm">
                <div className="w-full bg-surface-variant rounded-full h-2.5 mb-2">
                  <div className="bg-tertiary-fixed-dim h-2.5 rounded-full" style={{ width: '75%' }} />
                </div>
                <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-2 text-label-sm font-label-sm text-on-surface-variant">
                  <span className="break-keep">기존 예상: 60개월</span>
                  <span className="text-primary font-bold break-keep">AI 최적화 후: 46개월</span>
                </div>
              </div>
            </Card>
          </div>

          <Card className="col-span-1 md:col-span-8 flex flex-col hover:shadow-level-2 transition-shadow border-0 overflow-hidden min-w-0">
            <div className="p-md md:p-lg border-b border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm">
              <div className="flex items-center gap-sm">
                <MaterialIcon name="query_stats" className="text-secondary" />
                <h3 className="text-headline-sm font-headline-sm text-primary">주요 분석: 현금 흐름 및 지출 패턴</h3>
              </div>
              <span className="px-2 py-1 bg-surface-variant text-on-surface-variant text-label-sm font-label-sm rounded">6개월</span>
            </div>
            <div className="p-md md:p-lg flex-1 flex flex-col min-w-0">
              <p className="text-body-sm font-body-sm text-on-surface-variant mb-lg md:mb-xl break-keep">
                지난 6개월간의 데이터를 분석한 결과, 고정비 지출이 권장 수준(수입의 40%)을 초과하여 52%에 달하고 있습니다. 특히 이자
                비용과 구독 서비스 항목에서 비효율성이 두드러집니다.
              </p>
              <div className="w-full min-w-0 mt-auto overflow-x-auto">
                <div className="flex items-end justify-between gap-1 sm:gap-2 px-1 sm:px-md min-w-[300px] min-h-[200px] sm:min-h-[250px]">
                {CHART_MONTHS.map((month) => (
                  <div key={month.label} className="flex flex-col items-center gap-2 w-full min-w-[40px] sm:min-w-[48px] group shrink-0">
                    <div className="w-full relative flex items-end justify-center h-36 sm:h-48 bg-surface-container rounded-t-sm overflow-hidden">
                      <div
                        className={`absolute bottom-0 w-3/4 bg-primary-container rounded-t-sm ${
                          month.segments[0].highlight ? 'group-hover:bg-primary' : 'group-hover:bg-primary'
                        } transition-colors`}
                        style={{ height: month.segments[0].height }}
                      />
                      <div
                        className="absolute w-3/4 bg-secondary-container rounded-t-sm opacity-80"
                        style={{ bottom: month.segments[1].bottom, height: month.segments[1].height }}
                      />
                      <div
                        className="absolute w-3/4 bg-error-container rounded-t-sm opacity-60"
                        style={{ bottom: month.segments[2].bottom, height: month.segments[2].height }}
                      />
                    </div>
                    <span
                      className={`text-label-sm font-label-sm ${month.current ? 'text-primary font-bold' : 'text-on-surface-variant'}`}
                    >
                      {month.label}
                    </span>
                  </div>
                ))}
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-md mt-md pt-md border-t border-surface-variant">
                <div className="flex items-center gap-xs">
                  <div className="w-3 h-3 rounded-full bg-primary-container" />
                  <span className="text-label-sm font-label-sm text-on-surface-variant">필수 생활비</span>
                </div>
                <div className="flex items-center gap-xs">
                  <div className="w-3 h-3 rounded-full bg-secondary-container" />
                  <span className="text-label-sm font-label-sm text-on-surface-variant">고정 부채/구독</span>
                </div>
                <div className="flex items-center gap-xs">
                  <div className="w-3 h-3 rounded-full bg-error-container" />
                  <span className="text-label-sm font-label-sm text-on-surface-variant">비효율 지출</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="col-span-1 md:col-span-4 flex flex-col gap-md min-w-0">
            <Card className="p-md md:p-lg h-full hover:shadow-level-2 transition-shadow border-0 min-w-0">
              <div className="flex items-center gap-sm mb-lg">
                <MaterialIcon name="warning" className="text-error" />
                <h3 className="text-headline-sm font-headline-sm text-primary">현재 문제점</h3>
              </div>
              <div className="flex flex-col gap-md">
                {PROBLEMS.map((problem) => (
                  <div
                    key={problem.number}
                    className={`flex gap-md items-start p-md rounded-lg border ${
                      problem.variant === 'error'
                        ? 'bg-error-container/30 border-error-container/50'
                        : 'bg-surface-container border-outline-variant'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex justify-center items-center shrink-0 ${
                        problem.variant === 'error' ? 'bg-error text-on-error' : 'bg-surface-tint text-on-primary'
                      }`}
                    >
                      <span className="text-label-md font-label-md font-bold">{problem.number}</span>
                    </div>
                    <div>
                      <h4 className="text-label-md font-label-md font-bold text-on-background mb-1">{problem.title}</h4>
                      <p className="text-body-sm font-body-sm text-on-surface-variant">{problem.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="col-span-1 md:col-span-7 hover:shadow-level-2 transition-shadow border-0 overflow-hidden min-w-0">
            <div className="p-md md:p-lg border-b border-outline-variant">
              <div className="flex items-center gap-sm">
                <MaterialIcon name="tune" className="text-tertiary-fixed-dim" />
                <h3 className="text-headline-sm font-headline-sm text-primary">절감 가능한 항목 세부내역</h3>
              </div>
            </div>
            <div className="table-scroll">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant border-b border-outline-variant">
                    <th className="py-3 px-md font-medium">카테고리</th>
                    <th className="py-3 px-md font-medium">상세 내용</th>
                    <th className="py-3 px-md font-medium text-right">예상 절감액 (월)</th>
                    <th className="py-3 px-md font-medium text-center">실행 난이도</th>
                  </tr>
                </thead>
                <tbody className="text-body-sm font-body-sm text-on-background">
                  {SAVINGS_ROWS.map((row) => (
                    <tr key={row.category} className="border-b border-surface-variant last:border-b-0 hover:bg-surface transition-colors">
                      <td className="py-4 px-md">
                        <div className="flex items-center gap-2">
                          <MaterialIcon name={row.icon} className="text-[18px] text-secondary" />
                          {row.category}
                        </div>
                      </td>
                      <td className="py-4 px-md text-on-surface-variant">{row.detail}</td>
                      <td className="py-4 px-md text-right font-bold text-primary">{row.amount}</td>
                      <td className="py-4 px-md text-center">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${row.difficultyClass}`}>{row.difficulty}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="col-span-1 md:col-span-5 p-md md:p-lg hover:shadow-level-2 transition-shadow border-0 flex flex-col min-w-0">
            <div className="flex items-center gap-sm mb-lg">
              <MaterialIcon name="assistant_direction" className="text-secondary" />
              <h3 className="text-headline-sm font-headline-sm text-primary">추천 행동</h3>
            </div>
            <div className="flex flex-col gap-md flex-1">
              <div className="border border-outline-variant rounded-lg p-md hover:border-secondary transition-colors group flex flex-col justify-between bg-surface">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-label-md font-label-md font-bold text-on-background">구독 서비스 일괄 관리</h4>
                    <MaterialIcon name="arrow_forward" className="text-outline group-hover:text-secondary transition-colors" />
                  </div>
                  <p className="text-body-sm font-body-sm text-on-surface-variant mb-4">
                    중복되거나 사용하지 않는 구독 서비스를 한 번에 확인하고 취소하여 즉각적인 현금 흐름을 개선하세요.
                  </p>
                </div>
                <Link to="/">
                  <Button variant="secondary" fullWidth className="py-2 min-h-[44px]">
                    대시보드 이동
                  </Button>
                </Link>
              </div>
              <div className="border border-outline-variant rounded-lg p-md hover:border-secondary transition-colors group flex flex-col justify-between bg-surface">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-label-md font-label-md font-bold text-on-background">AI 맞춤형 대환 대출 탐색</h4>
                    <MaterialIcon name="arrow_forward" className="text-outline group-hover:text-secondary transition-colors" />
                  </div>
                  <p className="text-body-sm font-body-sm text-on-surface-variant mb-4">
                    현재 보유중인 고금리 부채를 대체할 수 있는, 승인 확률이 가장 높은 저금리 상품을 비교합니다.
                  </p>
                </div>
                <Button variant="outline" fullWidth className="py-2 border-secondary text-secondary hover:bg-surface-variant min-h-[44px]">
                  상품 비교하기
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
