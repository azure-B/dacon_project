import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Card, MaterialIcon, ProgressBar } from '../../components/common';
import { AuthShell } from '../../components/layout';
import {
  GOAL_PERIOD_OPTIONS,
  INITIAL_SIGNUP_FORM,
  MANUAL_ASSET_TYPES,
  MAX_NAME_LENGTH,
  buildSignupPayload,
  createEmptyAsset,
  createEmptyLoan,
  applyProductToAsset,
  applyProductToLoan,
  isValidEmail,
  isValidLoginId,
  isValidPassword,
  setAssetManualMode,
} from '../../data/signupFormData';
import {
  PRODUCT_DISCLAIMER,
  formatProductOption,
  formatRateRange,
  getDepositProducts,
  getLoanProducts,
} from '../../data/productCatalog';
import { api } from '../../services/api';
import './Signup.css';

const SIGNUP_ERROR_MESSAGES = {
  'loginId is required': '아이디를 입력해주세요.',
  'password is required': '비밀번호를 입력해주세요.',
  'email is required': '이메일을 입력해주세요.',
  'name is required': '이름을 입력해주세요.',
  'invalid loginId': '아이디는 영문·숫자·밑줄(_)만 사용하며 4~20자여야 합니다.',
  'invalid password': '비밀번호는 8~64자이며 영문과 숫자를 모두 포함해야 합니다.',
  'invalid email': '올바른 이메일 형식이 아닙니다.',
  'invalid name': '이름은 30자 이내로 입력해주세요.',
  'invalid monthlyIncome': '월급을 올바르게 입력해주세요.',
  'invalid targetAmount': '목표 금액을 올바르게 입력해주세요.',
  'invalid targetPeriod': '목표 기간을 올바르게 선택해주세요.',
  'invalid assetList': '자산 목록 형식이 올바르지 않습니다.',
  'invalid loanList': '대출 목록 형식이 올바르지 않습니다.',
  'loginId already exists': '이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요.',
  'email already exists': '이미 가입된 이메일입니다. 다른 이메일을 사용하거나 로그인해 주세요.',
};

function getSignupErrorMessage(error) {
  const message = error?.message || '';
  return SIGNUP_ERROR_MESSAGES[message] || '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.';
}

const STEPS = [
  {
    id: 1,
    label: '기본정보',
    title: '계정 프로필 설정',
    desc: '안전한 데이터 암호화 터널 개통 및 기본 보안 크레덴셜 생성',
  },
  {
    id: 2,
    label: '재무정보',
    title: '자산·부채 연동',
    desc: '월급·예적금·대출을 입력해 현금 흐름 기준선을 만듭니다',
  },
  {
    id: 3,
    label: '목표설정',
    title: '맞춤형 목표 로드맵',
    desc: '목표 금액과 기간으로 순자산 궤적 시나리오를 준비합니다',
  },
];

const STEP_FORM_TITLES = {
  1: '기본 계정 정보 입력',
  2: '재무 정보 입력',
  3: '목표 설정',
};

const SELECT_CLASS =
  'w-full h-[48px] px-md bg-surface-charcoal border border-border-subtle rounded-DEFAULT text-body-md font-body-md text-editorial-sage-light focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-50';

