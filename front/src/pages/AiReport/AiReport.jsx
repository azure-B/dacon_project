import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, MaterialIcon, WipBadge } from '../../components/common';
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

const CHART_MONTHS = [
  { label: '4월', segments: [{ height: '38%' }, { height: '28%' }, { height: '12%' }] },
  { label: '5월', segments: [{ height: '40%' }, { height: '26%' }, { height: '14%' }] },
  { label: '6월', segments: [{ height: '42%' }, { height: '30%' }, { height: '10%' }] },
  { label: '7월', segments: [{ height: '41%' }, { height: '29%' }, { height: '13%' }] },
  { label: '8월', segments: [{ height: '44%' }, { height: '31%' }, { height: '16%' }], current: true },
  { label: '9월', segments: [{ height: '40%' }, { height: '27%' }, { height: '11%' }] },
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
  if (label === '어려움' || label === '보통') return 'bg-surface-variant text-on-surface-variant';
  return 'bg-tertiary-fixed-dim/20 text-on-tertiary-container';
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
      number: String(index + 1),
      title: `${item.category} 지출 점검`,
      desc: `${item.category}에 ${Number(item.amount || 0).toLocaleString('ko-KR')}원을 썼어요.`,
      variant: index === 0 ? 'error' : 'default',
    }));
  }
  if (evaluation?.insight) {
    return [
      {
        number: '1',
        title: '한눈에 본 포인트',
        desc: evaluation.insight,
        variant: 'error',
      },
    ];
  }
  return [];
}

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
            <Button variant="secondary" className="h-[44px] px-md">
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
          <p className="text-body-sm font-body-sm text-error m-0 mb-md break-keep" role="alert">
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
    <tr key={row.key} className="border-b border-surface-variant last:border-b-0 hover:bg-surface transition-colors">
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
  ));
}

