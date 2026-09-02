/** 회원가입 폼 — Supabase 연동 전 더미 데이터 구조 */

export const ASSET_TYPES = [
  { value: 'deposit', label: '예금' },
  { value: 'savings', label: '적금' },
  { value: 'cash', label: '현금' },
  { value: 'investment', label: '투자자산' },
  { value: 'other', label: '기타' },
];

export const GOAL_PERIOD_OPTIONS = [
  { value: 6, label: '6개월' },
  { value: 12, label: '1년' },
  { value: 24, label: '2년' },
  { value: 36, label: '3년' },
  { value: 60, label: '5년' },
];

let idCounter = 0;

function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

export function createEmptyAsset() {
  return {
    id: nextId('asset'),
    type: 'deposit',
    name: '',
    amount: '',
  };
}

export function createEmptyLoan() {
  return {
    id: nextId('loan'),
    name: '',
    balance: '',
    interestRate: '',
    monthlyPayment: '',
  };
}

export const INITIAL_SIGNUP_FORM = {
  profile: {
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    termsAccepted: false,
  },
  financial: {
    monthlySalary: '',
    assets: [createEmptyAsset()],
    loans: [createEmptyLoan()],
  },
  goal: {
    targetAmount: '',
    targetMonths: 12,
  },
};

function parseNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

/**
 * 폼 state → Supabase 저장용 payload (비밀번호는 profile에만 포함, 로그 출력 시 제외 가능)
 */
export function buildSignupPayload(form) {
  return {
    profile: {
      name: form.profile.name.trim(),
      email: form.profile.email.trim(),
    },
    financial: {
      monthlySalary: parseNumber(form.financial.monthlySalary),
      assets: form.financial.assets
        .filter((item) => item.name.trim() || item.amount !== '')
        .map((item) => ({
          id: item.id,
          type: item.type,
          name: item.name.trim(),
          amount: parseNumber(item.amount) ?? 0,
        })),
      loans: form.financial.loans
        .filter((item) => item.name.trim() || item.balance !== '')
        .map((item) => ({
          id: item.id,
          name: item.name.trim(),
          balance: parseNumber(item.balance) ?? 0,
          interestRate: parseNumber(item.interestRate) ?? 0,
          monthlyPayment: parseNumber(item.monthlyPayment) ?? 0,
        })),
    },
    goal: {
      targetAmount: parseNumber(form.goal.targetAmount) ?? 0,
      targetMonths: Number(form.goal.targetMonths) || 0,
    },
    meta: {
      submittedAt: new Date().toISOString(),
      source: 'signup-wizard',
    },
  };
}

/** 개발·테스트용 더미 예시 */
export const SIGNUP_DUMMY_EXAMPLE = {
  profile: {
    name: '홍길동',
    email: 'hong@example.com',
  },
  financial: {
    monthlySalary: 4200000,
    assets: [
      { id: 'asset-1', type: 'deposit', name: 'KB 정기예금', amount: 1500000 },
      { id: 'asset-2', type: 'cash', name: '비상금 통장', amount: 500000 },
      { id: 'asset-3', type: 'investment', name: '국내 주식', amount: 1000000 },
    ],
    loans: [
      {
        id: 'loan-1',
        name: '신한 직장인 신용대출',
        balance: 65000000,
        interestRate: 5.8,
        monthlyPayment: 1245000,
      },
    ],
  },
  goal: {
    targetAmount: 10000000,
    targetMonths: 24,
  },
  meta: {
    submittedAt: '2026-09-02T09:00:00.000Z',
    source: 'signup-wizard',
  },
};
