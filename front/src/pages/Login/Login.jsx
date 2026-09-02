import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Card, MaterialIcon } from '../../components/common';
import { api } from '../../services/api';
import { saveAuthSession } from '../../services/authStorage';
import './Login.css';

const LOGIN_ERROR_MESSAGES = {
  'loginId is required': '아이디를 입력해주세요.',
  'password is required': '비밀번호를 입력해주세요.',
  'invalid credentials': '아이디 또는 비밀번호가 올바르지 않습니다.',
  'too many login attempts': '로그인 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요.',
};

function getLoginErrorMessage(error) {
  const message = error?.message || '';
  return LOGIN_ERROR_MESSAGES[message] || '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.';
}

export default function Login() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const data = await api.login({
        loginId: loginId.trim(),
        password,
      });
      saveAuthSession(data);
      navigate('/');
    } catch (error) {
      setErrorMessage(getLoginErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
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
          {errorMessage ? (
            <p
              className="text-body-sm font-body-sm text-error m-0 px-sm py-xs bg-error-container rounded-lg border border-error/20"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}
          <Input
            id="login-id"
            name="loginId"
            label="아이디"
            type="text"
            placeholder="아이디"
            icon="person"
            required
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            disabled={isLoading}
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
            disabled={isLoading}
          />
          <div className="pt-sm">
            <Button type="submit" fullWidth className="h-[48px]" disabled={isLoading}>
              {isLoading ? '로그인 중...' : '로그인'}
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