function StepIndicator({ currentStep }) {
  const progressPct = Math.round((currentStep / STEPS.length) * 100);

  return (
    <div className="signup-quest flex flex-col gap-space-md">
      <div className="flex items-center gap-space-sm flex-wrap">
        <span className="inline-flex items-center gap-2 px-space-md py-1.5 rounded-full bg-surface-architectural text-primary font-label-caps tracking-widest">
          <span className="w-2 h-2 rounded-full bg-primary" />
          ONBOARDING QUEST · STEP {String(currentStep).padStart(2, '0')}
        </span>
        <span className="font-label-numeric text-outline tracking-wider text-body-sm">
          [{String(currentStep).padStart(2, '0')}/{String(STEPS.length).padStart(2, '0')}]
        </span>
      </div>

      <ol className="flex flex-col gap-space-md m-0 p-0 list-none">
        {STEPS.map((step) => {
          const isActive = currentStep === step.id;
          const isDone = currentStep > step.id;
          return (
            <li
              key={step.id}
              className={`flex items-start gap-space-md p-space-md rounded-DEFAULT transition-all ${
                isActive
                  ? 'bg-surface-architectural border border-border-hairline shadow-md'
                  : 'bg-surface-charcoal/50 opacity-60 border border-transparent'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-headline-sm font-semibold flex-shrink-0 ${
                  isActive
                    ? 'bg-primary text-on-primary'
                    : isDone
                      ? 'bg-primary-container text-on-primary-container'
                      : 'bg-surface-container-high text-outline'
                }`}
              >
                {isDone ? <MaterialIcon name="check" className="text-[18px]" /> : String(step.id).padStart(2, '0')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-space-sm">
                  <span
                    className={`truncate ${
                      isActive
                        ? 'font-headline-sm text-editorial-sage-light font-semibold'
                        : 'font-body-md font-medium text-editorial-sage-muted'
                    }`}
                  >
                    {step.title}
                  </span>
                  {isActive ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-signal-positive-subtle text-primary font-label-caps font-semibold whitespace-nowrap">
                      {progressPct}% 진행 중
                    </span>
                  ) : isDone ? (
                    <span className="font-label-caps text-primary">완료</span>
                  ) : (
                    <span className="font-label-caps text-outline">대기</span>
                  )}
                </div>
                <p className={`font-body-sm mt-1 m-0 leading-normal break-keep ${isActive ? 'text-on-surface-variant' : 'text-outline'}`}>
                  {step.desc}
                </p>
                {isActive ? (
                  <div className="mt-space-md">
                    <ProgressBar value={progressPct} heightClass="h-1.5" barClassName="bg-primary" />
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function FieldLabel({ htmlFor, children }) {
  return (
    <label className="font-label-caps text-label-caps text-on-surface-variant tracking-wider" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

const LOAN_PRODUCTS = getLoanProducts();
const DEPOSIT_PRODUCTS = getDepositProducts();

function ProductDisclaimer() {
  return (
    <div className="rounded-DEFAULT bg-surface-container-lowest border border-border-hairline p-md space-y-xs">
      <p className="text-label-sm font-label-sm text-on-surface-variant m-0 flex items-start gap-xs">
        <MaterialIcon name="info" className="text-[16px] shrink-0 mt-0.5 text-primary" />
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
    <div className="rounded-DEFAULT bg-surface-charcoal border border-border-subtle p-sm text-body-sm font-body-sm text-on-surface-variant space-y-xs">
      <p className="m-0">
        <span className="text-editorial-sage-light font-medium">{loan.은행명}</span> · {loan.상품명}
      </p>
      <p className="m-0">
        {loan.금융권_구분} / {loan.상품_유형}
      </p>
      <p className="m-0">
        금리(참고): {loan.이자율_최저}% ~ {loan.이자율_최고}%
      </p>
      <p className="m-0">
        한도: {loan.한도 || '-'} · 기간: {loan.대출_기간 || '-'}
      </p>
    </div>
  );
}

function DepositProductSummary({ asset }) {
  if (asset.isManual || (asset.productId === '' && asset.productId !== 0)) return null;
  return (
    <div className="rounded-DEFAULT bg-surface-charcoal border border-border-subtle p-sm text-body-sm font-body-sm text-on-surface-variant space-y-xs">
      <p className="m-0">
        <span className="text-editorial-sage-light font-medium">{asset.은행명}</span> · {asset.상품명}
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const [panelKey, setPanelKey] = useState(1);

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
    const { loginId, name, email, password, passwordConfirm, termsAccepted } = form.profile;
    if (!loginId.trim()) return '아이디를 입력해주세요.';
    if (!isValidLoginId(loginId)) {
      return '아이디는 영문·숫자·밑줄(_)만 사용하며 4~20자여야 합니다.';
    }
    if (!name.trim()) return '이름을 입력해주세요.';
    if (name.trim().length > MAX_NAME_LENGTH) return '이름은 30자 이내로 입력해주세요.';
    if (!email.trim()) return '이메일을 입력해주세요.';
    if (!isValidEmail(email)) return '올바른 이메일 형식이 아닙니다.';
    if (!password) return '비밀번호를 입력해주세요.';
    if (!isValidPassword(password)) {
      return '비밀번호는 8~64자이며 영문과 숫자를 모두 포함해야 합니다.';
    }
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
      const hasLoan =
        (loan.productId !== '' && loan.productId != null) ||
        loan.balance !== '' ||
        loan.monthlyPayment !== '';

      if (!hasLoan) continue;

      if (loan.productId === '' && loan.productId !== 0) {
        return '대출 상품을 선택해주세요.';
      }

      const balance = Number(loan.balance);
      if (loan.balance === '' || !Number.isFinite(balance) || balance <= 0) {
        return '대출 잔액을 0보다 큰 금액으로 입력해주세요.';
      }

      const monthlyPayment = Number(loan.monthlyPayment);
      if (
        loan.monthlyPayment === '' ||
        !Number.isFinite(monthlyPayment) ||
        monthlyPayment <= 0
      ) {
        return '월 상환액을 0보다 큰 금액으로 입력해주세요.';
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
    setPanelKey((k) => k + 1);
  };

  const goBack = () => {
    setErrorMessage('');
    setStep((prev) => Math.max(prev - 1, 1));
    setPanelKey((k) => k + 1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    const error = validateStep3();
    if (error) {
      setErrorMessage(error);
      return;
    }

    const payload = buildSignupPayload(form);
    setIsSubmitting(true);

    try {
      const data = await api.signup(payload);
      setSubmittedResult({
        user: data.user,
        payload,
      });
    } catch (submitError) {
      setErrorMessage(getSignupErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedResult) {
    const { user, payload } = submittedResult;
    return (
      <AuthShell badge="REGISTRATION COMPLETE">
        <div className="w-full max-w-[520px] mx-auto section-reveal">
          <Card variant="architectural" className="p-md sm:p-lg md:p-xl text-center">
            <div className="w-12 h-12 mx-auto mb-md bg-signal-positive-subtle text-primary rounded-full flex items-center justify-center border border-border-hairline">
              <MaterialIcon name="check_circle" className="text-[28px]" />
            </div>
            <h1 className="font-headline-md text-headline-md text-editorial-sage-light mb-sm m-0">
              회원가입이 완료되었습니다
            </h1>
            <p className="text-body-sm font-body-sm text-on-surface-variant mb-lg break-keep m-0">
              계정이 생성되었습니다. 로그인한 뒤 맞춤형 재무 분석을 이용할 수 있습니다.
            </p>
            <div className="text-left bg-surface-charcoal rounded-DEFAULT border border-border-hairline p-md mb-lg overflow-x-auto">
              <p className="font-label-caps text-label-caps text-outline mb-xs m-0">가입 정보 요약</p>
              <ul className="text-body-sm font-body-sm text-editorial-sage-light space-y-xs m-0 pl-md">
                <li>아이디: {user?.loginId || payload.profile.loginId}</li>
                <li>이름: {user?.name || payload.profile.name}</li>
                <li>월급: ₩{payload.financial.monthlyIncome?.toLocaleString()}</li>
                <li>자산: {payload.financial.assetList.length}건</li>
                <li>대출: {payload.financial.loanList.length}건</li>
                <li>
                  목표: ₩{payload.goal.targetAmount?.toLocaleString()} / {payload.goal.targetPeriod}개월
                </li>
              </ul>
            </div>
            <Link to="/login">
              <Button variant="extruded" fullWidth className="h-[48px]">
                로그인 화면으로
                <MaterialIcon name="arrow_forward" className="text-[18px]" />
              </Button>
            </Link>
          </Card>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell badge="ONBOARDING QUEST">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-space-lg lg:gap-space-2xl items-stretch">
        {/* Left: quest manifesto */}
        <div className="lg:col-span-5 xl:col-span-6 flex flex-col justify-between p-space-xl lg:p-space-2xl rounded-xl bg-surface-container-lowest shadow-2xl relative overflow-hidden section-reveal">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-signal-positive-subtle blur-3xl pointer-events-none opacity-70" />
          <div className="relative z-10 flex flex-col">
            <h1 className="font-headline-lg text-headline-lg text-editorial-sage-light tracking-tight max-w-xl leading-tight m-0 break-keep">
              재무 주권의 시작.
              <br />
              <span className="text-primary font-display">스마트한 AI 핀테크 여정.</span>
            </h1>
            <p className="mt-space-md font-body-md text-editorial-sage-muted max-w-lg leading-relaxed m-0 break-keep">
              단순한 가계부를 넘어섭니다. 자율형 AI 재무 분석 모델이 당신의 순자산 궤적을 실시간으로 추적하고
              최적화합니다.
            </p>
            <div className="mt-space-2xl">
              <StepIndicator currentStep={step} />
            </div>
          </div>
          <div className="relative z-10 mt-space-2xl pt-space-md flex flex-wrap items-center justify-between gap-space-md text-body-sm text-outline">
            <div className="flex items-center gap-2">
              <MaterialIcon name="verified_user" className="text-primary text-[18px]" />
              <span className="font-label-caps text-editorial-sage-muted">암호화 세션 규격 준수</span>
            </div>
            <div className="flex items-center gap-2">
              <MaterialIcon name="database" className="text-primary text-[18px]" />
              <span className="font-label-caps text-editorial-sage-muted">마이데이터 연동 준비</span>
            </div>
          </div>
        </div>

        {/* Right: form card */}
        <Card
          variant="architectural"
          className="lg:col-span-7 xl:col-span-6 flex flex-col justify-between p-space-xl lg:p-space-2xl section-reveal section-reveal-delay-1"
        >
          <div>
            <div className="flex items-center justify-between pb-space-lg mb-space-lg border-b border-border-subtle gap-md flex-wrap">
              <div className="flex items-center gap-space-md min-w-0">
                <div className="w-9 h-9 rounded-full bg-surface-charcoal border border-border-hairline flex items-center justify-center shrink-0">
                  <MaterialIcon name="finance_mode" className="text-primary text-[20px]" />
                </div>
                <div className="min-w-0">
                  <p className="font-label-caps text-primary tracking-wider m-0">REGISTRATION PROTOCOL</p>
                  <h2 className="font-headline-sm text-editorial-sage-light font-semibold m-0 truncate">
                    {STEP_FORM_TITLES[step]}
                  </h2>
                </div>
              </div>
              <span className="px-space-md py-1 rounded-full bg-surface-charcoal font-label-numeric text-signal-advisory text-body-sm shrink-0">
                STEP {step}/3
              </span>
            </div>

            {errorMessage ? (
              <p
                className="text-body-sm font-body-sm text-signal-risk mb-md px-sm py-xs bg-signal-risk-subtle rounded-DEFAULT border border-signal-risk/20 break-keep"
                role="alert"
              >
                {errorMessage}
              </p>
            ) : null}

            <form className="space-y-md" onSubmit={handleSubmit}>
              <div key={panelKey} className="signup-step-panel">
                {step === 1 ? (
                  <div className="space-y-gutter">
                    <Input
                      id="signup-login-id"
                      name="loginId"
                      label="아이디"
                      placeholder="user01"
                      icon="badge"
                      required
                      hint="영문·숫자·밑줄(_) 4~20자"
                      value={form.profile.loginId}
                      onChange={(e) => updateProfile('loginId', e.target.value)}
                      disabled={isSubmitting}
                    />
                    <Input
                      id="signup-name"
                      name="name"
                      label="이름"
                      placeholder="홍길동"
                      icon="person"
                      required
                      value={form.profile.name}
                      onChange={(e) => updateProfile('name', e.target.value)}
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                      <Input
                        id="signup-password"
                        name="password"
                        label="비밀번호 설정"
                        type="password"
                        passwordToggle
                        placeholder="••••••••"
                        icon="lock"
                        required
                        hint="8~64자, 영문과 숫자를 포함해야 합니다."
                        value={form.profile.password}
                        onChange={(e) => updateProfile('password', e.target.value)}
                        disabled={isSubmitting}
                      />
                      <Input
                        id="signup-password-confirm"
                        name="password_confirm"
                        label="비밀번호 확인"
                        type="password"
                        passwordToggle
                        placeholder="••••••••"
                        icon="lock_reset"
                        required
                        value={form.profile.passwordConfirm}
                        onChange={(e) => updateProfile('passwordConfirm', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="p-space-md rounded-DEFAULT bg-surface-charcoal flex items-start gap-sm">
                      <div className="flex items-center shrink-0 min-h-[44px]">
                        <input
                          className="h-5 w-5 accent-primary rounded bg-surface-architectural cursor-pointer"
                          id="terms"
                          name="terms"
                          required
                          type="checkbox"
                          checked={form.profile.termsAccepted}
                          onChange={(e) => updateProfile('termsAccepted', e.target.checked)}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="text-body-sm font-body-sm min-w-0 pt-2">
                        <label className="text-editorial-sage-muted cursor-pointer break-keep" htmlFor="terms">
                          <a className="text-primary hover:underline font-medium" href="#">
                            서비스 이용약관
                          </a>{' '}
                          및{' '}
                          <a className="text-primary hover:underline font-medium" href="#">
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
                        <h2 className="font-headline-sm text-headline-sm text-editorial-sage-light m-0">자산 목록</h2>
                        <Button type="button" variant="outline" className="h-[44px] px-md shrink-0" onClick={addAsset}>
                          <MaterialIcon name="add" className="text-[18px]" />
                          자산 추가
                        </Button>
                      </div>
                      <div className="space-y-md">
                        {form.financial.assets.map((asset, index) => (
                          <div
                            key={asset.id}
                            className="rounded-DEFAULT border border-border-hairline bg-surface-charcoal p-md space-y-sm"
                          >
                            <div className="flex items-center justify-between gap-sm">
                              <span className="font-label-caps text-label-caps text-on-surface-variant">
                                자산 {index + 1}
                              </span>
                              {form.financial.assets.length > 1 ? (
                                <button
                                  type="button"
                                  className="text-label-sm font-label-sm text-signal-risk min-h-[44px] px-sm"
                                  onClick={() => removeAsset(asset.id)}
                                >
                                  삭제
                                </button>
                              ) : null}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-sm">
                              <button
                                type="button"
                                className={`flex-1 min-h-[44px] rounded-DEFAULT text-label-sm font-label-md border transition-all ${
                                  !asset.isManual
                                    ? 'bg-primary-container text-on-primary-container border-primary'
                                    : 'bg-surface-architectural text-on-surface-variant border-border-subtle'
                                }`}
                                onClick={() => toggleAssetManual(asset.id, false)}
                              >
                                금융상품 선택
                              </button>
                              <button
                                type="button"
                                className={`flex-1 min-h-[44px] rounded-DEFAULT text-label-sm font-label-md border transition-all ${
                                  asset.isManual
                                    ? 'bg-primary-container text-on-primary-container border-primary'
                                    : 'bg-surface-architectural text-on-surface-variant border-border-subtle'
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
                        <h2 className="font-headline-sm text-headline-sm text-editorial-sage-light m-0">보유 대출</h2>
                        <Button type="button" variant="outline" className="h-[44px] px-md shrink-0" onClick={addLoan}>
                          <MaterialIcon name="add" className="text-[18px]" />
                          대출 추가
                        </Button>
                      </div>
                      <div className="space-y-md">
                        {form.financial.loans.map((loan, index) => (
                          <div
                            key={loan.id}
                            className="rounded-DEFAULT border border-border-hairline bg-surface-charcoal p-md space-y-sm"
                          >
                            <div className="flex items-center justify-between gap-sm">
                              <span className="font-label-caps text-label-caps text-on-surface-variant">
                                대출 {index + 1}
                              </span>
                              {form.financial.loans.length > 1 ? (
                                <button
                                  type="button"
                                  className="text-label-sm font-label-sm text-signal-risk min-h-[44px] px-sm"
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
                                min="1"
                                placeholder="65000000"
                                value={loan.balance}
                                onChange={(e) => updateLoan(loan.id, 'balance', e.target.value)}
                              />
                              <Input
                                id={`loan-monthly-${loan.id}`}
                                label="월 상환액 (원)"
                                type="number"
                                min="1"
                                placeholder="1245000"
                                hint="대출이 있는 경우 0보다 큰 금액을 입력해주세요."
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
                      <p className="text-label-sm font-label-sm text-on-surface-variant m-0">
                        목표 금액을 모으고 싶은 기간을 선택해주세요.
                      </p>
                    </div>
                    <div className="rounded-DEFAULT bg-surface-charcoal border border-border-hairline p-md">
                      <p className="font-label-caps text-label-caps text-primary mb-xs m-0">입력 요약</p>
                      <ul className="text-body-sm font-body-sm text-on-surface-variant space-y-xs m-0 pl-md">
                        <li>
                          월급:{' '}
                          {form.financial.monthlySalary
                            ? `₩${Number(form.financial.monthlySalary).toLocaleString()}`
                            : '-'}
                        </li>
                        <li>
                          자산:{' '}
                          {
                            form.financial.assets.filter((a) => a.amount || a.productId !== '' || a.manualName)
                              .length
                          }
                          건
                        </li>
                        <li>
                          대출: {form.financial.loans.filter((l) => l.balance || l.productId !== '').length}건
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-sm pt-md">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    className="h-[48px]"
                    onClick={goBack}
                    disabled={isSubmitting}
                  >
                    이전
                  </Button>
                ) : null}
                {step < 3 ? (
                  <Button
                    type="button"
                    variant="extruded"
                    fullWidth
                    className="h-[48px]"
                    onClick={goNext}
                    disabled={isSubmitting}
                  >
                    다음
                    <MaterialIcon name="arrow_forward" className="text-[18px]" />
                  </Button>
                ) : (
                  <Button type="submit" variant="extruded" fullWidth className="h-[48px]" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <MaterialIcon name="progress_activity" className="text-[18px] animate-spin" />
                        가입 처리 중…
                      </>
                    ) : (
                      <>
                        회원가입 완료
                        <MaterialIcon name="check" className="text-[18px]" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>

          <div className="mt-space-xl pt-space-md flex items-center justify-between font-body-sm gap-md flex-wrap border-t border-border-subtle">
            <span className="text-outline">이미 가입된 계정이 있으신가요?</span>
            <Link
              className="font-headline-sm text-primary hover:underline inline-flex items-center gap-1 font-semibold"
              to="/login"
            >
              로그인
              <MaterialIcon name="north_east" className="text-[16px]" />
            </Link>
          </div>
        </Card>
      </div>
    </AuthShell>
  );
}
