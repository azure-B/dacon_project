import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Card, MaterialIcon } from '../../components/common';
import {
  GOAL_PERIOD_OPTIONS,
  INITIAL_SIGNUP_FORM,
  MANUAL_ASSET_TYPES,
  buildSignupPayload,
  createEmptyAsset,
  createEmptyLoan,
  applyProductToAsset,
  applyProductToLoan,
  setAssetManualMode,
} from '../../data/signupFormData';
import {
  PRODUCT_DISCLAIMER,
  formatProductOption,
  formatRateRange,
  getDepositProducts,
  getLoanProducts,
} from '../../data/productCatalog';
import './Signup.css';

const STEPS = [
  { id: 1, label: '기본정보' },
  { id: 2, label: '재무정보' },
  { id: 3, label: '목표설정' },
];

const SELECT_CLASS =
  'w-full h-[48px] px-md bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow disabled:opacity-50';

function StepIndicator({ currentStep }) {
  return (
    <ol className="signup-steps flex items-center justify-between gap-xs sm:gap-sm mb-lg">
      {STEPS.map((step, index) => {
        const isActive = currentStep === step.id;
        const isDone = currentStep > step.id;
        return (
          <li key={step.id} className="flex flex-1 items-center min-w-0">
            <div className="flex flex-col items-center gap-xs w-full min-w-0">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-label-sm font-label-md ${
                  isActive
                    ? 'bg-secondary text-on-secondary'
                    : isDone
                      ? 'bg-primary-container text-on-primary-container'
                      : 'bg-surface-variant text-on-surface-variant'
                }`}
              >
                {isDone ? <MaterialIcon name="check" className="text-[18px]" /> : step.id}
              </span>
              <span
                className={`text-label-sm font-label-sm truncate w-full text-center ${
                  isActive ? 'text-secondary font-bold' : 'text-on-surface-variant'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 ? (
              <span className="hidden sm:block h-px flex-1 bg-outline-variant mx-1 mb-5" aria-hidden="true" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function FieldLabel({ htmlFor, children }) {
  return (
    <label className="text-label-md font-label-md text-on-surface" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

const LOAN_PRODUCTS = getLoanProducts();
const DEPOSIT_PRODUCTS = getDepositProducts();

function ProductDisclaimer() {
  return (
    <div className="rounded-lg bg-surface-container-low border border-outline-variant p-md space-y-xs">
      <p className="text-label-sm font-label-sm text-on-surface-variant m-0 flex items-start gap-xs">
        <MaterialIcon name="info" className="text-[16px] shrink-0 mt-0.5" />
        {PRODUCT_DISCLAIMER.partialResults}
      </p>
      <p className="text-label-sm font-label-sm text-on-surface-variant m-0 pl-[22px]">
        {PRODUCT_DISCLAIMER.variableConditions}
      </p>
    </div>
  );
}

function LoanProductSummary({ loan }) {
  if (!loan.productId && loan.productId !== 0) return null;
  return (
    <div className="rounded-lg bg-surface-container-low p-sm text-body-sm font-body-sm text-on-surface-variant space-y-xs">
      <p className="m-0">
        <span className="text-on-surface font-medium">{loan.은행명}</span> · {loan.상품명}
      </p>
      <p className="m-0">
        {loan.금융권_구분} / {loan.상품_유형}
      </p>
      <p className="m-0">금리(참고): {loan.이자율_최저}% ~ {loan.이자율_최고}%</p>
      <p className="m-0">한도: {loan.한도 || '-'} · 기간: {loan.대출_기간 || '-'}</p>
    </div>
  );
}

function DepositProductSummary({ asset }) {
  if (asset.isManual || (asset.productId === '' && asset.productId !== 0)) return null;
  return (
    <div className="rounded-lg bg-surface-container-low p-sm text-body-sm font-body-sm text-on-surface-variant space-y-xs">
      <p className="m-0">
        <span className="text-on-surface font-medium">{asset.은행명}</span> · {asset.상품명}
      </p>
      <p className="m-0">
        {asset.금융권_구분} / {asset.상품_유형}
      </p>
      <p className="m-0">금리(참고): {formatRateRange(asset)}</p>
      <p className="m-0">
        만기: {asset.만기 || '-'} · 최소 금액: {asset.최소_금액 || '-'}
      </p>
    </div>
  );
}

export default function Signup() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_SIGNUP_FORM);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedPayload, setSubmittedPayload] = useState(null);

  const updateProfile = (field, value) => {
    setForm((prev) => ({
      ...prev,
      profile: { ...prev.profile, [field]: value },
    }));
  };

  const updateFinancial = (field, value) => {
    setForm((prev) => ({
      ...prev,
      financial: { ...prev.financial, [field]: value },
    }));
  };

  const updateGoal = (field, value) => {
    setForm((prev) => ({
      ...prev,
      goal: { ...prev.goal, [field]: value },
    }));
  };

  const updateAsset = (id, field, value) => {
    setForm((prev) => ({
      ...prev,
      financial: {
        ...prev.financial,
        assets: prev.financial.assets.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
      },
    }));
  };

  const addAsset = () => {
    setForm((prev) => ({
      ...prev,
      financial: {
        ...prev.financial,
        assets: [...prev.financial.assets, createEmptyAsset()],
      },
    }));
  };

  const removeAsset = (id) => {
    setForm((prev) => ({
      ...prev,
      financial: {
        ...prev.financial,
        assets:
          prev.financial.assets.length > 1
            ? prev.financial.assets.filter((item) => item.id !== id)
            : prev.financial.assets,
      },
    }));
  };

  const updateLoan = (id, field, value) => {
    setForm((prev) => ({
      ...prev,
      financial: {
        ...prev.financial,
        loans: prev.financial.loans.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
      },
    }));
  };

  const selectLoanProduct = (id, productId) => {
    setForm((prev) => ({
      ...prev,
      financial: {
        ...prev.financial,
        loans: prev.financial.loans.map((item) =>
          item.id === id ? applyProductToLoan(item, productId) : item
        ),
      },
    }));
  };

  const selectAssetProduct = (id, productId) => {
    setForm((prev) => ({
      ...prev,
      financial: {
        ...prev.financial,
        assets: prev.financial.assets.map((item) =>
          item.id === id ? applyProductToAsset(item, productId) : item
        ),
      },
    }));
  };

  const toggleAssetManual = (id, isManual) => {
    setForm((prev) => ({
      ...prev,
      financial: {
        ...prev.financial,
        assets: prev.financial.assets.map((item) =>
          item.id === id ? setAssetManualMode(item, isManual) : item
        ),
      },
    }));
  };

  const addLoan = () => {
    setForm((prev) => ({
      ...prev,
      financial: {
        ...prev.financial,
        loans: [...prev.financial.loans, createEmptyLoan()],
      },
    }));
  };

  const removeLoan = (id) => {
    setForm((prev) => ({
      ...prev,
      financial: {
        ...prev.financial,
        loans:
          prev.financial.loans.length > 1 ? prev.financial.loans.filter((item) => item.id !== id) : prev.financial.loans,
      },
    }));
  };

  const validateStep1 = () => {
    const { name, email, password, passwordConfirm, termsAccepted } = form.profile;
    if (!name.trim()) return '이름을 입력해주세요.';
    if (!email.trim()) return '이메일을 입력해주세요.';
    if (!password) return '비밀번호를 입력해주세요.';
    if (password !== passwordConfirm) return '비밀번호가 일치하지 않습니다.';
    if (!termsAccepted) return '서비스 이용약관에 동의해주세요.';
    return '';
  };

  const validateStep2 = () => {
    const salary = Number(form.financial.monthlySalary);
    if (!form.financial.monthlySalary || !Number.isFinite(salary) || salary <= 0) {
      return '월급을 올바르게 입력해주세요.';
    }

    for (const loan of form.financial.loans) {
      if (loan.balance !== '' || loan.monthlyPayment !== '') {
        if (loan.productId === '' && loan.productId !== 0) {
          return '대출 상품을 선택해주세요.';
        }
      }
    }

    for (const asset of form.financial.assets) {
      if (asset.amount !== '') {
        if (asset.isManual) {
          if (!asset.manualName.trim()) return '수동 입력 자산의 이름을 입력해주세요.';
        } else if (asset.productId === '' && asset.productId !== 0) {
          return '예·적금 자산 상품을 선택해주세요.';
        }
      }
    }

    return '';
  };

  const validateStep3 = () => {
    const amount = Number(form.goal.targetAmount);
    if (!form.goal.targetAmount || !Number.isFinite(amount) || amount <= 0) {
      return '목표 금액을 올바르게 입력해주세요.';
    }
    if (!form.goal.targetMonths) return '목표 기간을 선택해주세요.';
    return '';
  };

  const goNext = () => {
    setErrorMessage('');
    if (step === 1) {
      const error = validateStep1();
      if (error) {
        setErrorMessage(error);
        return;
      }
    }
    if (step === 2) {
      const error = validateStep2();
      if (error) {
        setErrorMessage(error);
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const goBack = () => {
    setErrorMessage('');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrorMessage('');

    const error = validateStep3();
    if (error) {
      setErrorMessage(error);
      return;
    }

    const payload = buildSignupPayload(form);
    setSubmittedPayload(payload);
    console.log('[Signup] 임시 저장 payload:', payload);
  };

  if (submittedPayload) {
    return (
      <div className="bg-surface-container-lowest text-on-surface min-h-screen flex items-center justify-center p-3 sm:p-margin-mobile md:p-margin-desktop page-shell">
        <main className="w-full max-w-[480px] min-w-0">
          <Card className="p-md sm:p-lg md:p-xl text-center">
            <div className="w-12 h-12 mx-auto mb-md bg-tertiary-fixed-dim/20 text-on-tertiary-container rounded-full flex items-center justify-center">
              <MaterialIcon name="check_circle" className="text-[28px]" />
            </div>
            <h1 className="text-headline-md font-headline-md text-primary mb-sm">입력이 완료되었습니다</h1>
            <p className="text-body-sm font-body-sm text-on-surface-variant mb-lg break-keep">
              재무 정보가 임시로 저장되었습니다. (Supabase 연동 전 — 콘솔에서 payload 확인 가능)
            </p>
            <div className="text-left bg-surface-container-low rounded-lg p-md mb-lg overflow-x-auto">
              <p className="text-label-sm font-label-sm text-on-surface-variant mb-xs">저장된 데이터 요약</p>
              <ul className="text-body-sm font-body-sm text-on-surface space-y-xs m-0 pl-md">
                <li>이름: {submittedPayload.profile.name}</li>
                <li>월급: ₩{submittedPayload.financial.monthlySalary?.toLocaleString()}</li>
                <li>자산: {submittedPayload.financial.assets.length}건</li>
                <li>대출: {submittedPayload.financial.loans.length}건</li>
                <li>
                  목표: ₩{submittedPayload.goal.targetAmount?.toLocaleString()} /{' '}
                  {submittedPayload.goal.targetMonths}개월
                </li>
              </ul>
            </div>
            <Link to="/login">
              <Button variant="secondary" fullWidth className="h-[48px]">
                로그인 화면으로
              </Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest text-on-surface min-h-screen flex items-center justify-center p-3 sm:p-margin-mobile md:p-margin-desktop page-shell">
      <main className="w-full max-w-[560px] min-w-0">
        <Card className="p-md sm:p-lg md:p-xl">
          <div className="text-center mb-md">
            <h1 className="text-headline-lg font-headline-lg text-primary mb-sm font-inter">AI 재무 인터렉티브</h1>
            <p className="text-body-md font-body-md text-on-surface-variant break-keep">
              계정을 생성하고 재무 정보를 입력하면 맞춤형 분석을 시작할 수 있습니다.
            </p>
          </div>

          <StepIndicator currentStep={step} />

          {errorMessage ? (
            <p
              className="text-body-sm font-body-sm text-error mb-md px-sm py-xs bg-error-container rounded-lg border border-error/20"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <form className="space-y-md" onSubmit={handleSubmit}>
            {step === 1 ? (
              <div className="space-y-gutter">
                <Input
                  id="signup-name"
                  name="name"
                  label="이름"
                  placeholder="홍길동"
                  icon="person"
                  required
                  value={form.profile.name}
                  onChange={(e) => updateProfile('name', e.target.value)}
                />
                <Input
                  id="signup-email"
                  name="email"
                  label="이메일 주소"
                  type="email"
                  placeholder="이메일@회사.com"
                  icon="mail"
                  required
                  value={form.profile.email}
                  onChange={(e) => updateProfile('email', e.target.value)}
                />
                <Input
                  id="signup-password"
                  name="password"
                  label="비밀번호 설정"
                  type="password"
                  placeholder="••••••••"
                  icon="lock"
                  required
                  hint="최소 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다."
                  value={form.profile.password}
                  onChange={(e) => updateProfile('password', e.target.value)}
                />
                <Input
                  id="signup-password-confirm"
                  name="password_confirm"
                  label="비밀번호 확인"
                  type="password"
                  placeholder="••••••••"
                  icon="lock_reset"
                  required
                  value={form.profile.passwordConfirm}
                  onChange={(e) => updateProfile('passwordConfirm', e.target.value)}
                />
                <div className="flex items-start gap-sm">
                  <div className="flex items-center shrink-0 min-h-[44px]">
                    <input
                      className="h-5 w-5 text-primary focus:ring-primary border-outline-variant rounded bg-surface-container-lowest cursor-pointer"
                      id="terms"
                      name="terms"
                      required
                      type="checkbox"
                      checked={form.profile.termsAccepted}
                      onChange={(e) => updateProfile('termsAccepted', e.target.checked)}
                    />
                  </div>
                  <div className="text-body-sm font-body-sm min-w-0">
                    <label className="text-on-surface-variant cursor-pointer break-keep" htmlFor="terms">
                      <a className="text-secondary hover:underline font-medium" href="#">
                        서비스 이용약관
                      </a>{' '}
                      및{' '}
                      <a className="text-secondary hover:underline font-medium" href="#">
                        개인정보 처리방침
                      </a>
                      에 동의합니다.
                    </label>
                  </div>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-lg">
                <ProductDisclaimer />

                <Input
                  id="signup-salary"
                  name="monthlySalary"
                  label="월급 (세후)"
                  type="number"
                  min="0"
                  placeholder="4200000"
                  icon="payments"
                  required
                  hint="원 단위로 입력해주세요."
                  value={form.financial.monthlySalary}
                  onChange={(e) => updateFinancial('monthlySalary', e.target.value)}
                />

                <section>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm mb-md">
                    <h2 className="text-headline-sm font-headline-sm text-primary m-0">자산 목록</h2>
                    <Button type="button" variant="outline" className="h-[44px] px-md shrink-0" onClick={addAsset}>
                      <MaterialIcon name="add" className="text-[18px]" />
                      자산 추가
                    </Button>
                  </div>
                  <div className="space-y-md">
                    {form.financial.assets.map((asset, index) => (
                      <div
                        key={asset.id}
                        className="rounded-lg border border-outline-variant bg-surface-container-lowest p-md space-y-sm"
                      >
                        <div className="flex items-center justify-between gap-sm">
                          <span className="text-label-md font-label-md text-on-surface-variant">자산 {index + 1}</span>
                          {form.financial.assets.length > 1 ? (
                            <button
                              type="button"
                              className="text-label-sm font-label-sm text-error min-h-[44px] px-sm"
                              onClick={() => removeAsset(asset.id)}
                            >
                              삭제
                            </button>
                          ) : null}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-sm">
                          <button
                            type="button"
                            className={`flex-1 min-h-[44px] rounded-lg text-label-sm font-label-md border ${
                              !asset.isManual
                                ? 'bg-secondary-container text-on-secondary-container border-secondary'
                                : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant'
                            }`}
                            onClick={() => toggleAssetManual(asset.id, false)}
                          >
                            금융상품 선택
                          </button>
                          <button
                            type="button"
                            className={`flex-1 min-h-[44px] rounded-lg text-label-sm font-label-md border ${
                              asset.isManual
                                ? 'bg-secondary-container text-on-secondary-container border-secondary'
                                : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant'
                            }`}
                            onClick={() => toggleAssetManual(asset.id, true)}
                          >
                            직접 입력
                          </button>
                        </div>

                        {asset.isManual ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                            <div className="flex flex-col gap-xs">
                              <FieldLabel htmlFor={`asset-manual-type-${asset.id}`}>유형</FieldLabel>
                              <select
                                id={`asset-manual-type-${asset.id}`}
                                className={SELECT_CLASS}
                                value={asset.manualType}
                                onChange={(e) => updateAsset(asset.id, 'manualType', e.target.value)}
                              >
                                {MANUAL_ASSET_TYPES.map((type) => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <Input
                              id={`asset-manual-name-${asset.id}`}
                              label="자산명"
                              placeholder="비상금 통장"
                              value={asset.manualName}
                              onChange={(e) => updateAsset(asset.id, 'manualName', e.target.value)}
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-col gap-xs">
                              <FieldLabel htmlFor={`asset-product-${asset.id}`}>예·적금 상품 선택</FieldLabel>
                              <select
                                id={`asset-product-${asset.id}`}
                                className={SELECT_CLASS}
                                value={asset.productId === '' ? '' : String(asset.productId)}
                                onChange={(e) => selectAssetProduct(asset.id, e.target.value)}
                              >
                                <option value="">상품을 선택하세요</option>
                                {DEPOSIT_PRODUCTS.map((product) => (
                                  <option key={product.id} value={product.id}>
                                    {formatProductOption(product)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <DepositProductSummary asset={asset} />
                          </>
                        )}

                        <Input
                          id={`asset-amount-${asset.id}`}
                          label="보유 금액 (원)"
                          type="number"
                          min="0"
                          placeholder="1000000"
                          icon="account_balance_wallet"
                          value={asset.amount}
                          onChange={(e) => updateAsset(asset.id, 'amount', e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm mb-md">
                    <h2 className="text-headline-sm font-headline-sm text-primary m-0">보유 대출</h2>
                    <Button type="button" variant="outline" className="h-[44px] px-md shrink-0" onClick={addLoan}>
                      <MaterialIcon name="add" className="text-[18px]" />
                      대출 추가
                    </Button>
                  </div>
                  <div className="space-y-md">
                    {form.financial.loans.map((loan, index) => (
                      <div
                        key={loan.id}
                        className="rounded-lg border border-outline-variant bg-surface-container-lowest p-md space-y-sm"
                      >
                        <div className="flex items-center justify-between gap-sm">
                          <span className="text-label-md font-label-md text-on-surface-variant">대출 {index + 1}</span>
                          {form.financial.loans.length > 1 ? (
                            <button
                              type="button"
                              className="text-label-sm font-label-sm text-error min-h-[44px] px-sm"
                              onClick={() => removeLoan(loan.id)}
                            >
                              삭제
                            </button>
                          ) : null}
                        </div>

                        <div className="flex flex-col gap-xs">
                          <FieldLabel htmlFor={`loan-product-${loan.id}`}>대출 상품 선택</FieldLabel>
                          <select
                            id={`loan-product-${loan.id}`}
                            className={SELECT_CLASS}
                            value={loan.productId === '' ? '' : String(loan.productId)}
                            onChange={(e) => selectLoanProduct(loan.id, e.target.value)}
                          >
                            <option value="">상품을 선택하세요</option>
                            {LOAN_PRODUCTS.map((product) => (
                              <option key={product.id} value={product.id}>
                                {formatProductOption(product)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <LoanProductSummary loan={loan} />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                          <Input
                            id={`loan-balance-${loan.id}`}
                            label="대출 잔액 (원)"
                            type="number"
                            min="0"
                            placeholder="65000000"
                            value={loan.balance}
                            onChange={(e) => updateLoan(loan.id, 'balance', e.target.value)}
                          />
                          <Input
                            id={`loan-monthly-${loan.id}`}
                            label="월 상환액 (원)"
                            type="number"
                            min="0"
                            placeholder="1245000"
                            value={loan.monthlyPayment}
                            onChange={(e) => updateLoan(loan.id, 'monthlyPayment', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-gutter">
                <Input
                  id="signup-goal-amount"
                  name="targetAmount"
                  label="목표 금액 (원)"
                  type="number"
                  min="0"
                  placeholder="10000000"
                  icon="savings"
                  required
                  hint="모으고 싶은 목표 금액을 입력해주세요."
                  value={form.goal.targetAmount}
                  onChange={(e) => updateGoal('targetAmount', e.target.value)}
                />
                <div className="flex flex-col gap-xs">
                  <FieldLabel htmlFor="signup-goal-period">목표 기간</FieldLabel>
                  <select
                    id="signup-goal-period"
                    className={SELECT_CLASS}
                    value={form.goal.targetMonths}
                    onChange={(e) => updateGoal('targetMonths', Number(e.target.value))}
                    required
                  >
                    {GOAL_PERIOD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-label-sm font-label-sm text-on-surface-variant">
                    목표 금액을 모으고 싶은 기간을 선택해주세요.
                  </p>
                </div>
                <div className="rounded-lg bg-surface-container-low border border-outline-variant p-md">
                  <p className="text-label-md font-label-md text-primary mb-xs">입력 요약</p>
                  <ul className="text-body-sm font-body-sm text-on-surface-variant space-y-xs m-0 pl-md">
                    <li>월급: {form.financial.monthlySalary ? `₩${Number(form.financial.monthlySalary).toLocaleString()}` : '-'}</li>
                    <li>자산: {form.financial.assets.filter((a) => a.amount || a.productId !== '' || a.manualName).length}건</li>
                    <li>대출: {form.financial.loans.filter((l) => l.balance || l.productId !== '').length}건</li>
                  </ul>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col-reverse sm:flex-row gap-sm pt-md">
              {step > 1 ? (
                <Button type="button" variant="outline" fullWidth className="h-[48px]" onClick={goBack}>
                  이전
                </Button>
              ) : null}
              {step < 3 ? (
                <Button type="button" variant="secondary" fullWidth className="h-[48px]" onClick={goNext}>
                  다음
                </Button>
              ) : (
                <Button type="submit" variant="secondary" fullWidth className="h-[48px]">
                  회원가입 완료
                </Button>
              )}
            </div>
          </form>

          <div className="mt-lg text-center">
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              이미 계정이 있으신가요?{' '}
              <Link className="text-secondary font-medium hover:underline" to="/login">
                로그인
              </Link>
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
