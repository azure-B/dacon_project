import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Card, MaterialIcon } from '../../components/common';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop antialiased">
      <Card className="w-full max-w-[440px] bg-surface p-lg md:p-xl flex flex-col gap-lg">
        <div className="flex flex-col items-center text-center gap-sm">
          <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-lg flex items-center justify-center mb-sm shadow-level-1">
            <MaterialIcon name="account_balance" className="text-[28px]" />
          </div>
          <h1 className="text-headline-md font-headline-md text-primary m-0 tracking-tight">AI 재무 인터렉티브</h1>
          <p className="text-body-md font-body-md text-on-surface-variant m-0 mt-xs">
            인공지능과 함께 현재 재무상태를 확인하고
            <br className="hidden sm:block" /> 더 나은 금융계획을 세워보세요.
          </p>
        </div>

        <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
          <Input
            id="login-email"
            name="email"
            label="이메일"
            type="email"
            placeholder="이메일 주소"
            icon="mail"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            id="login-password"
            name="password"
            label="비밀번호"
            type="password"
            placeholder="••••••••"
            icon="lock"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="pt-sm">
            <Button type="submit" fullWidth className="h-[48px]">
              로그인
            </Button>
          </div>
        </form>

        <div className="flex flex-col gap-md pt-sm border-t border-outline-variant/30">
          <div className="flex justify-center items-center gap-md">
            <a className="text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">
              아이디 찾기
            </a>
            <span className="w-[1px] h-3 bg-outline-variant/50" />
            <a className="text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">
              비밀번호 찾기
            </a>
          </div>
          <div className="text-center">
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              계정이 없으신가요?{' '}
              <Link className="text-secondary font-medium hover:underline" to="/signup">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
