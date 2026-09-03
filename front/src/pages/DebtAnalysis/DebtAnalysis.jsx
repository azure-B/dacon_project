import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, MaterialIcon } from '../../components/common';
import { api } from '../../services/api';
import { getAccessToken } from '../../services/authStorage';
import './DebtAnalysis.css';

const RISK_LABELS = {
  low: '낮음',
  medium: '보통',
  high: '높음',
};

const CHART_COLORS = ['bg-primary', 'bg-secondary', 'bg-on-tertiary-container', 'bg-error', 'bg-outline'];
const CHART_TEXT = ['text-primary', 'text-secondary', 'text-on-tertiary-container', 'text-error', 'text-outline'];

function formatWon(value) {
  if (value == null || !Number.isFinite(Number(value))) return '-';
  return `₩${Math.round(Number(value)).toLocaleString('ko-KR')}`;
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

function getDebtErrorMessage(error) {
  if (error?.status === 401 || error?.code === 'unauthorized' || error?.code === 'invalid token') {
    return '로그인이 필요합니다. 로그인 후 다시 시도해주세요.';
  }
  if (error?.status === 502 || error?.code === 'ai unavailable') {
    return 'AI 분석 서버에 일시적으로 연결할 수 없습니다. 잠시 후 다시 시도해주세요.';
  }
  if (error?.status === 500 || error?.code === 'debt adjustment failed') {
    return '채무조정 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
  return error?.message || '채무조정 분석을 불러오지 못했습니다.';
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

export default function DebtAnalysis() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isUnauthorized, setIsUnauthorized] = useState(false);

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

  return (
    <div className="flex flex-1 page-shell min-w-0">
      <div className="flex-1 px-3 sm:px-margin-mobile md:px-margin-desktop py-lg md:py-xl min-w-0">
        <div className="mb-lg md:mb-xl">
          <h1 className="text-headline-lg-mobile md:text-display-lg font-display-lg text-on-background break-keep">
            부채 분석 및 지출 내역
          </h1>
          <p className="text-body-sm md:text-body-lg font-body-lg text-on-surface-variant mt-sm">
            전문적인 재무 데이터 분석을 통한 부채 최적화 및 지출 관리.
          </p>
        </div>

        {isLoading ? (
          <Card className="p-md md:p-lg mb-lg flex items-center gap-md">
            <MaterialIcon name="progress_activity" className="text-primary text-headline-md animate-spin" />
            <p className="text-body-md font-body-md text-on-surface m-0">채무조정 분석을 불러오는 중…</p>
          </Card>
        ) : null}

        {!isLoading && errorMessage ? (
          <Card className="p-md md:p-lg mb-lg border border-error/20 bg-error-container">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
              <div className="min-w-0">
                <h3 className="text-headline-sm font-headline-sm text-error m-0 mb-xs">분석을 표시할 수 없습니다</h3>
                <p className="text-body-sm font-body-sm text-on-surface m-0 break-keep" role="alert">
                  {errorMessage}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-sm shrink-0">
                {isUnauthorized ? (
                  <Link to="/login">
                    <Button variant="secondary" className="h-[44px] px-md w-full sm:w-auto">
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

        {!isLoading && data && summary ? (
          <>
            <div className="bg-primary-container border border-outline-variant rounded-xl p-md md:p-lg mb-lg md:mb-xl flex flex-col sm:flex-row items-start gap-md card-shadow">
              <MaterialIcon name="tips_and_updates" filled className="text-tertiary-fixed text-headline-lg shrink-0" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-sm mb-xs">
                  <h3 className="text-headline-sm font-headline-sm text-on-primary-container m-0 break-keep">AI 인사이트</h3>
                  <span className="text-label-sm font-label-sm px-2 py-1 rounded bg-surface-container-lowest text-on-surface">
                    리스크: {RISK_LABELS[summary.riskLevel] || summary.riskLevel || '-'}
                  </span>
                  {data.provider ? (
                    <span className="text-label-sm font-label-sm text-surface-variant">
                      {data.provider}
                      {data.model ? ` · ${data.model}` : ''}
                    </span>
                  ) : null}
                </div>
                <p className="text-body-md font-body-md text-inverse-on-surface font-semibold break-keep m-0">
                  {summary.insight}
                </p>
                <p className="text-body-sm font-body-sm text-surface-variant mt-xs m-0 break-keep">{summary.comment}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-sm md:gap-md mb-lg md:mb-xl">
              <SummaryStat label="총 부채" value={formatWon(summary.totalDebt)} />
              <SummaryStat label="총 자산" value={formatWon(summary.totalAssets)} />
              <SummaryStat label="월 소득" value={formatWon(summary.monthlyIncome)} />
              <SummaryStat
                label="DSR"
                value={summary.dsrPercent != null ? `${summary.dsrPercent}%` : '-'}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-md md:gap-gutter">
              <div className="lg:col-span-7 flex flex-col gap-md md:gap-lg min-w-0">
                <Card className="p-md md:p-lg min-w-0">
                  <h2 className="text-headline-md font-headline-md text-primary mb-md">총 부채 현황</h2>
                  <div className="flex flex-col md:flex-row items-center gap-lg md:gap-xl">
                    <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex-shrink-0 chart-responsive chart-responsive--clip">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-surface-variant"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        {segments.length === 0 ? null : (
                          segments.map((segment) => (
                            <path
                              key={segment.key}
                              className={segment.textClass}
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="currentColor"
                              strokeDasharray={`${segment.percent}, 100`}
                              strokeDashoffset={String(segment.offset)}
                              strokeWidth="4"
                            />
                          ))
                        )}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
                        <span className="text-label-sm font-label-sm text-on-surface-variant">총 잔액</span>
                        <span className="text-headline-sm font-headline-sm text-primary font-bold financial-value break-words">
                          {formatWon(summary.totalDebt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 w-full min-w-0 space-y-md">
                      {segments.length === 0 ? (
                        <p className="text-body-sm font-body-sm text-on-surface-variant m-0">등록된 대출이 없습니다.</p>
                      ) : (
                        segments.map((segment) => (
                          <div
                            key={segment.key}
                            className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-xs border-b border-outline-variant pb-sm"
                          >
                            <div className="flex items-center gap-sm min-w-0">
                              <div className={`w-3 h-3 rounded-full shrink-0 ${segment.colorClass}`} />
                              <span className="text-body-md font-body-md text-on-surface truncate">{segment.label}</span>
                            </div>
                            <span className="text-body-md font-body-md font-semibold text-on-surface financial-value shrink-0">
                              {formatWon(segment.balance)}
                            </span>
                          </div>
                        ))
                      )}
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-xs pt-xs">
                        <span className="text-label-sm font-label-sm text-on-surface-variant">월 상환액 합계</span>
                        <span className="text-body-md font-body-md font-semibold text-error financial-value">
                          {formatWon(summary.monthlyPayment)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>

                <section className="space-y-md">
                  <h3 className="text-headline-sm font-headline-sm text-primary mb-sm">보유 부채 상세</h3>
                  {loans.length === 0 ? (
                    <Card className="p-md">
                      <p className="text-body-sm font-body-sm text-on-surface-variant m-0">표시할 대출이 없습니다.</p>
                    </Card>
                  ) : (
                    loans.map((loan, index) => (
                      <Card key={loan.id || `${loan.상품명}-${index}`} className="p-md card-hover-shadow min-w-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-md gap-sm">
                          <div className="min-w-0">
                            <h4 className="text-headline-sm font-headline-sm text-on-background break-keep m-0">
                              {loan.은행명 ? `${loan.은행명} ` : ''}
                              {loan.상품명 || '대출 상품'}
                            </h4>
                            <span className="text-label-sm font-label-sm text-on-surface-variant bg-surface-variant px-2 py-1 rounded mt-xs inline-block">
                              {loan.상품_유형 || loan.금융권_구분 || '대출'}
                            </span>
                          </div>
                          <div className="text-left sm:text-right shrink-0">
                            <span className="text-headline-md font-headline-md font-bold text-primary financial-value">
                              {formatRate(loan)}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm border-t border-outline-variant pt-md">
                          <div>
                            <p className="text-label-sm font-label-sm text-on-surface-variant mb-xs">대출 잔액</p>
                            <p className="text-body-md font-body-md font-semibold financial-value break-words m-0">
                              {formatWon(loan.balance)}
                            </p>
                          </div>
                          <div>
                            <p className="text-label-sm font-label-sm text-on-surface-variant mb-xs">월 상환액</p>
                            <p className="text-body-md font-body-md font-semibold text-error financial-value break-words m-0">
                              {formatWon(loan.monthlyPayment)}
                            </p>
                          </div>
                          <div className="sm:text-right">
                            <p className="text-label-sm font-label-sm text-on-surface-variant mb-xs">대출 기간</p>
                            <p className="text-body-md font-body-md font-semibold m-0">{formatPeriod(loan)}</p>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </section>

                <section className="space-y-md">
                  <h3 className="text-headline-sm font-headline-sm text-primary mb-sm">보유 자산</h3>
                  {assets.length === 0 ? (
                    <Card className="p-md">
                      <p className="text-body-sm font-body-sm text-on-surface-variant m-0">표시할 자산이 없습니다.</p>
                    </Card>
                  ) : (
                    assets.map((asset, index) => (
                      <Card key={asset.id || `${asset.상품명}-${index}`} className="p-md min-w-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-sm">
                          <div className="min-w-0">
                            <p className="text-body-md font-body-md font-semibold text-on-surface m-0 break-keep">
                              {asset.은행명 ? `${asset.은행명} · ` : ''}
                              {asset.상품명 || asset.상품_유형 || '자산'}
                            </p>
                            <p className="text-label-sm font-label-sm text-on-surface-variant m-0 mt-xs">
                              {asset.상품_유형 || (asset.isManual ? '수동 입력' : '금융상품')}
                            </p>
                          </div>
                          <span className="text-body-md font-body-md font-semibold financial-value shrink-0">
                            {formatWon(asset.amount)}
                          </span>
                        </div>
                      </Card>
                    ))
                  )}
                </section>
              </div>

              <div className="lg:col-span-5 min-w-0">
                <Card className="p-md md:p-lg lg:sticky lg:top-24 min-w-0">
                  <h2 className="text-headline-md font-headline-md text-primary mb-md">목표 · 추천</h2>
                  <div className="space-y-lg">
                    <div className="rounded-lg border border-outline-variant bg-surface-bright p-md space-y-sm">
                      <MetricRow label="목표 금액" value={formatWon(summary.targetAmount)} />
                      <MetricRow
                        label="목표 기간"
                        value={summary.targetPeriod != null ? `${summary.targetPeriod}개월` : '-'}
                      />
                      <MetricRow label="월 상환액" value={formatWon(summary.monthlyPayment)} />
                    </div>

                    <div>
                      <h3 className="text-body-lg font-body-lg font-semibold text-on-surface mb-sm flex items-center gap-xs">
                        <span className="w-2 h-2 rounded-full bg-secondary" /> 추천 조치
                      </h3>
                      <div className="border border-outline-variant rounded-lg divide-y divide-outline-variant bg-surface-bright">
                        {recommendations.length === 0 ? (
                          <p className="p-md text-body-sm font-body-sm text-on-surface-variant m-0">추천 항목이 없습니다.</p>
                        ) : (
                          recommendations.map((item, index) => (
                            <div key={`${item.title}-${index}`} className="p-md min-w-0">
                              <p className="text-label-sm font-label-sm text-secondary m-0 mb-xs">
                                {item.category || '추천'}
                                {item.productId != null ? ` · 상품 #${item.productId}` : ''}
                              </p>
                              <p className="text-body-md font-body-md font-semibold text-on-surface m-0 break-keep">
                                {item.title}
                              </p>
                              <p className="text-body-sm font-body-sm text-on-surface-variant m-0 mt-xs break-keep">
                                {item.detail}
                              </p>
                              {item.estimatedMonthlySaving ? (
                                <p className="text-label-sm font-label-sm text-secondary m-0 mt-xs">
                                  예상 월 절감: {formatWon(item.estimatedMonthlySaving)}
                                </p>
                              ) : null}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {Array.isArray(data.productsUsed) && data.productsUsed.length > 0 ? (
                      <div>
                        <h3 className="text-body-lg font-body-lg font-semibold text-on-surface mb-sm">참고 상품 ID</h3>
                        <p className="text-label-sm font-label-sm text-on-surface-variant m-0 break-words">
                          {data.productsUsed.join(', ')}
                        </p>
                      </div>
                    ) : null}

                    {disclaimer ? (
                      <div className="rounded-lg bg-surface-container-low border border-outline-variant p-md space-y-xs">
                        <p className="text-label-sm font-label-sm text-on-surface-variant m-0 flex items-start gap-xs">
                          <MaterialIcon name="info" className="text-[16px] shrink-0 mt-0.5" />
                          {disclaimer.partialResults || disclaimer.dataSource}
                        </p>
                        {disclaimer.variableConditions ? (
                          <p className="text-label-sm font-label-sm text-on-surface-variant m-0 pl-[22px]">
                            {disclaimer.variableConditions}
                          </p>
                        ) : null}
                        {disclaimer.confirmBeforeApply ? (
                          <p className="text-label-sm font-label-sm text-on-surface-variant m-0 pl-[22px]">
                            {disclaimer.confirmBeforeApply}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </Card>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function SummaryStat({ label, value }) {
  return (
    <Card className="p-md min-w-0">
      <p className="text-label-sm font-label-sm text-on-surface-variant m-0 mb-xs">{label}</p>
      <p className="text-body-md md:text-headline-sm font-headline-sm text-primary financial-value m-0 break-words">
        {value}
      </p>
    </Card>
  );
}

function MetricRow({ label, value }) {
  return (
    <div className="flex justify-between items-center gap-sm">
      <span className="text-label-sm font-label-sm text-on-surface-variant">{label}</span>
      <span className="text-body-md font-body-md font-semibold financial-value">{value}</span>
    </div>
  );
}
