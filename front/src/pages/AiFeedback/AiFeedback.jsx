import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Card,
  Input,
  MaterialIcon,
  ProgressBar,
  SegmentedControl,
  WipBadge,
} from '../../components/common';
import { PageContainer } from '../../components/layout';
import useCountUp from '../../hooks/useCountUp';
import { api } from '../../services/api';
import { getAccessToken, getStoredUser } from '../../services/authStorage';
import './AiFeedback.css';

const SIDE_ITEMS = [
  { id: 'overview', icon: 'analytics', label: '한눈에' },
  { id: 'portfolio', icon: 'description', label: '거래 목록' },
  { id: 'risk', icon: 'settings_applications', label: '예산 감각', wip: true },
  { id: 'audit', icon: 'history', label: '지난달', wip: true },
  { id: 'security', icon: 'shield', label: '보안', wip: true },
];

/** @see back/schema/accountBook.schema.js */
const ACCOUNT_CATEGORIES = {
  income: ['수입', '급여', '용돈', '투자수익', '환급', '기타수입'],
  expense: ['식비', '교통', '주거', '쇼핑', '구독', '카페', '통신', '의료', '기타'],
};

const SELECT_CLASS =
  'w-full h-[48px] px-md bg-surface-charcoal border border-border-hairline rounded-DEFAULT text-body-md font-body-md text-editorial-sage-light focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-shadow disabled:opacity-50';

/** Dark emerald palette: signal-advisory, primary, secondary, outline */
const CATEGORY_META = {
  식비: { icon: 'restaurant', color: '#F5A623', wrap: 'bg-signal-advisory-subtle text-signal-advisory' },
  교통: { icon: 'directions_car', color: '#48e493', wrap: 'bg-primary/15 text-primary' },
  주거: { icon: 'home', color: '#4edea3', wrap: 'bg-secondary/15 text-secondary' },
  쇼핑: { icon: 'shopping_bag', color: '#869488', wrap: 'bg-surface-container-high text-outline' },
  구독: { icon: 'subscriptions', color: '#F5A623', wrap: 'bg-signal-advisory-subtle text-signal-advisory' },
  카페: { icon: 'local_cafe', color: '#48e493', wrap: 'bg-primary/15 text-primary' },
  통신: { icon: 'smartphone', color: '#4edea3', wrap: 'bg-secondary/15 text-secondary' },
  의료: { icon: 'medical_services', color: '#869488', wrap: 'bg-surface-container-high text-outline' },
  기타: { icon: 'more_horiz', color: '#869488', wrap: 'bg-surface-container-high text-outline' },
  급여: { icon: 'payments', color: '#48e493', wrap: 'bg-primary/15 text-primary' },
  수입: { icon: 'account_balance_wallet', color: '#48e493', wrap: 'bg-primary/15 text-primary' },
  용돈: { icon: 'savings', color: '#4edea3', wrap: 'bg-secondary/15 text-secondary' },
  투자수익: { icon: 'trending_up', color: '#F5A623', wrap: 'bg-signal-advisory-subtle text-signal-advisory' },
  환급: { icon: 'replay', color: '#869488', wrap: 'bg-surface-container-high text-outline' },
  기타수입: { icon: 'attach_money', color: '#48e493', wrap: 'bg-primary/15 text-primary' },
};

const CHART_FALLBACK_COLORS = ['#F5A623', '#48e493', '#4edea3', '#869488', '#18C77A', '#FF5C4D', '#bbcabd', '#00a572'];
const CONIC_EMPTY = '#252b28';

const CREATE_ERROR_MESSAGES = {
  'type is required': '수입/지출 유형을 선택해주세요.',
  'invalid type': '수입 또는 지출만 선택할 수 있습니다.',
  'amount is required': '금액을 입력해주세요.',
  'invalid amount': '금액은 0보다 큰 숫자여야 합니다.',
  'category is required': '카테고리를 선택해주세요.',
  'invalid category': '카테고리는 30자 이내로 입력해주세요.',
  'date is required': '날짜를 입력해주세요.',
  'invalid date': '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)',
  'invalid memo': '메모는 200자 이내로 입력해주세요.',
  'invalid body': '수정할 내용이 올바르지 않습니다.',
  'no fields to update': '변경된 내용이 없습니다.',
  'transaction not found': '해당 거래를 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.',
  unauthorized: '로그인이 필요합니다. 로그인 후 다시 시도해주세요.',
  'invalid token': '로그인이 만료되었습니다. 다시 로그인해주세요.',
};

const PERIOD_OPTIONS = [
  { id: 'day', label: '일간', disabled: true, badge: <WipBadge /> },
  { id: 'week', label: '주간', disabled: true, badge: <WipBadge /> },
  { id: 'month', label: '월간' },
];

function getSeoulYearMonth() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { year: Number(map.year), month: Number(map.month) };
}

function getSeoulToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function createEmptyForm() {
  return {
    type: 'expense',
    amount: '',
    category: ACCOUNT_CATEGORIES.expense[0],
    date: getSeoulToday(),
    memo: '',
  };
}

