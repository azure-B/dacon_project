import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Input, MaterialIcon } from '../../components/common';
import { api } from '../../services/api';
import { getAccessToken, getStoredUser } from '../../services/authStorage';
import './AiFeedback.css';

const SIDE_ITEMS = [
  { id: 'overview', icon: 'analytics', label: '개요' },
  { id: 'portfolio', icon: 'description', label: '포트폴리오 보고서' },
  { id: 'risk', icon: 'settings_applications', label: '리스크 설정' },
  { id: 'audit', icon: 'history', label: '감사 로그' },
  { id: 'security', icon: 'shield', label: '보안' },
];

/** @see back/schema/accountBook.schema.js */
const ACCOUNT_CATEGORIES = {
  income: ['수입', '급여', '용돈', '투자수익', '환급', '기타수입'],
  expense: ['식비', '교통', '주거', '쇼핑', '구독', '카페', '통신', '의료', '기타'],
};

const SELECT_CLASS =
  'w-full h-[48px] px-md bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow disabled:opacity-50';

const CATEGORY_META = {
  식비: { icon: 'restaurant', color: '#1a365d', wrap: 'bg-primary-container/10 text-primary-container' },
  교통: { icon: 'directions_car', color: '#00b47d', wrap: 'bg-[#00b47d]/10 text-[#00b47d]' },
  주거: { icon: 'home', color: '#7db6ff', wrap: 'bg-secondary-container/20 text-on-secondary-container' },
  쇼핑: { icon: 'shopping_bag', color: '#455f88', wrap: 'bg-surface-variant text-on-surface-variant' },
  구독: { icon: 'subscriptions', color: '#5b6b8a', wrap: 'bg-surface-tint/10 text-surface-tint' },
  카페: { icon: 'local_cafe', color: '#cbdbf5', wrap: 'bg-secondary-fixed/40 text-on-secondary-container' },
  통신: { icon: 'smartphone', color: '#94a3b8', wrap: 'bg-surface-variant text-on-surface-variant' },
  의료: { icon: 'medical_services', color: '#c4c6cf', wrap: 'bg-surface-variant text-on-surface-variant' },
  기타: { icon: 'more_horiz', color: '#9aa0a6', wrap: 'bg-surface-variant text-on-surface-variant' },
  급여: { icon: 'payments', color: '#00b47d', wrap: 'bg-[#00b47d]/10 text-[#00b47d]' },
  수입: { icon: 'account_balance_wallet', color: '#00b47d', wrap: 'bg-[#00b47d]/10 text-[#00b47d]' },
  용돈: { icon: 'savings', color: '#7db6ff', wrap: 'bg-secondary-container/20 text-on-secondary-container' },
  투자수익: { icon: 'trending_up', color: '#1a365d', wrap: 'bg-primary-container/10 text-primary-container' },
  환급: { icon: 'replay', color: '#455f88', wrap: 'bg-surface-variant text-on-surface-variant' },
  기타수입: { icon: 'attach_money', color: '#00b47d', wrap: 'bg-[#00b47d]/10 text-[#00b47d]' },
};

