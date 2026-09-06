import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { api } from './services/api';
import { saveAuthSession, ensureDemoSession, getAccessToken } from './services/authStorage';
import './index.css';

const DEMO = { loginId: 'demo01', password: 'pass1234' };

async function bootstrapAuth() {
  if (getAccessToken() && getAccessToken() !== 'demo') return;
  try {
    const data = await api.login(DEMO);
    saveAuthSession(data);
  } catch {
    ensureDemoSession();
  }
}

bootstrapAuth().finally(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
