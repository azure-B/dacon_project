/** 회원가입 폼 — Supabase 연동 전 더미 데이터 구조 */

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

export function buildSignupPayload(form) {
  return {
    profile: {
      name: form.profile.name.trim(),
      email: form.profile.email.trim(),
    },
    financial: {
      monthlySalary: parseNumber(form.financial.monthlySalary),
      assets: form.financial.assets.filter(isAssetFilled).map((item) => {
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
      }),
      loans: form.financial.loans.filter(isLoanFilled).map((item) => ({
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
    loans: [
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
    targetMonths: 24,
  },
  meta: {
    submittedAt: '2026-09-02T09:00:00.000Z',
    source: 'signup-wizard',
  },
};
