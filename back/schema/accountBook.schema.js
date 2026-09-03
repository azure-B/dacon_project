const TRANSACTION_TYPES = Object.freeze(["income", "expense"]);

const CATEGORIES = Object.freeze({
  income: Object.freeze(["수입", "급여", "용돈", "투자수익", "환급", "기타수입"]),
  expense: Object.freeze([
    "식비",
    "교통",
    "주거",
    "쇼핑",
    "구독",
    "카페",
    "통신",
    "의료",
    "기타",
  ]),
});

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_MEMO_LENGTH = 200;
const MAX_CATEGORY_LENGTH = 30;

module.exports = {
  TRANSACTION_TYPES,
  CATEGORIES,
  DATE_RE,
  MAX_MEMO_LENGTH,
  MAX_CATEGORY_LENGTH,
};