function formatWon(value) {
  if (value == null || !Number.isFinite(Number(value))) return '-';
  return `₩${Math.round(Number(value)).toLocaleString('ko-KR')}`;
}

function formatDate(value) {
  if (!value) return '-';
  return String(value);
}

function getCategoryMeta(category) {
  return (
    CATEGORY_META[category] || {
      icon: 'receipt_long',
      color: '#869488',
      wrap: 'bg-surface-container-high text-outline',
    }
  );
}

function getAccountBookErrorMessage(error) {
  if (error?.status === 401 || error?.code === 'unauthorized' || error?.code === 'invalid token') {
    return '로그인이 필요합니다. 로그인 후 다시 시도해주세요.';
  }
  if (error?.status >= 500) {
    return '가계부 데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
  return error?.message || '가계부 데이터를 불러오지 못했습니다.';
}

function getCreateErrorMessage(error) {
  if (error?.status === 401) {
    return CREATE_ERROR_MESSAGES[error.code] || CREATE_ERROR_MESSAGES.unauthorized;
  }
  if (error?.status === 404) {
    return CREATE_ERROR_MESSAGES['transaction not found'];
  }
  if (error?.status === 400) {
    return CREATE_ERROR_MESSAGES[error.code] || CREATE_ERROR_MESSAGES[error.message] || '입력값을 확인해주세요.';
  }
  if (error?.status >= 500) {
    return '요청 처리 중 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
  return CREATE_ERROR_MESSAGES[error?.code] || error?.message || '요청에 실패했습니다.';
}

function validateTransactionForm(form) {
  if (form.type !== 'income' && form.type !== 'expense') {
    return '수입/지출 유형을 선택해주세요.';
  }
  const amount = Number(form.amount);
  if (form.amount === '' || !Number.isFinite(amount) || amount <= 0) {
    return '금액은 0보다 큰 숫자여야 합니다.';
  }
  if (!String(form.category || '').trim()) {
    return '카테고리를 선택해주세요.';
  }
  if (String(form.category).trim().length > 30) {
    return '카테고리는 30자 이내로 입력해주세요.';
  }
  if (!form.date) {
    return '날짜를 입력해주세요.';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
    return '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)';
  }
  if (String(form.memo || '').length > 200) {
    return '메모는 200자 이내로 입력해주세요.';
  }
  return '';
}

function toTransactionPayload(form) {
  return {
    type: form.type,
    amount: Number(form.amount),
    category: String(form.category).trim(),
    date: form.date,
    memo: String(form.memo || '').trim(),
  };
}

function transactionToForm(item) {
  return {
    type: item.type === 'income' ? 'income' : 'expense',
    amount: String(item.amount ?? ''),
    category: item.category || ACCOUNT_CATEGORIES.expense[0],
    date: item.date || getSeoulToday(),
    memo: item.memo || '',
  };
}

function buildConicGradient(items) {
  if (!items.length) return `conic-gradient(${CONIC_EMPTY} 0% 100%)`;
  let cursor = 0;
  const stops = items.map((item, index) => {
    const start = cursor;
    const end = cursor + Math.max(item.ratio, 0);
    cursor = end;
    const color = getCategoryMeta(item.category).color || CHART_FALLBACK_COLORS[index % CHART_FALLBACK_COLORS.length];
    return `${color} ${start}% ${end}%`;
  });
  if (cursor < 100) {
    stops.push(`${CONIC_EMPTY} ${cursor}% 100%`);
  }
  return `conic-gradient(${stops.join(', ')})`;
}

function buildInsightHeadline({ balance, topExpense, monthLabel }) {
  const balanceNum = Number(balance);
  const top = topExpense?.category;
  if (top) {
    return (
      <>
        {monthLabel ? `${monthLabel} ` : '이번 달 '}
        지출 1위는 <span className="text-signal-advisory font-bold">{top}</span>
        입니다
      </>
    );
  }
  if (Number.isFinite(balanceNum)) {
    return (
      <>
        이번 달 잔액은{' '}
        <span className={`font-bold ${balanceNum >= 0 ? 'text-signal-positive' : 'text-signal-risk'}`}>
          {formatWon(balanceNum)}
        </span>
        입니다
      </>
    );
  }
  return '가계부 거래를 등록하면 AI 인사이트가 여기에 모입니다';
}

export default function AiFeedback() {
  const [sideTab, setSideTab] = useState('overview');
  const [period, setPeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [summary, setSummary] = useState(null);
  const [categorySummary, setCategorySummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [monthLabel, setMonthLabel] = useState('');
  const [form, setForm] = useState(createEmptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState('');
  const [listActionError, setListActionError] = useState('');
  const [listActionSuccess, setListActionSuccess] = useState('');
  const [actionId, setActionId] = useState(null);

  const user = getStoredUser();
  const userInitials = (user?.name || user?.loginId || 'U').slice(0, 2).toUpperCase();
  const categoryOptions = ACCOUNT_CATEGORIES[form.type] || ACCOUNT_CATEGORIES.expense;
  const editCategoryOptions = useMemo(() => {
    if (!editForm) return ACCOUNT_CATEGORIES.expense;
    const base = ACCOUNT_CATEGORIES[editForm.type] || ACCOUNT_CATEGORIES.expense;
    if (editForm.category && !base.includes(editForm.category)) {
      return [editForm.category, ...base];
    }
    return base;
  }, [editForm]);

  const expenseCategories = useMemo(() => {
    const items = categorySummary?.items || [];
    return items.filter((item) => item.type === 'expense');
  }, [categorySummary]);

  const incomeCategories = useMemo(() => {
    const items = categorySummary?.items || [];
    return items.filter((item) => item.type === 'income');
  }, [categorySummary]);

  const maxExpenseAmount = useMemo(() => {
    return expenseCategories.reduce((max, item) => Math.max(max, Number(item.amount) || 0), 0);
  }, [expenseCategories]);

  const loadAccountBook = async ({ silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true);
      setErrorMessage('');
      setIsUnauthorized(false);
    }

    if (!getAccessToken()) {
      setIsUnauthorized(true);
      setErrorMessage('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
      setSummary(null);
      setCategorySummary(null);
      setTransactions([]);
      if (!silent) setIsLoading(false);
      return;
    }

    const { year, month } = getSeoulYearMonth();
    setMonthLabel(`${year}년 ${month}월`);
    const params = { year, month };

    try {
      const [summaryRes, categoryRes, listRes] = await Promise.all([
        api.getAccountBookSummary(params),
        api.getAccountBookCategorySummary(params),
        api.getAccountBook(params),
      ]);
      setSummary(summaryRes);
      setCategorySummary(categoryRes);
      setTransactions(listRes.transactions || []);
      if (!silent) {
        setErrorMessage('');
        setIsUnauthorized(false);
      }
    } catch (error) {
      const unauthorized = error?.status === 401;
      setIsUnauthorized(unauthorized);
      setErrorMessage(getAccountBookErrorMessage(error));
      if (!silent) {
        setSummary(null);
        setCategorySummary(null);
        setTransactions([]);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccountBook();
  }, []);

  const updateForm = (field, value) => {
    setForm((prev) => {
      if (field === 'type') {
        const nextType = value === 'income' ? 'income' : 'expense';
        return {
          ...prev,
          type: nextType,
          category: ACCOUNT_CATEGORIES[nextType][0],
        };
      }
      return { ...prev, [field]: value };
    });
    setFormError('');
    setFormSuccess('');
  };

  const updateEditForm = (field, value) => {
    setEditForm((prev) => {
      if (!prev) return prev;
      if (field === 'type') {
        const nextType = value === 'income' ? 'income' : 'expense';
        const nextCategories = ACCOUNT_CATEGORIES[nextType];
        const keepCategory = nextCategories.includes(prev.category) ? prev.category : nextCategories[0];
        return {
          ...prev,
          type: nextType,
          category: keepCategory,
        };
      }
      return { ...prev, [field]: value };
    });
    setEditError('');
    setListActionSuccess('');
  };

  const startEdit = (item) => {
    if (actionId != null) return;
    setEditingId(item.id);
    setEditForm(transactionToForm(item));
    setEditError('');
    setListActionError('');
    setListActionSuccess('');
  };

  const cancelEdit = () => {
    if (actionId != null) return;
    setEditingId(null);
    setEditForm(null);
    setEditError('');
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (isSubmitting || actionId != null) return;

    setFormError('');
    setFormSuccess('');

    if (!getAccessToken()) {
      setIsUnauthorized(true);
      setFormError('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
      return;
    }

    const localError = validateTransactionForm(form);
    if (localError) {
      setFormError(localError);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createAccountBook(toTransactionPayload(form));
      setForm(createEmptyForm());
      setFormSuccess('거래가 등록되었습니다.');
      await loadAccountBook({ silent: true });
    } catch (error) {
      if (error?.status === 401) {
        setIsUnauthorized(true);
      }
      setFormError(getCreateErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (actionId != null || editingId == null || !editForm) return;

    setEditError('');
    setListActionError('');
    setListActionSuccess('');

    if (!getAccessToken()) {
      setIsUnauthorized(true);
      setEditError('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
      return;
    }

    const localError = validateTransactionForm(editForm);
    if (localError) {
      setEditError(localError);
      return;
    }

    setActionId(editingId);
    try {
      await api.updateAccountBook(editingId, toTransactionPayload(editForm));
      setEditingId(null);
      setEditForm(null);
      setListActionSuccess('거래가 수정되었습니다.');
      await loadAccountBook({ silent: true });
    } catch (error) {
      if (error?.status === 401) {
        setIsUnauthorized(true);
      }
      setEditError(getCreateErrorMessage(error));
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (item) => {
    if (actionId != null || isSubmitting) return;

    const label = `${item.category || '거래'} ${formatWon(item.amount)}`;
    const confirmed = window.confirm(`이 거래를 삭제할까요?\n\n${label}\n${item.date || ''}`);
    if (!confirmed) return;

    setListActionError('');
    setListActionSuccess('');
    setEditError('');

    if (!getAccessToken()) {
      setIsUnauthorized(true);
      setListActionError('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
      return;
    }

    if (editingId === item.id) {
      setEditingId(null);
      setEditForm(null);
    }

    setActionId(item.id);
    try {
      await api.deleteAccountBook(item.id);
      setListActionSuccess('거래가 삭제되었습니다.');
      await loadAccountBook({ silent: true });
    } catch (error) {
      if (error?.status === 401) {
        setIsUnauthorized(true);
      }
      setListActionError(getCreateErrorMessage(error));
    } finally {
      setActionId(null);
    }
  };

  const hasData = (summary?.count ?? 0) > 0 || transactions.length > 0;
  const isBusy = isSubmitting || actionId != null;
  const dataReady = !isLoading && !errorMessage && !!summary;
  const totalIncome = Number(summary?.totalIncome) || 0;
  const totalExpense = Number(summary?.totalExpense) || 0;
  const budgetRatio =
    totalIncome > 0 ? Math.min(100, Math.round((totalExpense / totalIncome) * 1000) / 10) : null;
  const remainingBuffer = totalIncome > 0 ? Math.max(0, totalIncome - totalExpense) : null;
  const topExpense = expenseCategories[0] || null;

  const incomeDisplay = useCountUp(dataReady ? summary?.totalIncome : null);
  const expenseDisplay = useCountUp(dataReady ? summary?.totalExpense : null);
  const balanceDisplay = useCountUp(dataReady ? summary?.balance : null);
  const countDisplay = useCountUp(dataReady ? summary?.count ?? 0 : null);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-stretch antialiased min-w-0 bg-canvas-deep">
      <nav className="hidden md:flex flex-col w-64 shrink-0 self-stretch min-h-[calc(100vh-4rem)] sticky top-16 bg-surface-charcoal/90 border-r border-border-hairline py-md gap-sm z-40">
        {SIDE_ITEMS.map((item) => {
          const active = sideTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSideTab(item.id)}
              className={
                active
                  ? 'bg-primary-container text-on-primary-container rounded-lg mx-2 my-1 px-md py-sm flex items-center gap-md scale-95 duration-150 shadow-extrude-sm'
                  : 'text-on-surface-variant hover:bg-surface-architectural mx-2 my-1 rounded-lg px-md py-sm flex items-center gap-md hover:text-editorial-sage-light transition-all group'
              }
            >
              <MaterialIcon name={item.icon} filled={active} className={active ? '' : 'group-hover:text-primary transition-colors'} />
              <span className="text-label-md font-label-md flex-1 text-left">{item.label}</span>
              {item.wip ? <WipBadge /> : null}
            </button>
          );
        })}
        <div className="mt-auto px-md pb-md flex flex-col gap-sm">
          <div className="flex items-center gap-sm">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-label-sm">
              {userInitials}
            </div>
            <div>
              <div className="text-label-md font-label-md font-bold text-editorial-sage-light">{user?.name || '가계부'}</div>
              <div className="text-label-sm font-label-sm text-on-surface-variant">{monthLabel || '이번 달'}</div>
            </div>
          </div>
          <Button variant="extruded" fullWidth className="py-sm mt-sm" onClick={loadAccountBook} disabled={isLoading}>
            새로고침
          </Button>
        </div>
      </nav>

      <PageContainer className="flex-1 gap-space-xl py-md md:py-space-xl">
        <nav className="md:hidden flex gap-sm overflow-x-auto hide-scrollbar pb-sm border-b border-border-hairline -mx-1 px-1 section-reveal">
          {SIDE_ITEMS.map((item) => {
            const active = sideTab === item.id;
            return (
              <button
                key={`mobile-${item.id}`}
                type="button"
                onClick={() => setSideTab(item.id)}
                className={`shrink-0 px-md py-2 rounded-full text-label-sm font-label-md min-h-[44px] inline-flex items-center gap-1 ${
                  active
                    ? 'bg-primary-container text-on-primary-container font-bold shadow-extrude-sm'
                    : 'bg-surface-architectural text-on-surface-variant border border-border-hairline'
                }`}
              >
                {item.label}
                {item.wip ? <WipBadge /> : null}
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md section-reveal">
          <div>
            <h1 className="font-display text-[2rem] sm:text-headline-lg text-editorial-sage-light tracking-tight m-0 break-keep">
              이번 달 가계부
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-sm m-0">
              {monthLabel ? `${monthLabel}, 어디에 썼는지 같이 볼까요` : '어디에 썼는지 같이 볼까요'}
            </p>
          </div>
          <SegmentedControl
            options={PERIOD_OPTIONS}
            value={period}
            onChange={setPeriod}
            size="sm"
            className="self-stretch sm:self-start overflow-x-auto"
          />
        </div>

        {isLoading ? (
          <Card variant="architectural" className="p-md md:p-lg section-reveal flex items-center gap-md">
            <MaterialIcon name="progress_activity" className="text-primary text-headline-md animate-spin" />
            <p className="text-body-md font-body-md text-editorial-sage-muted m-0">가계부 데이터를 불러오는 중…</p>
          </Card>
        ) : null}

        {!isLoading && errorMessage ? (
          <Card variant="charcoal" className="p-md md:p-lg section-reveal border border-signal-risk/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
              <div className="min-w-0">
                <h3 className="font-headline-sm text-headline-sm text-editorial-sage-light m-0 mb-xs">
                  가계부를 표시할 수 없습니다
                </h3>
                <p className="text-body-sm font-body-sm text-signal-risk m-0 break-keep" role="alert">
                  {errorMessage}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-sm shrink-0">
                {isUnauthorized ? (
                  <Link to="/login">
                    <Button variant="pill" className="h-[44px] px-md w-full sm:w-auto">
                      로그인하기
                    </Button>
                  </Link>
                ) : (
                  <Button variant="secondary" className="h-[44px] px-md" onClick={loadAccountBook}>
                    다시 시도
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ) : null}

        {!isLoading && !errorMessage ? (
          <>
            <Card variant="charcoal" className="p-space-lg lg:p-space-xl section-reveal relative overflow-hidden" hoverLift>
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg">
                <div className="flex flex-col gap-space-xs max-w-3xl min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-2 h-2 rounded-full bg-signal-advisory" />
                    <span className="font-label-caps text-label-caps text-signal-advisory uppercase tracking-wider">
                      AI 지출 진단
                    </span>
                    <span className="text-outline text-body-sm">•</span>
                    <span className="font-label-caps text-label-caps text-on-surface-variant">
                      {monthLabel || '이번 달'} 분석
                    </span>
                  </div>
                  <h2 className="font-headline-md md:font-headline-lg text-headline-md md:text-headline-lg text-editorial-sage-light tracking-tight m-0 break-keep">
                    {buildInsightHeadline({
                      balance: summary?.balance,
                      topExpense,
                      monthLabel,
                    })}
                  </h2>
                  <p className="font-body-md text-body-md text-editorial-sage-muted leading-relaxed m-0">
                    잔액 {formatWon(summary?.balance)} · 수입 {formatWon(summary?.totalIncome)} · 지출{' '}
                    {formatWon(summary?.totalExpense)}
                    {topExpense
                      ? ` · ${topExpense.category} ${formatWon(topExpense.amount)} (${topExpense.ratio}%)`
                      : ''}
                    . 총 {summary?.count ?? 0}건을 집계했습니다.
                  </p>
                </div>
                <Button
                  variant="extruded"
                  className="px-space-lg py-space-sm shrink-0 self-end lg:self-center"
                  onClick={loadAccountBook}
                  disabled={isLoading}
                >
                  데이터 새로고침
                  <MaterialIcon name="refresh" className="text-[18px]" />
                </Button>
              </div>
            </Card>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-sm md:gap-md section-reveal section-reveal-delay-1">
              <SummaryCard label="총 수입" value={formatWon(incomeDisplay)} />
              <SummaryCard label="총 지출" value={formatWon(expenseDisplay)} />
              <SummaryCard label="잔액" value={formatWon(balanceDisplay)} />
              <SummaryCard
                label="거래 건수"
                value={countDisplay != null ? `${Math.round(countDisplay)}건` : '-'}
              />
            </div>

            <Card variant="architectural" className="p-space-lg lg:p-space-xl section-reveal section-reveal-delay-1 flex flex-col gap-space-md" hoverLift>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                <div className="flex items-center gap-2">
                  <MaterialIcon name="account_balance_wallet" className="text-primary text-[20px]" />
                  <span className="font-label-caps text-label-caps text-editorial-sage-light uppercase tracking-wider">
                    {monthLabel || '이번 달'} 총 지출 현황
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-numeric text-label-numeric">
                  {budgetRatio != null ? `수입 대비 ${budgetRatio}%` : '수입 데이터 대기'}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-label-caps text-label-caps text-outline">KRW</span>
                  <span className="font-display text-[2rem] sm:text-headline-lg text-editorial-sage-light tracking-tight font-bold financial-value">
                    {formatWon(expenseDisplay)}
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-outline">
                  월 수입(예산 기준){' '}
                  <span className="text-editorial-sage-light font-label-numeric font-semibold">
                    {formatWon(incomeDisplay)}
                  </span>
                </span>
              </div>
              <ProgressBar
                value={budgetRatio ?? 0}
                heightClass="h-3"
                barClassName="progress-bar-gradient"
                animate={dataReady && budgetRatio != null}
              />
              <div className="flex justify-between items-center font-label-numeric text-label-numeric flex-wrap gap-2">
                <span className="text-on-surface-variant">집행 {formatWon(totalExpense)}</span>
                <span className="text-signal-advisory flex items-center gap-1 font-semibold">
                  <MaterialIcon name="shield" className="text-[16px]" />
                  잔여 버퍼: {remainingBuffer != null ? formatWon(remainingBuffer) : '-'}
                </span>
              </div>
            </Card>

            <Card variant="architectural" className="p-md md:p-lg section-reveal min-w-0" hoverLift>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm mb-md">
                <h2 className="font-headline-sm text-headline-sm text-editorial-sage-light m-0">거래 등록</h2>
                <span className="text-label-sm font-label-sm text-on-surface-variant">
                  오늘 날짜 기본값 · 현재 월 통계에 반영
                </span>
              </div>

              {formError ? (
                <p
                  className="text-body-sm font-body-sm text-signal-risk mb-md px-sm py-xs bg-signal-risk-subtle rounded-lg border border-signal-risk/20"
                  role="alert"
                >
                  {formError}
                  {isUnauthorized ? (
                    <>
                      {' '}
                      <Link className="text-secondary font-medium underline" to="/login">
                        로그인하기
                      </Link>
                    </>
                  ) : null}
                </p>
              ) : null}
              {formSuccess ? (
                <p className="text-body-sm font-body-sm text-signal-positive mb-md px-sm py-xs bg-signal-positive-subtle rounded-lg m-0">
                  {formSuccess}
                </p>
              ) : null}

              <form className="space-y-md" onSubmit={handleCreate}>
                <div className="flex flex-col sm:flex-row gap-sm">
                  {[
                    { id: 'expense', label: '지출' },
                    { id: 'income', label: '수입' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isBusy}
                      onClick={() => updateForm('type', item.id)}
                      className={`flex-1 min-h-[44px] rounded-full text-label-sm font-label-md border transition-all ${
                        form.type === item.id
                          ? 'bg-primary-container text-on-primary-container border-primary shadow-extrude-sm'
                          : 'bg-surface-charcoal text-on-surface-variant border-border-hairline'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm md:gap-md">
                  <Input
                    id="account-amount"
                    label="금액 (원)"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="15000"
                    icon="payments"
                    required
                    value={form.amount}
                    onChange={(e) => updateForm('amount', e.target.value)}
                    disabled={isBusy}
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-label-caps tracking-wider text-editorial-sage-muted" htmlFor="account-category">
                      카테고리 <span className="text-signal-risk">*</span>
                    </label>
                    <select
                      id="account-category"
                      className={SELECT_CLASS}
                      value={form.category}
                      onChange={(e) => updateForm('category', e.target.value)}
                      disabled={isBusy}
                      required
                    >
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    id="account-date"
                    label="날짜"
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => updateForm('date', e.target.value)}
                    disabled={isBusy}
                  />
                  <Input
                    id="account-memo"
                    label="메모 (선택)"
                    type="text"
                    placeholder="예: 점심 식사"
                    icon="edit_note"
                    value={form.memo}
                    onChange={(e) => updateForm('memo', e.target.value)}
                    disabled={isBusy}
                    hint="최대 200자"
                  />
                </div>

                <Button type="submit" variant="extruded" className="h-[48px] w-full sm:w-auto px-lg" disabled={isBusy}>
                  {isSubmitting ? '등록 중…' : '거래 등록'}
                </Button>
              </form>
            </Card>

            {!hasData ? (
              <Card variant="charcoal" className="p-md md:p-lg section-reveal">
                <p className="text-body-md font-body-md text-on-surface-variant m-0 break-keep">
                  {monthLabel}에 등록된 거래가 없습니다. 위에서 거래를 추가해보세요.
                </p>
              </Card>
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-md md:gap-space-xl min-w-0 section-reveal section-reveal-delay-2">
              <Card variant="architectural" className="col-span-1 lg:col-span-8 p-md md:p-lg flex flex-col min-w-0" hoverLift>
                <div className="flex justify-between items-center mb-md md:mb-lg gap-sm">
                  <h2 className="font-headline-sm text-headline-sm text-editorial-sage-light m-0">카테고리별 지출</h2>
                  <span className="text-label-sm font-label-sm text-on-surface-variant shrink-0">{monthLabel}</span>
                </div>
                {expenseCategories.length === 0 ? (
                  <p className="text-body-sm font-body-sm text-on-surface-variant m-0 py-xl text-center">
                    표시할 지출 카테고리가 없습니다.
                  </p>
                ) : (
                  <div className="relative w-full pt-8 sm:pt-10">
                    <div className="absolute inset-x-0 top-8 sm:top-10 bottom-8 flex flex-col justify-between pointer-events-none opacity-30">
                      <div className="w-full border-t border-border-subtle" />
                      <div className="w-full border-t border-border-subtle" />
                      <div className="w-full border-t border-border-subtle" />
                      <div className="w-full border-t border-border-subtle" />
                      <div className="w-full border-t border-border-subtle" />
                    </div>
                    <div className="relative z-10 flex items-end justify-between gap-1 sm:gap-sm md:gap-md h-[180px] sm:h-[220px] w-full">
                      {expenseCategories.slice(0, 8).map((item, index) => {
                        const heightPct =
                          maxExpenseAmount > 0
                            ? Math.max(8, Math.round((Number(item.amount) / maxExpenseAmount) * 100))
                            : 8;
                        const isTop = index === 0;
                        return (
                          <div
                            key={`${item.category}-${item.type}`}
                            className="flex-1 min-w-0 h-full flex flex-col items-center justify-end gap-xs group"
                          >
                            <div className="w-full flex-1 flex items-end justify-center relative min-h-0">
                              <div
                                className={`absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] py-0.5 px-1.5 rounded font-bold whitespace-nowrap z-20 ${
                                  isTop
                                    ? 'bg-primary text-on-primary'
                                    : 'bg-surface-container-high text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity'
                                }`}
                              >
                                {item.ratio}%
                              </div>
                              <div
                                className={`ai-feedback__bar w-full max-w-[36px] sm:max-w-[44px] rounded-t-sm ${
                                  isTop ? 'bg-primary' : 'bg-surface-container-high group-hover:bg-secondary transition-colors'
                                }`}
                                style={{ height: `${heightPct}%`, animationDelay: `${index * 60}ms` }}
                                title={`${item.category}: ${formatWon(item.amount)} (${item.ratio}%)`}
                              />
                            </div>
                            <span
                              className={`text-label-sm font-label-sm truncate max-w-full shrink-0 ${
                                isTop ? 'text-primary font-bold' : 'text-on-surface-variant'
                              }`}
                            >
                              {item.category}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>

              <Card variant="architectural" className="col-span-1 lg:col-span-4 p-md md:p-lg flex flex-col min-w-0" hoverLift>
                <h2 className="font-headline-sm text-headline-sm text-editorial-sage-light mb-md m-0">카테고리별 분포</h2>
                <div className="flex-1 flex flex-col items-center justify-center py-md">
                  <div
                    className="ai-feedback__donut relative w-36 h-36 sm:w-48 sm:h-48 rounded-full mb-lg"
                    style={{ background: buildConicGradient(expenseCategories) }}
                  >
                    <div className="absolute inset-3 sm:inset-4 bg-surface-architectural rounded-full flex flex-col items-center justify-center shadow-inner px-2 text-center border border-border-hairline">
                      <span className="text-label-sm font-label-sm text-on-surface-variant">총 지출</span>
                      <span className="text-headline-sm font-headline-sm font-bold text-editorial-sage-light financial-value break-words">
                        {formatWon(summary?.totalExpense ?? categorySummary?.totalExpense)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-md px-sm">
                    {expenseCategories.length === 0 ? (
                      <span className="text-label-sm font-label-sm text-on-surface-variant">지출 카테고리 없음</span>
                    ) : (
                      expenseCategories.slice(0, 6).map((item) => (
                        <div key={`legend-${item.category}`} className="flex items-center gap-xs">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: getCategoryMeta(item.category).color }}
                          />
                          <span className="text-label-sm font-label-sm text-editorial-sage-muted">
                            {item.category} ({item.ratio}%)
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  {incomeCategories.length > 0 ? (
                    <div className="mt-md w-full border-t border-border-subtle pt-md">
                      <p className="text-label-sm font-label-sm text-on-surface-variant m-0 mb-sm text-center">수입 카테고리</p>
                      <div className="flex flex-wrap justify-center gap-sm">
                        {incomeCategories.map((item) => (
                          <span
                            key={`income-${item.category}`}
                            className="text-label-sm font-label-sm bg-surface-charcoal px-sm py-xs rounded border border-border-subtle"
                          >
                            {item.category} {formatWon(item.amount)} ({item.ratio}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </Card>

              <Card variant="charcoal" className="col-span-1 lg:col-span-12 p-0 flex flex-col overflow-hidden min-w-0 section-reveal section-reveal-delay-3">
                <div className="p-md md:p-lg border-b border-border-hairline flex justify-between items-center gap-sm bg-surface-architectural/50">
                  <div className="flex items-center gap-sm min-w-0">
                    <div className="w-10 h-10 rounded-DEFAULT bg-surface-architectural border border-border-subtle flex items-center justify-center text-primary shrink-0">
                      <MaterialIcon name="receipt_long" className="text-[22px]" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-headline-sm text-headline-sm text-editorial-sage-light m-0">상세 거래 내역</h2>
                      <span className="font-label-caps text-label-caps text-outline tracking-wider uppercase">
                        최근 등록된 거래 피드
                      </span>
                    </div>
                  </div>
                  <span className="text-label-md font-label-md text-on-surface-variant shrink-0">{transactions.length}건</span>
                </div>
                {listActionError ? (
                  <p
                    className="mx-md mt-md text-body-sm font-body-sm text-signal-risk px-sm py-xs bg-signal-risk-subtle rounded-lg border border-signal-risk/20"
                    role="alert"
                  >
                    {listActionError}
                  </p>
                ) : null}
                {listActionSuccess ? (
                  <p className="mx-md mt-md text-body-sm font-body-sm text-signal-positive px-sm py-xs bg-signal-positive-subtle rounded-lg m-0">
                    {listActionSuccess}
                  </p>
                ) : null}
                <div className="flex-1 overflow-y-auto max-h-[520px]">
                  {transactions.length === 0 ? (
                    <p className="p-md text-body-sm font-body-sm text-on-surface-variant m-0">표시할 거래가 없습니다.</p>
                  ) : (
                    transactions.map((item, index) => {
                      const meta = getCategoryMeta(item.category);
                      const isIncome = item.type === 'income';
                      const isEditing = editingId === item.id;
                      const rowBusy = actionId === item.id;

                      return (
                        <div
                          key={item.id || `${item.date}-${index}`}
                          className={`${index === transactions.length - 1 ? '' : 'border-b border-border-subtle'}`}
                        >
                          <div className="ai-feedback__tx-row flex flex-col gap-sm p-md hover:bg-surface-container min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm min-w-0">
                              <div className="flex items-center gap-md min-w-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${meta.wrap}`}>
                                  <MaterialIcon name={meta.icon} />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-body-md font-body-md text-editorial-sage-light font-medium truncate">
                                    {item.category}
                                    <span className="ml-sm text-label-sm font-label-sm text-on-surface-variant">
                                      {isIncome ? '수입' : '지출'}
                                    </span>
                                  </div>
                                  <div className="text-label-sm font-label-sm text-on-surface-variant truncate">
                                    {formatDate(item.date)}
                                    {item.memo ? ` · ${item.memo}` : ''}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-sm pl-[52px] sm:pl-0 shrink-0">
                                <div className="text-left sm:text-right">
                                  <div
                                    className={`text-body-md font-body-md font-semibold financial-value ${
                                      isIncome ? 'text-signal-positive' : 'text-editorial-sage-light'
                                    }`}
                                  >
                                    {isIncome ? '+' : '-'}
                                    {formatWon(item.amount)}
                                  </div>
                                  <div className="text-label-sm font-label-sm text-on-surface-variant">{item.type}</div>
                                </div>
                                <div className="flex gap-sm">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="h-[44px] px-md rounded-full"
                                    disabled={isBusy}
                                    onClick={() => (isEditing ? cancelEdit() : startEdit(item))}
                                  >
                                    {isEditing ? '닫기' : '수정'}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="h-[44px] px-md rounded-full text-signal-risk border-signal-risk/40"
                                    disabled={isBusy}
                                    onClick={() => handleDelete(item)}
                                  >
                                    {rowBusy ? '삭제 중…' : '삭제'}
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {isEditing && editForm ? (
                              <form
                                className="rounded-lg border border-border-hairline bg-surface-architectural p-md space-y-md"
                                onSubmit={handleUpdate}
                              >
                                {editError ? (
                                  <p
                                    className="text-body-sm font-body-sm text-signal-risk m-0 px-sm py-xs bg-signal-risk-subtle rounded-lg border border-signal-risk/20"
                                    role="alert"
                                  >
                                    {editError}
                                  </p>
                                ) : null}
                                <div className="flex flex-col sm:flex-row gap-sm">
                                  {[
                                    { id: 'expense', label: '지출' },
                                    { id: 'income', label: '수입' },
                                  ].map((option) => (
                                    <button
                                      key={option.id}
                                      type="button"
                                      disabled={rowBusy}
                                      onClick={() => updateEditForm('type', option.id)}
                                      className={`flex-1 min-h-[44px] rounded-full text-label-sm font-label-md border ${
                                        editForm.type === option.id
                                          ? 'bg-primary-container text-on-primary-container border-primary'
                                          : 'bg-surface-charcoal text-on-surface-variant border-border-hairline'
                                      }`}
                                    >
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                                  <Input
                                    id={`edit-amount-${item.id}`}
                                    label="금액 (원)"
                                    type="number"
                                    placeholder="15000"
                                    icon="payments"
                                    required
                                    value={editForm.amount}
                                    onChange={(e) => updateEditForm('amount', e.target.value)}
                                    disabled={rowBusy}
                                  />
                                  <div className="flex flex-col gap-1.5">
                                    <label
                                      className="font-label-caps text-label-caps tracking-wider text-editorial-sage-muted"
                                      htmlFor={`edit-category-${item.id}`}
                                    >
                                      카테고리
                                    </label>
                                    <select
                                      id={`edit-category-${item.id}`}
                                      className={SELECT_CLASS}
                                      value={editForm.category}
                                      onChange={(e) => updateEditForm('category', e.target.value)}
                                      disabled={rowBusy}
                                      required
                                    >
                                      {editCategoryOptions.map((category) => (
                                        <option key={category} value={category}>
                                          {category}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <Input
                                    id={`edit-date-${item.id}`}
                                    label="날짜"
                                    type="date"
                                    required
                                    value={editForm.date}
                                    onChange={(e) => updateEditForm('date', e.target.value)}
                                    disabled={rowBusy}
                                  />
                                  <Input
                                    id={`edit-memo-${item.id}`}
                                    label="메모 (선택)"
                                    type="text"
                                    placeholder="예: 점심 식사"
                                    icon="edit_note"
                                    value={editForm.memo}
                                    onChange={(e) => updateEditForm('memo', e.target.value)}
                                    disabled={rowBusy}
                                  />
                                </div>
                                <div className="flex flex-col-reverse sm:flex-row gap-sm">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="h-[44px] px-md rounded-full"
                                    disabled={rowBusy}
                                    onClick={cancelEdit}
                                  >
                                    취소
                                  </Button>
                                  <Button type="submit" variant="extruded" className="h-[44px] px-md" disabled={rowBusy}>
                                    {rowBusy ? '저장 중…' : '수정 저장'}
                                  </Button>
                                </div>
                              </form>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>
          </>
        ) : null}
      </PageContainer>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <Card variant="architectural" className="p-md min-w-0" hoverLift>
      <p className="font-label-caps text-label-caps text-on-surface-variant m-0 mb-xs tracking-wider">{label}</p>
      <p className="text-body-md md:text-headline-sm font-headline-sm text-primary financial-value m-0 break-words">
        {value}
      </p>
    </Card>
  );
}
