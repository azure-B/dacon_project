/** 회원가입 폼 — POST /api/auth/signup DTO 매핑 */

import { getProductById } from './productCatalog';

export const MANUAL_ASSET_TYPES = [
  { value: '현금', label: '현금' },
  { value: '투자자산', label: '투자자산' },
  { value: '기타', label: '기타' },
];

export const GOAL_PERIOD_OPTIONS = [
  { value: 6, label: '6개월' },
  { value: 12, label: '1년' },
  { value: 24, label: '2년' },
  { value: 36, label: '3년' },
  { value: 60, label: '5년' },
];

/** @see back/schema/signup.schema.js */
export const LOGIN_ID_RE = /^[A-Za-z0-9_]{4,20}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_LETTER_RE = /[A-Za-z]/;
export const PASSWORD_DIGIT_RE = /\d/;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;
export const MAX_NAME_LENGTH = 30;

export function isValidLoginId(loginId) {
  return LOGIN_ID_RE.test(String(loginId || '').trim());
}

export function isValidPassword(password) {
  const value = String(password || '');
  return (
    value.length >= PASSWORD_MIN_LENGTH &&
    value.length <= PASSWORD_MAX_LENGTH &&
    PASSWORD_LETTER_RE.test(value) &&
    PASSWORD_DIGIT_RE.test(value)
  );
}

export function isValidEmail(email) {
  return EMAIL_RE.test(String(email || '').trim());
}

let idCounter = 0;

function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

export function createEmptyAsset() {
  return {
    id: nextId('holding-asset'),
    productId: '',
    isManual: false,
    manualType: '현금',
    manualName: '',
    amount: '',
    금융권_구분: '',
    은행명: '',
    상품명: '',
    상품_유형: '',
    이자율_최저: null,
    이자율_최고: null,
    만기: '',
    최소_금액: '',
  };
}

export function createEmptyLoan() {
  return {
    id: nextId('holding-loan'),
    productId: '',
    balance: '',
    monthlyPayment: '',
    금융권_구분: '',
    은행명: '',
    상품명: '',
    상품_유형: '',
    이자율_최저: null,
    이자율_최고: null,
    한도: '',
    대출_기간: '',
  };
}

export function applyProductToLoan(loan, productId) {
  const product = getProductById(productId);
  if (!product) {
    return { ...loan, productId: '' };
  }
  return {
    ...loan,
    productId: product.id,
    금융권_구분: product.금융권_구분,
    은행명: product.은행명,
    상품명: product.상품명,
    상품_유형: product.상품_유형,
    이자율_최저: product.이자율_최저,
    이자율_최고: product.이자율_최고,
    한도: product.한도 ?? '',
    대출_기간: product.대출_기간 ?? '',
  };
}

export function applyProductToAsset(asset, productId) {
  const product = getProductById(productId);
  if (!product) {
    return { ...asset, productId: '' };
  }
  return {
    ...asset,
    productId: product.id,
    isManual: false,
    manualName: '',
    금융권_구분: product.금융권_구분,
    은행명: product.은행명,
    상품명: product.상품명,
    상품_유형: product.상품_유형,
    이자율_최저: product.이자율_최저,
    이자율_최고: product.이자율_최고,
    만기: product.만기 ?? '',
    최소_금액: product.최소_금액 ?? '',
  };
}

export function setAssetManualMode(asset, isManual) {
  if (!isManual) {
    return {
      ...createEmptyAsset(),
      id: asset.id,
      amount: asset.amount,
      isManual: false,
    };
  }
  return {
    ...createEmptyAsset(),
    id: asset.id,
    amount: asset.amount,
    isManual: true,
    manualType: '현금',
    manualName: '',
  };
}