export default function AiReport() {
  const [sideTab, setSideTab] = useState('portfolio');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [evaluation, setEvaluation] = useState(null);

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
  const hasLoggedInData = !isLoading && errorMessage !== 'login' && !errorMessage;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-stretch antialiased page-shell min-w-0">
      <aside className="hidden md:flex flex-col w-64 shrink-0 self-stretch min-h-[calc(100vh-4rem)] sticky top-16 bg-surface-container-low border-r border-outline-variant py-md gap-sm z-40">
        <div className="px-md mb-md">
          <div className="flex items-center gap-sm mb-xs">
            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
              <MaterialIcon name="summarize" className="text-[20px]" />
            </div>
            <div>
              <h2 className="text-label-md font-label-md font-bold text-on-surface">한 장 요약</h2>
              <p className="text-label-sm font-label-sm text-on-surface-variant">이번 달 돈 흐름</p>
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
                    ? 'flex items-center gap-md px-md py-3 text-label-md font-label-md bg-secondary-container text-on-secondary-container rounded-lg mx-2 my-1 scale-95 duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100'
                    : 'flex items-center gap-md px-md py-3 text-label-md font-label-md text-on-surface-variant hover:bg-surface-variant mx-2 my-1 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed'
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

      <main className="flex-1 md:ml-0 w-full max-w-container-max mx-auto px-3 sm:px-margin-mobile md:px-margin-desktop py-md md:py-xl min-w-0 overflow-x-hidden">
        <nav className="md:hidden flex gap-sm overflow-x-auto hide-scrollbar pb-sm mb-md border-b border-outline-variant -mx-1 px-1">
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
                    ? 'bg-secondary-container text-on-secondary-container font-bold'
                    : 'bg-surface-container-low text-on-surface-variant border border-outline-variant'
                }`}
              >
                {item.label}
                {item.wip ? <WipBadge /> : null}
              </button>
            );
          })}
        </nav>

        <div className="mb-lg md:mb-xl flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full mb-4">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span className="text-label-sm font-label-sm text-on-surface-variant tracking-wider uppercase">이번 달 분석</span>
            </div>
            <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg-mobile md:font-headline-lg text-primary mb-2 break-keep">
              한 장 요약 보고서
            </h1>
            <p className="text-body-sm md:text-body-lg font-body-lg text-on-surface-variant break-keep">
              {evaluation?.insight || '가계부를 바탕으로 절감 포인트와 문제점을 정리했어요.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-sm w-full md:w-auto">
            <Button variant="outline" className="px-4 py-2 h-12 sm:h-auto w-full sm:w-auto inline-flex items-center justify-center gap-1" disabled>
              <MaterialIcon name="download" className="text-[18px]" />
              PDF 다운로드
              <WipBadge />
            </Button>
            <Button variant="secondary" className="px-4 py-2 h-12 sm:h-auto w-full sm:w-auto inline-flex items-center justify-center gap-1" disabled>
              <MaterialIcon name="share" className="text-[18px]" />
              보고서 공유
              <WipBadge />
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
                <span className="text-headline-lg-mobile md:text-display-lg font-display-lg text-primary tracking-tight financial-value break-words">
                  {isLoading ? '…' : hasLoggedInData ? formatWon(totalSaving) : '-'}
                </span>
                <span className="text-body-md font-body-md text-on-surface-variant mb-1 sm:mb-2">/ 월</span>
              </div>
              <div className="mt-sm flex items-center gap-2 text-on-surface-variant">
                <MaterialIcon name="info" className="text-[16px]" />
                <span className="text-label-md font-label-md break-keep">
                  {hasLoggedInData && savingsRows.length > 0
                    ? `추천 ${savingsRows.length}개 항목 합계예요`
                    : '절감 항목 표를 확인해보세요'}
                </span>
              </div>
            </Card>

            <Card className="p-md md:p-lg flex flex-col justify-center relative overflow-hidden group hover:shadow-level-2 transition-shadow border-0 min-w-0">
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-tertiary-container rounded-full opacity-5 group-hover:scale-110 transition-transform duration-500" />
              <div className="flex items-center gap-sm mb-md text-tertiary-container">
                <MaterialIcon name="flag" />
                <h3 className="text-headline-sm font-headline-sm flex items-center gap-1 flex-wrap">
                  목표 달성 예상 기간
                  <WipBadge />
                </h3>
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
                  <span className="text-primary font-bold break-keep">조금만 손보면: 46개월</span>
                </div>
              </div>
            </Card>
          </div>

          <Card className="col-span-1 md:col-span-8 flex flex-col hover:shadow-level-2 transition-shadow border-0 overflow-hidden min-w-0">
            <div className="p-md md:p-lg border-b border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm">
              <div className="flex items-center gap-sm">
                <MaterialIcon name="query_stats" className="text-secondary" />
                <h3 className="text-headline-sm font-headline-sm text-primary flex items-center gap-1 flex-wrap">
                  주요 분석: 현금 흐름 및 지출 패턴
                  <WipBadge />
                </h3>
              </div>
              <span className="px-2 py-1 bg-surface-variant text-on-surface-variant text-label-sm font-label-sm rounded">6개월</span>
            </div>
            <div className="p-md md:p-lg flex-1 flex flex-col min-w-0 overflow-hidden">
              <p className="text-body-sm font-body-sm text-on-surface-variant mb-md break-keep">
                지난 6개월간의 데이터를 분석한 결과, 고정비 지출이 권장 수준(수입의 40%)을 초과하여 52%에 달하고 있습니다. 특히 이자
                비용과 구독 서비스 항목에서 비효율성이 두드러집니다.
              </p>
              <div className="w-full flex-1 min-h-[220px] flex items-stretch gap-2 sm:gap-3 overflow-hidden">
                {CHART_MONTHS.map((month) => (
                  <div key={month.label} className="flex-1 min-w-0 flex flex-col items-center gap-2 group">
                    <div className="w-full flex-1 min-h-0 flex items-end justify-center rounded-t-md bg-surface-container px-1 pt-2 overflow-hidden">
                      <div className="w-[72%] max-w-[52px] h-full flex flex-col-reverse rounded-t-sm overflow-hidden">
                        <div
                          className="w-full bg-primary-container group-hover:bg-primary transition-colors"
                          style={{ height: month.segments[0].height }}
                        />
                        <div className="w-full bg-secondary-container" style={{ height: month.segments[1].height }} />
                        <div className="w-full bg-error-container rounded-t-sm" style={{ height: month.segments[2].height }} />
                        <div className="flex-1 min-h-0" />
                      </div>
                    </div>
                    <span
                      className={`text-label-sm font-label-sm shrink-0 ${
                        month.current ? 'text-primary font-bold' : 'text-on-surface-variant'
                      }`}
                    >
                      {month.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-md mt-md pt-md border-t border-surface-variant shrink-0">
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
                  problems.map((problem) => (
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
                  ))
                )}
              </div>
            </Card>
          </div>

          <Card className="col-span-1 md:col-span-7 hover:shadow-level-2 transition-shadow border-0 overflow-hidden min-w-0">
            <div className="p-md md:p-lg border-b border-outline-variant flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
              <div className="flex items-center gap-sm">
                <MaterialIcon name="tune" className="text-tertiary-fixed-dim" />
                <h3 className="text-headline-sm font-headline-sm text-primary">절감 가능한 항목 세부내역</h3>
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
                  <SavingsTableBody
                    isLoading={isLoading}
                    errorMessage={errorMessage}
                    savingsRows={savingsRows}
                    onRetry={loadEvaluation}
                  />
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
                    <h4 className="text-label-md font-label-md font-bold text-on-background">구독 서비스 한 번에 정리</h4>
                    <MaterialIcon name="arrow_forward" className="text-outline group-hover:text-secondary transition-colors" />
                  </div>
                  <p className="text-body-sm font-body-sm text-on-surface-variant mb-4">
                    안 쓰는 구독이 있는지 확인하고 정리해서, 매달 나가는 돈을 조금 줄여보세요.
                  </p>
                </div>
                <Link to="/">
                  <Button variant="secondary" fullWidth className="py-2 min-h-[44px]">
                    홈으로
                  </Button>
                </Link>
              </div>
              <div className="border border-outline-variant rounded-lg p-md hover:border-secondary transition-colors group flex flex-col justify-between bg-surface">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-label-md font-label-md font-bold text-on-background">나에게 맞는 대환 대출 찾기</h4>
                    <MaterialIcon name="arrow_forward" className="text-outline group-hover:text-secondary transition-colors" />
                  </div>
                  <p className="text-body-sm font-body-sm text-on-surface-variant mb-4">
                    지금 쓰고 있는 고금리 대출을, 승인 가능성이 높은 저금리 상품으로 바꿀 수 있는지 비교해봐요.
                  </p>
                </div>
                <Link to="/debt-analysis">
                  <Button variant="outline" fullWidth className="py-2 border-secondary text-secondary hover:bg-surface-variant min-h-[44px]">
                    빚 정리로 가기
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
