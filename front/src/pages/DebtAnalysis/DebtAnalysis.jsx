import { Card, MaterialIcon } from '../../components/common';
import './DebtAnalysis.css';

const LOANS = [
  {
    name: 'KB국민은행 주택담보대출',
    type: '만기일시상환',
    rate: '4.2%',
    balance: '₩250,000,000',
    monthly: '₩875,000',
    remaining: '120개월',
  },
  {
    name: '신한은행 직장인 신용대출',
    type: '원리금균등상환',
    rate: '5.8%',
    balance: '₩65,000,000',
    monthly: '₩1,245,000',
    remaining: '48개월',
  },
];

export default function DebtAnalysis() {
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

        <div className="bg-primary-container border border-outline-variant rounded-xl p-md md:p-lg mb-lg md:mb-xl flex flex-col sm:flex-row items-start gap-md card-shadow">
          <MaterialIcon name="tips_and_updates" filled className="text-tertiary-fixed text-headline-lg shrink-0" />
          <div className="min-w-0">
            <h3 className="text-headline-sm font-headline-sm text-on-primary-container mb-xs break-keep">AI 인사이트</h3>
            <p className="text-body-md font-body-md text-inverse-on-surface font-semibold break-keep">
              현재 지출에서 월 최대 약 12만원을 추가 확보할 수 있습니다.
            </p>
            <p className="text-body-sm font-body-sm text-surface-variant mt-xs">
              조정 가능한 지출 항목(통신비, 구독서비스)을 최적화하여 부채 상환 재원을 마련하세요.
            </p>
          </div>
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
                    <path
                      className="text-primary"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray="60, 100"
                      strokeWidth="4"
                    />
                    <path
                      className="text-secondary"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray="25, 100"
                      strokeDashoffset="-60"
                      strokeWidth="4"
                    />
                    <path
                      className="text-on-tertiary-container"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray="15, 100"
                      strokeDashoffset="-85"
                      strokeWidth="4"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
                    <span className="text-label-sm font-label-sm text-on-surface-variant">총 잔액</span>
                    <span className="text-headline-sm font-headline-sm text-primary font-bold financial-value break-words">₩345,000,000</span>
                  </div>
                </div>
                <div className="flex-1 w-full min-w-0 space-y-md">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-xs border-b border-outline-variant pb-sm">
                    <div className="flex items-center gap-sm min-w-0">
                      <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
                      <span className="text-body-md font-body-md text-on-surface truncate">주택담보대출</span>
                    </div>
                    <span className="text-body-md font-body-md font-semibold text-on-surface financial-value shrink-0">₩250,000,000</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-xs border-b border-outline-variant pb-sm">
                    <div className="flex items-center gap-sm min-w-0">
                      <div className="w-3 h-3 rounded-full bg-secondary shrink-0" />
                      <span className="text-body-md font-body-md text-on-surface truncate">신용대출</span>
                    </div>
                    <span className="text-body-md font-body-md font-semibold text-on-surface financial-value shrink-0">₩65,000,000</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-xs border-b border-outline-variant pb-sm">
                    <div className="flex items-center gap-sm min-w-0">
                      <div className="w-3 h-3 rounded-full bg-on-tertiary-container shrink-0" />
                      <span className="text-body-md font-body-md text-on-surface truncate">자동차할부</span>
                    </div>
                    <span className="text-body-md font-body-md font-semibold text-on-surface financial-value shrink-0">₩30,000,000</span>
                  </div>
                </div>
              </div>
            </Card>

            <section className="space-y-md">
              <h3 className="text-headline-sm font-headline-sm text-primary mb-sm">보유 부채 상세</h3>
              {LOANS.map((loan) => (
                <Card key={loan.name} className="p-md card-hover-shadow cursor-pointer group min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-md gap-sm">
                    <div className="min-w-0">
                      <h4 className="text-headline-sm font-headline-sm text-on-background group-hover:text-primary transition-colors break-keep">
                        {loan.name}
                      </h4>
                      <span className="text-label-sm font-label-sm text-on-surface-variant bg-surface-variant px-2 py-1 rounded mt-xs inline-block">
                        {loan.type}
                      </span>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-headline-md font-headline-md font-bold text-primary financial-value">{loan.rate}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm border-t border-outline-variant pt-md">
                    <div>
                      <p className="text-label-sm font-label-sm text-on-surface-variant mb-xs">대출 잔액</p>
                      <p className="text-body-md font-body-md font-semibold financial-value break-words">{loan.balance}</p>
                    </div>
                    <div>
                      <p className="text-label-sm font-label-sm text-on-surface-variant mb-xs">월 상환액</p>
                      <p className="text-body-md font-body-md font-semibold text-error financial-value break-words">{loan.monthly}</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-label-sm font-label-sm text-on-surface-variant mb-xs">잔여 기간</p>
                      <p className="text-body-md font-body-md font-semibold">{loan.remaining}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </section>
          </div>

          <div className="lg:col-span-5 min-w-0">
            <Card className="p-md md:p-lg lg:sticky lg:top-24 min-w-0">
              <h2 className="text-headline-md font-headline-md text-primary mb-md">지출 분류 분석</h2>
              <div className="space-y-lg">
                <div>
                  <h3 className="text-body-lg font-body-lg font-semibold text-on-surface mb-sm flex items-center gap-xs">
                    <span className="w-2 h-2 rounded-full bg-outline" /> 필수 지출
                  </h3>
                  <div className="border border-outline-variant rounded-lg divide-y divide-outline-variant bg-surface-bright">
                    <ExpenseRow icon="directions_car" label="교통비" amount="₩150,000" />
                    <ExpenseRow icon="shield" label="보험료" amount="₩320,000" />
                  </div>
                </div>
                <div>
                  <h3 className="text-body-lg font-body-lg font-semibold text-on-surface mb-sm flex items-center gap-xs">
                    <span className="w-2 h-2 rounded-full bg-secondary" /> 조정 가능한 지출
                  </h3>
                  <div className="border border-outline-variant rounded-lg divide-y divide-outline-variant bg-surface-bright">
                    <ExpenseRow icon="smartphone" label="통신비" amount="₩95,000" saving="예상 절감: ₩25,000" savingClass="text-secondary" />
                    <ExpenseRow icon="subscriptions" label="구독서비스" amount="₩45,000" saving="예상 절감: ₩30,000" savingClass="text-secondary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-body-lg font-body-lg font-semibold text-on-surface mb-sm flex items-center gap-xs">
                    <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim" /> 절감 가능성이 높은 지출
                  </h3>
                  <div className="border border-outline-variant rounded-lg divide-y divide-outline-variant bg-surface-bright">
                    <ExpenseRow
                      icon="restaurant"
                      label="외식/카페"
                      amount="₩450,000"
                      saving="예상 절감: ₩65,000"
                      savingClass="text-tertiary-fixed-dim font-bold"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpenseRow({ icon, label, amount, saving, savingClass }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-sm p-md hover:bg-surface-container-low transition-colors min-w-0">
      <div className="flex items-center gap-sm min-w-0">
        <MaterialIcon name={icon} className="text-on-surface-variant text-xl shrink-0" />
        <span className="text-body-md font-body-md text-on-surface truncate">{label}</span>
      </div>
      {saving ? (
        <div className="text-left sm:text-right shrink-0">
          <span className="text-body-md font-body-md font-semibold financial-value">{amount}</span>
          <p className={`text-label-sm font-label-sm ${savingClass}`}>{saving}</p>
        </div>
      ) : (
        <span className="text-body-md font-body-md font-semibold financial-value shrink-0">{amount}</span>
      )}
    </div>
  );
}
