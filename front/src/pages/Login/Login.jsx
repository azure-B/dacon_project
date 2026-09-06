import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { ensureDemoSession } from '../../services/authStorage';

/** 데모: 로그인 화면 생략 → 홈으로 */
export default function Login() {
  useEffect(() => {
    ensureDemoSession();
  }, []);

  return <Navigate to="/" replace />;
}