const CHART_FALLBACK_COLORS = ['#1a365d', '#7db6ff', '#00b47d', '#cbdbf5', '#455f88', '#c4c6cf', '#94a3b8', '#5b6b8a'];

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
      color: '#9aa0a6',
      wrap: 'bg-surface-variant text-on-surface-variant',
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
  if (!items.length) return 'conic-gradient(#e5e7eb 0% 100%)';
  let cursor = 0;
  const stops = items.map((item, index) => {
    const start = cursor;
    const end = cursor + Math.max(item.ratio, 0);
    cursor = end;
    const color = getCategoryMeta(item.category).color || CHART_FALLBACK_COLORS[index % CHART_FALLBACK_COLORS.length];
    return `${color} ${start}% ${end}%`;
  });
  if (cursor < 100) {
    stops.push(`#e5e7eb ${cursor}% 100%`);
  }
  return `conic-gradient(${stops.join(', ')})`;
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

  return (
    <div className="flex min-h-full antialiased page-shell min-w-0">
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
              {userInitials}
            </div>
            <div>
              <div className="text-label-md font-label-md font-bold text-on-surface">{user?.name || '가계부'}</div>
              <div className="text-label-sm font-label-sm text-on-surface-variant">{monthLabel || '이번 달'}</div>
            </div>
          </div>
          <Button fullWidth className="py-sm mt-sm" onClick={loadAccountBook} disabled={isLoading}>
            새로고침
          </Button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 w-full max-w-container-max mx-auto px-3 sm:px-margin-mobile md:px-margin-desktop py-md md:py-lg overflow-x-hidden min-w-0">
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

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-lg gap-md border-b border-outline-variant pb-md">
            <div>
              <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-on-surface">AI 가계부 분석</h1>
              <p className="text-body-md font-body-md text-on-surface-variant mt-sm">
                {monthLabel ? `${monthLabel} 거래·요약 현황` : '이번 달 거래·요약 현황'}
              </p>
            </div>
            <div className="flex gap-sm bg-surface-container-low p-1 rounded-lg border border-outline-variant self-stretch sm:self-start md:self-auto overflow-x-auto hide-scrollbar">
              {[
                { id: 'day', label: '일간', disabled: true },
                { id: 'week', label: '주간', disabled: true },
                { id: 'month', label: '월간', disabled: false },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => !item.disabled && setPeriod(item.id)}
                  className={`px-md py-xs rounded-md text-label-md font-label-md min-h-[44px] shrink-0 ${
                    period === item.id
                      ? 'bg-surface shadow-sm text-primary font-medium'
                      : 'text-on-surface-variant hover:bg-surface-variant transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <Card className="p-md md:p-lg mb-md flex items-center gap-md">
              <MaterialIcon name="progress_activity" className="text-primary text-headline-md animate-spin" />
              <p className="text-body-md font-body-md text-on-surface m-0">가계부 데이터를 불러오는 중…</p>
            </Card>
          ) : null}

          {!isLoading && errorMessage ? (
            <Card className="p-md md:p-lg mb-md border border-error/20 bg-error-container">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
                <div className="min-w-0">
                  <h3 className="text-headline-sm font-headline-sm text-error m-0 mb-xs">가계부를 표시할 수 없습니다</h3>
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-sm md:gap-md mb-md md:mb-lg">
                <SummaryCard label="총 수입" value={formatWon(summary?.totalIncome)} />
                <SummaryCard label="총 지출" value={formatWon(summary?.totalExpense)} />
                <SummaryCard label="잔액" value={formatWon(summary?.balance)} />
                <SummaryCard label="거래 건수" value={`${summary?.count ?? 0}건`} />
              </div>

              <Card className="p-md md:p-lg mb-md md:mb-lg min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm mb-md">
                  <h2 className="text-headline-sm font-headline-sm text-on-surface m-0">거래 등록</h2>
                  <span className="text-label-sm font-label-sm text-on-surface-variant">
                    오늘 날짜 기본값 · 현재 월 통계에 반영
                  </span>
                </div>

                {formError ? (
                  <p
                    className="text-body-sm font-body-sm text-error mb-md px-sm py-xs bg-error-container rounded-lg border border-error/20"
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
                  <p className="text-body-sm font-body-sm text-on-tertiary-container mb-md px-sm py-xs bg-tertiary-fixed/20 rounded-lg m-0">
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
                        className={`flex-1 min-h-[44px] rounded-lg text-label-sm font-label-md border ${
                          form.type === item.id
                            ? 'bg-secondary-container text-on-secondary-container border-secondary'
                            : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant'
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
                    <div className="flex flex-col gap-xs">
                      <label className="text-label-md font-label-md text-on-surface" htmlFor="account-category">
                        카테고리
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

                  <Button type="submit" variant="secondary" className="h-[48px] w-full sm:w-auto px-lg" disabled={isBusy}>
                    {isSubmitting ? '등록 중…' : '거래 등록'}
                  </Button>
                </form>
              </Card>

              {!hasData ? (
                <Card className="p-md md:p-lg mb-md">
                  <p className="text-body-md font-body-md text-on-surface-variant m-0 break-keep">
                    {monthLabel}에 등록된 거래가 없습니다. 위에서 거래를 추가해보세요.
                  </p>
                </Card>
              ) : null}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-md md:gap-gutter min-w-0">
                <Card className="col-span-1 lg:col-span-4 bg-gradient-to-br from-surface to-surface-container-low p-md md:p-lg flex flex-col relative overflow-hidden min-w-0">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container rounded-full blur-3xl opacity-20 -mr-10 -mt-10 pointer-events-none" />
                  <div className="flex items-center gap-sm mb-md z-10">
                    <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
                      <MaterialIcon name="smart_toy" className="text-[18px]" />
                    </div>
                    <h2 className="text-headline-sm font-headline-sm text-on-surface">월간 요약 인사이트</h2>
                  </div>
                  <div className="flex flex-col gap-sm flex-1 z-10">
                    <div className="bg-surface-bright rounded-lg p-md border border-outline-variant/50 shadow-sm flex items-start gap-md">
                      <MaterialIcon
                        name={Number(summary?.balance) >= 0 ? 'savings' : 'trending_down'}
                        className={`mt-xs ${Number(summary?.balance) >= 0 ? 'text-on-tertiary-container' : 'text-error'}`}
                      />
                      <div>
                        <p className="text-body-md font-body-md text-on-surface leading-snug m-0">
                          이번 달 잔액은{' '}
                          <span className={`font-bold ${Number(summary?.balance) >= 0 ? 'text-on-tertiary-container' : 'text-error'}`}>
                            {formatWon(summary?.balance)}
                          </span>
                          입니다.
                        </p>
                        <p className="text-label-sm font-label-sm text-on-surface-variant mt-xs m-0">
                          수입 {formatWon(summary?.totalIncome)} · 지출 {formatWon(summary?.totalExpense)}
                        </p>
                      </div>
                    </div>
                    <div className="bg-surface-bright rounded-lg p-md border border-outline-variant/50 shadow-sm flex items-start gap-md">
                      <MaterialIcon name="category" className="text-primary mt-xs" />
                      <div>
                        <p className="text-body-md font-body-md text-on-surface leading-snug m-0">
                          {expenseCategories[0] ? (
                            <>
                              지출 1위는 <span className="font-bold text-primary">{expenseCategories[0].category}</span>
                              으로 {formatWon(expenseCategories[0].amount)} ({expenseCategories[0].ratio}%)입니다.
                            </>
                          ) : (
                            '이번 달 지출 카테고리 데이터가 없습니다.'
                          )}
                        </p>
                        <p className="text-label-sm font-label-sm text-on-surface-variant mt-xs m-0">
                          총 {summary?.count ?? 0}건의 거래를 집계했습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    fullWidth
                    className="mt-md py-sm z-10 bg-surface-container-high hover:bg-surface-variant min-h-[44px]"
                    onClick={loadAccountBook}
                    disabled={isLoading}
                  >
                    데이터 새로고침
                  </Button>
                </Card>

                <Card className="col-span-1 lg:col-span-8 p-md md:p-lg flex flex-col min-w-0">
                  <div className="flex justify-between items-center mb-md md:mb-lg gap-sm">
                    <h2 className="text-headline-sm font-headline-sm text-on-surface">카테고리별 지출</h2>
                    <span className="text-label-sm font-label-sm text-on-surface-variant shrink-0">{monthLabel}</span>
                  </div>
                  {expenseCategories.length === 0 ? (
                    <p className="text-body-sm font-body-sm text-on-surface-variant m-0 py-xl text-center">표시할 지출 카테고리가 없습니다.</p>
                  ) : (
                    <div className="flex-1 flex items-end justify-between gap-1 sm:gap-sm md:gap-md pt-10 sm:pt-xl relative min-h-[200px] sm:min-h-[240px] chart-responsive chart-responsive--clip">
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
                        <div className="w-full border-t border-outline-variant/30" />
                        <div className="w-full border-t border-outline-variant/30" />
                        <div className="w-full border-t border-outline-variant/30" />
                        <div className="w-full border-t border-outline-variant/30" />
                        <div className="w-full border-t border-outline-variant/30" />
                      </div>
                      {expenseCategories.slice(0, 8).map((item, index) => {
                        const heightPct =
                          maxExpenseAmount > 0 ? Math.max(8, Math.round((Number(item.amount) / maxExpenseAmount) * 100)) : 8;
                        const isTop = index === 0;
                        return (
                          <div key={`${item.category}-${item.type}`} className="flex flex-col items-center gap-xs z-10 group w-full relative">
                            {isTop ? (
                              <div className="absolute -top-7 sm:-top-8 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] py-1 px-2 rounded font-bold whitespace-nowrap z-20">
                                {item.ratio}%
                              </div>
                            ) : null}
                            <div
                              className={`w-full max-w-[32px] sm:max-w-[40px] rounded-t-sm ${
                                isTop
                                  ? 'bg-primary shadow-sm'
                                  : 'bg-secondary-fixed-dim group-hover:bg-secondary-container transition-colors'
                              }`}
                              style={{ height: `${heightPct}%` }}
                              title={`${item.category}: ${formatWon(item.amount)}`}
                            />
                            <span
                              className={`text-label-sm font-label-sm truncate max-w-full ${
                                isTop ? 'text-primary font-bold' : 'text-on-surface-variant'
                              }`}
                            >
                              {item.category}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                <Card className="col-span-1 lg:col-span-5 p-md md:p-lg flex flex-col min-w-0">
                  <h2 className="text-headline-sm font-headline-sm text-on-surface mb-md">카테고리별 분포</h2>
                  <div className="flex-1 flex flex-col items-center justify-center py-md">
                    <div
                      className="relative w-36 h-36 sm:w-48 sm:h-48 rounded-full mb-lg chart-responsive chart-responsive--clip"
                      style={{ background: buildConicGradient(expenseCategories) }}
                    >
                      <div className="absolute inset-3 sm:inset-4 bg-surface rounded-full flex flex-col items-center justify-center shadow-inner px-2 text-center">
                        <span className="text-label-sm font-label-sm text-on-surface-variant">총 지출</span>
                        <span className="text-headline-sm font-headline-sm font-bold text-on-surface financial-value break-words">
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
                            <span className="text-label-sm font-label-sm">
                              {item.category} ({item.ratio}%)
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                    {incomeCategories.length > 0 ? (
                      <div className="mt-md w-full border-t border-outline-variant pt-md">
                        <p className="text-label-sm font-label-sm text-on-surface-variant m-0 mb-sm text-center">수입 카테고리</p>
                        <div className="flex flex-wrap justify-center gap-sm">
                          {incomeCategories.map((item) => (
                            <span
                              key={`income-${item.category}`}
                              className="text-label-sm font-label-sm bg-surface-container-low px-sm py-xs rounded"
                            >
                              {item.category} {formatWon(item.amount)} ({item.ratio}%)
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </Card>

                <Card className="col-span-1 lg:col-span-7 p-0 flex flex-col overflow-hidden min-w-0">
                  <div className="p-md md:p-lg border-b border-outline-variant flex justify-between items-center gap-sm bg-surface-container-lowest">
                    <h2 className="text-headline-sm font-headline-sm text-on-surface">상세 거래 내역</h2>
                    <span className="text-label-md font-label-md text-on-surface-variant shrink-0">
                      {transactions.length}건
                    </span>
                  </div>
                  {listActionError ? (
                    <p className="mx-md mt-md text-body-sm font-body-sm text-error px-sm py-xs bg-error-container rounded-lg border border-error/20" role="alert">
                      {listActionError}
                    </p>
                  ) : null}
                  {listActionSuccess ? (
                    <p className="mx-md mt-md text-body-sm font-body-sm text-on-tertiary-container px-sm py-xs bg-tertiary-fixed/20 rounded-lg m-0">
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
                            className={`${index === transactions.length - 1 ? '' : 'border-b border-outline-variant/50'}`}
                          >
                            <div className="flex flex-col gap-sm p-md hover:bg-surface-container-low transition-colors min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm min-w-0">
                                <div className="flex items-center gap-md min-w-0">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${meta.wrap}`}>
                                    <MaterialIcon name={meta.icon} />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-body-md font-body-md text-on-surface font-medium truncate">
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
                                        isIncome ? 'text-on-tertiary-container' : 'text-on-surface'
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
                                      className="h-[44px] px-md"
                                      disabled={isBusy}
                                      onClick={() => (isEditing ? cancelEdit() : startEdit(item))}
                                    >
                                      {isEditing ? '닫기' : '수정'}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="h-[44px] px-md text-error border-error/40"
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
                                  className="rounded-lg border border-outline-variant bg-surface-container-lowest p-md space-y-md"
                                  onSubmit={handleUpdate}
                                >
                                  {editError ? (
                                    <p
                                      className="text-body-sm font-body-sm text-error m-0 px-sm py-xs bg-error-container rounded-lg border border-error/20"
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
                                        className={`flex-1 min-h-[44px] rounded-lg text-label-sm font-label-md border ${
                                          editForm.type === option.id
                                            ? 'bg-secondary-container text-on-secondary-container border-secondary'
                                            : 'bg-surface text-on-surface-variant border-outline-variant'
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
                                    <div className="flex flex-col gap-xs">
                                      <label
                                        className="text-label-md font-label-md text-on-surface"
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
                                      className="h-[44px] px-md"
                                      disabled={rowBusy}
                                      onClick={cancelEdit}
                                    >
                                      취소
                                    </Button>
                                    <Button type="submit" variant="secondary" className="h-[44px] px-md" disabled={rowBusy}>
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
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <Card className="p-md min-w-0">
      <p className="text-label-sm font-label-sm text-on-surface-variant m-0 mb-xs">{label}</p>
      <p className="text-body-md md:text-headline-sm font-headline-sm text-primary financial-value m-0 break-words">{value}</p>
    </Card>
  );
}