export const INITIAL_SIGNUP_FORM = {
  profile: {
    loginId: '',
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

function isAssetFilled(item) {
  return item.amount !== '' || item.productId !== '' || item.manualName.trim();
}

function isLoanFilled(item) {
  return item.balance !== '' || item.productId !== '';
}

function mapAssetItem(item) {
  const base = {
    id: item.id,
    productId: item.isManual ? null : item.productId === '' ? null : Number(item.productId),
    isManual: item.isManual,
    amount: parseNumber(item.amount) ?? 0,
  };

  if (item.isManual) {
    return {
      ...base,
      상품_유형: item.manualType,
      상품명: item.manualName.trim(),
      은행명: null,
      금융권_구분: null,
    };
  }

  return {
    ...base,
    금융권_구분: item.금융권_구분 || null,
    은행명: item.은행명 || null,
    상품명: item.상품명 || null,
    상품_유형: item.상품_유형 || null,
    이자율_최저: item.이자율_최저,
    이자율_최고: item.이자율_최고,
    만기: item.만기 || null,
    최소_금액: item.최소_금액 || null,
  };
}

function mapLoanItem(item) {
  return {
    id: item.id,
    productId: item.productId === '' ? null : Number(item.productId),
    balance: parseNumber(item.balance) ?? 0,
    monthlyPayment: parseNumber(item.monthlyPayment) ?? 0,
    금융권_구분: item.금융권_구분 || null,
    은행명: item.은행명 || null,
    상품명: item.상품명 || null,
    상품_유형: item.상품_유형 || null,
    이자율_최저: item.이자율_최저,
    이자율_최고: item.이자율_최고,
    한도: item.한도 || null,
    대출_기간: item.대출_기간 || null,
  };
}

/**
 * POST /api/auth/signup 요청 body
 * 폼 필드 → DTO 필드 매핑:
 * monthlySalary → monthlyIncome
 * assets → assetList
 * loans → loanList
 * targetMonths → targetPeriod
 */
export function buildSignupPayload(form) {
  const assetList = form.financial.assets.filter(isAssetFilled).map(mapAssetItem);
  const loanList = form.financial.loans.filter(isLoanFilled).map(mapLoanItem);

  return {
    profile: {
      loginId: form.profile.loginId.trim(),
      name: form.profile.name.trim(),
      email: form.profile.email.trim(),
      password: form.profile.password,
    },
    financial: {
      monthlyIncome: parseNumber(form.financial.monthlySalary),
      assetList,
      loanList,
    },
    goal: {
      targetAmount: parseNumber(form.goal.targetAmount) ?? 0,
      targetPeriod: Number(form.goal.targetMonths) || 0,
    },
  };
}

/** 개발·테스트용 더미 예시 (API payload 형태) */
export const SIGNUP_DUMMY_EXAMPLE = {
  profile: {
    loginId: 'hong_gil',
    name: '홍길동',
    email: 'hong@example.com',
    password: 'pass1234',
  },
  financial: {
    monthlyIncome: 4200000,
    assetList: [
      {
        id: 'holding-asset-1',
        productId: 12,
        isManual: false,
        상품_유형: '정기예금',
        은행명: 'KB국민은행',
        상품명: 'KB특별정기예금',
        amount: 1500000,
        이자율_최저: 3.0,
        이자율_최고: 3.2,
        만기: '12개월',
        최소_금액: '100만원',
      },
      {
        id: 'holding-asset-2',
        productId: null,
        isManual: true,
        상품_유형: '현금',
        상품명: '비상금 통장',
        은행명: null,
        amount: 500000,
      },
    ],
    loanList: [
      {
        id: 'holding-loan-1',
        productId: 0,
        상품_유형: '신용대출',
        은행명: 'KB국민은행',
        상품명: 'KB직장인대출',
        금융권_구분: '1금융권',
        balance: 65000000,
        monthlyPayment: 1245000,
        이자율_최저: 4.78,
        이자율_최고: 5.98,
        한도: '최대 3.5억원',
        대출_기간: '1년~5년',
      },
    ],
  },
  goal: {
    targetAmount: 10000000,
    targetPeriod: 24,
  },
};
