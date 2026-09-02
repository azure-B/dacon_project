/**
 * 금융 상품 카탈로그 — python/api/product.json 기반 (API 구현 전 프론트 더미)
 * @see md/API/product-data.md
 */

import productData from '../../../python/api/product.json';

export const LOAN_PRODUCT_TYPES = [
  '신용대출',
  '사업자신용대출',
  '주택담보대출',
  '전세자금대출',
  '자동차담보대출',
  '마이너스대출',
  '연금담보대출',
  '학자금대출',
  '보증부대출',
];

export const DEPOSIT_PRODUCT_TYPES = ['정기예금', '정기적금', '자유적금', '주택청약적금', '파킹통장'];

export const PRODUCT_DISCLAIMER = {
  partialResults: '일부 상품만 검색된 결과이며, 전체 시장을 대표하지 않습니다.',
  variableConditions:
    '대출 상품은 신용점수·소득 등 개인 상황에 따라 금리·한도·승인 여부가 달라질 수 있습니다.',
  confirmBeforeApply: '가입·대출 전 금융사 공식 채널에서 최신 조건을 확인하세요.',
};

const productsWithId = productData.products.map((product, index) => ({
  id: index,
  ...product,
}));

const loanProducts = productsWithId.filter((p) => LOAN_PRODUCT_TYPES.includes(p.상품_유형));
const depositProducts = productsWithId.filter((p) => DEPOSIT_PRODUCT_TYPES.includes(p.상품_유형));

export function getLoanProducts() {
  return loanProducts;
}

export function getDepositProducts() {
  return depositProducts;
}

export function getProductById(id) {
  if (id === '' || id === null || id === undefined) return null;
  const numId = Number(id);
  if (!Number.isFinite(numId) || numId < 0 || numId >= productsWithId.length) return null;
  return productsWithId[numId];
}

export function formatProductOption(product) {
  return `${product.은행명} — ${product.상품명} (${product.상품_유형})`;
}

export function formatRateRange(product) {
  if (product.이자율_최저 == null || product.이자율_최고 == null) return '-';
  return `${product.이자율_최저}% ~ ${product.이자율_최고}%`;
}

export const catalogMetadata = productData.metadata;
