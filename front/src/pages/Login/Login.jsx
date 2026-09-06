import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { saveAuthSession, ensureDemoSession } from '../../services/authStorage';

const DEMO = { loginId: 'demo01', password: 'pass1234' };

/** 앱 진입 시 더미 계정으로 로그인 API 호출 → 홈 */
export default function Login() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('로그인 중…');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await api.login(DEMO);
        if (cancelled) return;
        saveAuthSession(data);
        navigate('/', { replace: true });
      } catch (error) {
        if (cancelled) return;
        // API 실패해도 화면은 들어가게 (로컬 폴백)
        ensureDemoSession();
        setMessage(error?.message || '로그인 실패 — 홈으로 이동합니다');
        navigate('/', { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-on-surface-variant text-body-md">
      {message}
    </div>
  );
}
