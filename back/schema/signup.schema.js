const LOGIN_ID_RE = /^[A-Za-z0-9_]{4,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_LETTER_RE = /[A-Za-z]/;
const PASSWORD_DIGIT_RE = /\d/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 64;

const MAX_LIST_LENGTH = 100;
const MAX_NAME_LENGTH = 30;

const EMPTY_FINANCE = Object.freeze({
  monthlyIncome: null,
  targetAmount: null,
  targetPeriod: null,
  assetList: Object.freeze([]),
  loanList: Object.freeze([]),
  productIds: Object.freeze([]),
});

module.exports = {
  LOGIN_ID_RE,
  EMAIL_RE,
  PASSWORD_LETTER_RE,
  PASSWORD_DIGIT_RE,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  MAX_LIST_LENGTH,
  MAX_NAME_LENGTH,
  EMPTY_FINANCE,
};
