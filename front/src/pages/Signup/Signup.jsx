import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Card } from '../../components/common';
import './Signup.css';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [terms, setTerms] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <div className="bg-surface-container-lowest text-on-surface min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop">
      <main className="w-full max-w-[480px]">
        <Card className="p-md md:p-xl">
          <div className="text-center mb-xl">
            <h1 className="text-headline-lg font-headline-lg text-primary mb-sm font-inter">AI 재무 인터렉티브</h1>
            <p className="text-body-md font-body-md text-on-surface-variant">
              기관 수준의 분석 플랫폼에 오신 것을 환영합니다. 계정을 생성하여 시작하세요.
            </p>
          </div>
          <form className="space-y-gutter" onSubmit={handleSubmit}>
            <Input
              id="signup-name"
              name="name"
              label="이름"
              placeholder="홍길동"
              icon="person"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              id="signup-email"
              name="email"
              label="이메일 주소"
              type="email"
              placeholder="이메일@회사.com"
              icon="mail"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              id="signup-password-confirm"
              name="password_confirm"
              label="비밀번호 확인"
              type="password"
              placeholder="••••••••"
              icon="lock_reset"
              required
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
            <div className="flex items-start mt-md">
              <div className="flex items-center h-5">
                <input
                  className="h-4 w-4 text-primary focus:ring-primary border-outline-variant rounded bg-surface-container-lowest cursor-pointer"
                  id="terms"
                  name="terms"
                  required
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                />
              </div>
              <div className="ml-sm text-body-sm font-body-sm">
                <label className="text-on-surface-variant cursor-pointer" htmlFor="terms">
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
            <div className="pt-md">
              <Button type="submit" variant="secondary" fullWidth className="py-[14px] md:py-[10px] px-md">
                회원가입 완료
              </Button>
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
