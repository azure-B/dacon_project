import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, MaterialIcon, WipBadge } from '../../components/common';
import { api } from '../../services/api';
import { getAccessToken } from '../../services/authStorage';
import './Dashboard.css';

function formatWon(value) {
  if (value == null || !Number.isFinite(Number(value))) return '-';
  return `₩ ${Math.round(Number(value)).toLocaleString('ko-KR')}`;
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [summary, setSummary] = useState(null);
  const [monthExpense, setMonthExpense] = useState(null);

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
  const target = summary?.targetAmount;
  const progress =
    target && assets != null && Number(target) > 0
      ? Math.min(100, Math.round((Number(assets) / Number(target)) * 100))
      : null;

  const cards = [
    {
      title: '지금 있는 돈',
      icon: 'account_balance_wallet',
      iconClass: 'text-secondary',
      value: formatWon(assets),
      hint: '등록된 자산 합계',
      hintClass: 'text-on-surface-variant',
    },
    {
      title: '갚아야 할 돈',
      icon: 'credit_card_off',
      iconClass: 'text-error',
      value: formatWon(debt),
      hint: '등록된 대출 잔액',
      hintClass: 'text-error',
    },
    {
      title: '월 수입',
      icon: 'payments',
      iconClass: 'text-secondary',
      value: formatWon(income),
      hint: '프로필 기준',
      hintClass: 'text-on-surface-variant',
    },
    {
      title: '월 지출',
      icon: 'shopping_cart',
      iconClass: 'text-on-surface-variant',
      value: formatWon(expense),
      hint: '이번 달 가계부',
      hintClass: 'text-on-surface-variant',
    },
  ];

  return (
    <div className="flex flex-1 relative max-w-container-max mx-auto w-full page-shell min-w-0">
      <div className="flex-1 px-3 sm:px-margin-mobile md:px-margin-desktop py-lg md:py-xl w-full max-w-[1200px] mx-auto min-w-0">
        <header className="mb-lg md:mb-xl">
          <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-primary mb-xs break-keep">
            오늘 내 돈 한눈에
          </h1>
          <p className="text-body-sm md:text-body-md font-body-md text-on-surface-variant">
            지금 어디쯤인지, 부담 없이 한번 훑어보세요.
          </p>
        </header>

        {isLoading ? (
          <Card className="p-md md:p-lg mb-lg flex items-center gap-md">
            <MaterialIcon name="progress_activity" className="text-primary text-headline-md animate-spin" />
            <p className="text-body-md font-body-md text-on-surface m-0">홈 숫자를 불러오는 중…</p>
          </Card>
        ) : null}

        {!isLoading && errorMessage === 'login' ? (
          <Card className="p-md md:p-lg mb-lg border border-outline-variant">
            <p className="text-body-md font-body-md text-on-surface m-0 mb-sm">
              로그인하면 내 자산·빚·가계부가 여기에 모여요.
            </p>
            <Link to="/login">
              <Button variant="secondary" className="h-[44px] px-md">
                로그인하기
              </Button>
            </Link>
          </Card>
        ) : null}

        {!isLoading && errorMessage && errorMessage !== 'login' ? (
          <Card className="p-md md:p-lg mb-lg border border-error/20 bg-error-container">
            <p className="text-body-sm font-body-sm text-on-surface m-0" role="alert">
              {errorMessage}
            </p>
          </Card>
        ) : null}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-sm sm:gap-md mb-lg md:mb-xl">
          {cards.map((card) => (
            <div
              key={card.title}
              className="glass-card rounded-xl p-md flex flex-col justify-between min-h-[7.5rem] sm:h-32 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex justify-between items-center mb-sm gap-sm min-w-0">
                <h3 className="text-label-md font-label-md text-on-surface-variant truncate">{card.title}</h3>
                <MaterialIcon name={card.icon} className={`${card.iconClass} text-xl shrink-0`} />
              </div>
              <div className="min-w-0">
                <p className="text-headline-sm sm:text-headline-md font-headline-md text-primary financial-value">
                  {isLoading ? '…' : card.value}
                </p>
                <p className={`text-label-sm font-label-sm mt-xs ${card.hintClass}`}>{card.hint}</p>
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg md:gap-xl mb-lg md:mb-xl">
          <div className="lg:col-span-1 flex flex-col gap-md">
            <div className="glass-card rounded-xl p-md md:p-lg flex flex-col">
              <h2 className="text-headline-sm font-headline-sm text-primary mb-md">현금 흐름</h2>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-xs py-sm border-b border-outline-variant">
                <span className="text-body-sm font-body-sm text-on-surface-variant">월 대출 상환</span>
                <span className="text-body-md font-body-md text-primary font-medium financial-value">
                  {formatWon(payment)}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-xs py-sm pt-md">
                <span className="text-body-sm font-body-sm text-on-surface-variant">이번 달 남는 돈</span>
                <span className="text-body-md font-body-md text-tertiary-fixed-dim font-bold financial-value">
                  {formatWon(surplus)}
                </span>
              </div>
              <div className="mt-lg pt-lg border-t border-outline-variant">
                <p className="text-label-sm font-label-sm text-on-surface-variant mb-sm flex items-center gap-xs">
                  <MaterialIcon name="info" className="text-xs" /> 잠깐 팁
                </p>
                <p className="text-body-sm font-body-sm text-primary bg-surface-container-low p-sm rounded-lg border border-outline-variant">
                  남는 돈의 일부만 먼저 빚에 써도, 생각보다 빨리 가벼워질 수 있어요.
                </p>
              </div>
            </div>
          </div>

          <Card className="lg:col-span-2 glass-card p-md md:p-lg relative overflow-hidden border-0 min-w-0">
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(#002045 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />
            <h2 className="text-headline-sm font-headline-sm text-primary mb-lg relative z-10">내가 가고 싶은 곳</h2>
            <div className="mb-xl relative z-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-sm gap-sm sm:gap-0">
                <div>
                  <p className="text-label-sm font-label-sm text-on-surface-variant mb-xs">목표 금액</p>
                  <p className="text-headline-sm sm:text-headline-md font-headline-md text-primary financial-value break-words">
                    {formatWon(assets)}{' '}
                    <span className="text-body-sm font-body-sm text-on-surface-variant font-normal">
                      / {formatWon(target)}
                    </span>
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-headline-sm font-headline-sm text-secondary font-bold">
                    {progress != null ? `${progress}%` : '-'}
                  </span>
                </div>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-4 mb-2 overflow-hidden border border-outline-variant">
                <div
                  className="progress-bar-gradient h-4 rounded-full transition-all"
                  style={{ width: `${progress ?? 0}%` }}
                />
              </div>
              <div className="flex justify-between text-label-sm font-label-sm text-on-surface-variant">
                <span>현재 자산</span>
                <span>목표 자산</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md relative z-10">
              <div className="bg-surface p-md rounded-lg border border-outline-variant flex items-start gap-sm opacity-80">
                <MaterialIcon name="trending_flat" className="text-on-surface-variant mt-xs" />
                <div className="min-w-0">
                  <p className="text-label-md font-label-md text-primary mb-xs flex items-center gap-1 flex-wrap">
                    현재 조건 유지 시
                    <WipBadge />
                  </p>
                  <p className="text-body-sm font-body-sm text-on-surface-variant">
                    목표 달성 시점 예측은 아직 준비 중이에요.
                  </p>
                </div>
              </div>
              <div className="bg-secondary-container p-md rounded-lg border border-secondary-fixed-dim flex items-start gap-sm opacity-80">
                <MaterialIcon name="trending_up" className="text-on-secondary-container mt-xs" />
                <div className="min-w-0">
                  <p className="text-label-md font-label-md text-on-secondary-container mb-xs flex items-center gap-1 flex-wrap">
                    조금 더 챙겨보면
                    <WipBadge />
                  </p>
                  <p className="text-body-sm font-body-sm text-on-secondary-container">
                    절감 시나리오 비교는 아직 공사 중이에요. 「만약에」에서 먼저 그려볼 수 있어요.
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
