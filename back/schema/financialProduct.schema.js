const CATEGORY = Object.freeze({
  LOAN: "대출",
  DEPOSIT: "예적금",
});

const LOAN_PRODUCT_TYPES = Object.freeze([
  "신용대출",
  "사업자신용대출",
  "주택담보대출",
  "전세자금대출",
  "자동차담보대출",
  "마이너스대출",
  "연금담보대출",
  "학자금대출",
  "보증부대출",
]);

const DEPOSIT_PRODUCT_TYPES = Object.freeze([
  "정기예금",
  "정기적금",
  "자유적금",
  "주택청약적금",
  "파킹통장",
]);

function isLoanProductType(productType) {
  return LOAN_PRODUCT_TYPES.includes(productType);
}

function resolveCategory(productType) {
  return isLoanProductType(productType) ? CATEGORY.LOAN : CATEGORY.DEPOSIT;
}

module.exports = {
  CATEGORY,
  LOAN_PRODUCT_TYPES,
  DEPOSIT_PRODUCT_TYPES,
  isLoanProductType,
  resolveCategory,
};
