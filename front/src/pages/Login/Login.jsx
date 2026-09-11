import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Input, MaterialIcon } from '../../components/common';
import { AuthShell } from '../../components/layout';
import { api } from '../../services/api';
import { saveAuthSession, ensureDemoSession } from '../../services/authStorage';
import './Login.css';

const DEMO = { loginId: 'demo01', password: 'pass1234' };

const CTA_LABEL = {
  idle: '로그인',
  loading: '암호화 인증 검증 중…',
  success: '보안 승인 완료',
  error: '다시 시도',
};

export default function Login() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState(DEMO.loginId);
  const [password, setPassword] = useState(DEMO.password);
  const [submitState, setSubmitState] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);

  const isBusy = submitState === 'loading' || guestLoading;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSubmitState('loading');

    try {
      const data = await api.login({ loginId: loginId.trim(), password });
      saveAuthSession(data);
      setSubmitState('success');
      window.setTimeout(() => navigate('/', { replace: true }), 600);
    } catch (error) {
      setSubmitState('error');
      setErrorMessage(error?.message || '로그인에 실패했습니다. 아이디와 비밀번호를 확인해 주세요.');
    }
  };

  const handleGuestContinue = () => {
    setGuestLoading(true);
    setErrorMessage('');
    ensureDemoSession();
    navigate('/', { replace: true });
  };

  return (
    <AuthShell badge="ENCRYPTED AUTH GATE">
      <div className="login-grid w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative">
        <div className="absolute top-10 left-12 w-96 h-96 rounded-full bg-signal-positive/5 blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-10 right-20 w-80 h-80 rounded-full bg-secondary-container/10 blur-3xl pointer-events-none -z-10" />

        {/* Left: brand manifesto — soft copy only, not API stats */}
        <div className="lg:col-span-7 flex flex-col justify-between p-space-lg lg:p-space-2xl bg-surface-charcoal/90 backdrop-blur-xl rounded-lg shadow-2xl relative overflow-hidden section-reveal">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-caps text-label-caps tracking-widest uppercase shadow-inner">
                <span className="w-1.5 h-1.5 rounded-full bg-signal-positive animate-pulse" />
                256-BIT SECURE
              </span>
            </div>
            <div className="mt-8 space-y-4">
              <p className="font-label-caps text-label-caps tracking-[0.2em] text-primary uppercase m-0">
                Quantum Wealth Telemetry
              </p>
              <h1 className="font-display text-headline-lg lg:text-display text-editorial-sage-light tracking-tight leading-[1.05] m-0 break-keep">
                자산의 흐름을 지배하는
                <br />
                <span className="login-brand-gradient">초정밀 AI 인텔리전스</span>
              </h1>
              <div className="p-4 bg-surface-container-lowest/60 rounded-DEFAULT border border-border-subtle max-w-xl">
                <p className="font-body-md text-body-md text-editorial-sage-muted italic leading-relaxed m-0 break-keep">
                  “단 1%의 금리 차이와 새어 나가는 지출이 10년 뒤 순자산 격차를 만듭니다.”
                </p>
                <div className="mt-3 flex items-center justify-between text-outline font-label-caps text-label-caps gap-2 flex-wrap">
                  <span>머니로그 · 정밀 재무 의사결정</span>
                  <span className="text-editorial-sage-light font-label-numeric font-bold tracking-wider">SECURE GATE</span>
                </div>
              </div>
            </div>
          </div>

          <div className="my-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: '지출 패턴', icon: 'bolt', copy: '실시간 분류' },
              { label: '현금흐름', icon: 'query_stats', copy: '정밀 진단' },
              { label: '부채 궤적', icon: 'account_balance', copy: '시나리오 설계' },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-surface-architectural/80 p-4 rounded-DEFAULT border border-border-subtle flex flex-col justify-between hover:bg-surface-container transition-all"
              >
                <div className="flex items-center justify-between text-outline">
                  <span className="font-label-caps text-label-caps tracking-wider uppercase">{item.label}</span>
                  <MaterialIcon name={item.icon} className="text-outline text-[18px]" />
                </div>
                <div className="mt-3">
                  <span className="font-headline-sm text-headline-sm text-editorial-sage-light tracking-tight">
                    {item.copy}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-outline">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-positive" />
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                세션 암호화 활성
              </span>
            </div>
            <div className="font-label-caps text-label-caps text-outline tracking-widest">AUTH NODE</div>
          </div>
        </div>

        {/* Right: form */}
        <div className="lg:col-span-5 flex flex-col justify-center section-reveal section-reveal-delay-1">
          <Card variant="architectural" className="p-space-lg lg:p-space-xl relative backdrop-blur-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-surface-charcoal border border-border-subtle flex items-center justify-center flex-shrink-0">
                <MaterialIcon name="finance_mode" className="text-primary text-[24px]" />
              </div>
              <div>
                <h2 className="font-headline-md text-headline-sm lg:text-headline-md text-editorial-sage-light tracking-tight m-0">
                  보안 게이트웨이 로그인
                </h2>
                <p className="font-body-sm text-body-sm text-outline mt-1 leading-snug m-0 break-keep">
                  단일 암호화 세션으로 안전하게 접속합니다.
                </p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                id="login-id"
                name="loginId"
                label="아이디"
                placeholder="demo01"
                icon="badge"
                required
                value={loginId}
                onChange={(e) => {
                  setLoginId(e.target.value);
                  if (submitState === 'error') setSubmitState('idle');
                }}
                disabled={isBusy || submitState === 'success'}
              />
              <Input
                id="login-password"
                name="password"
                label="비밀번호"
                type="password"
                passwordToggle
                placeholder="••••••••"
                icon="key"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (submitState === 'error') setSubmitState('idle');
                }}
                disabled={isBusy || submitState === 'success'}
              />

              <div className="flex items-center justify-between py-1 gap-2 flex-wrap">
                <span className="font-body-sm text-body-sm text-editorial-sage-muted">데모 계정 기본값이 채워져 있어요</span>
                <div className="flex items-center gap-1 text-signal-positive font-label-caps text-label-caps bg-signal-positive-subtle px-2 py-0.5 rounded-full">
                  <MaterialIcon name="verified_user" className="text-[13px]" />
                  TLS
                </div>
              </div>

              {errorMessage ? (
                <p
                  className="text-body-sm font-body-sm text-signal-risk m-0 px-sm py-xs rounded-DEFAULT bg-signal-risk-subtle border border-signal-risk/20 break-keep"
                  role="alert"
                >
                  {errorMessage}
                </p>
              ) : null}

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="extruded"
                  fullWidth
                  disabled={isBusy || submitState === 'success'}
                  className={`login-cta h-[52px] text-headline-sm font-headline-sm font-bold relative overflow-hidden ${
                    submitState === 'success' ? 'login-cta--success' : ''
                  } ${submitState === 'error' ? 'login-cta--error' : ''}`}
                >
                  {submitState === 'loading' ? (
                    <MaterialIcon name="progress_activity" className="text-[20px] animate-spin" />
                  ) : submitState === 'success' ? (
                    <MaterialIcon name="check_circle" className="text-[20px]" />
                  ) : submitState === 'error' ? (
                    <MaterialIcon name="error" className="text-[20px]" />
                  ) : (
                    <MaterialIcon name="arrow_forward" className="text-[20px]" />
                  )}
                  <span>{CTA_LABEL[submitState]}</span>
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-6 relative">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-outline-variant to-transparent" />
              <p className="font-label-caps text-label-caps text-center text-outline tracking-wider uppercase mb-3">
                또는
              </p>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                className="h-[48px]"
                onClick={handleGuestContinue}
                disabled={isBusy || submitState === 'success'}
              >
                {guestLoading ? (
                  <MaterialIcon name="progress_activity" className="text-[18px] animate-spin" />
                ) : (
                  <MaterialIcon name="person_outline" className="text-[18px]" />
                )}
                게스트로 계속
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="font-body-sm text-body-sm text-outline m-0">
                아직 계정이 없으신가요?{' '}
                <Link
                  className="font-label-caps text-label-caps text-primary hover:underline ml-1 inline-flex items-center"
                  to="/signup"
                >
                  회원가입 →
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </AuthShell>
  );
}
