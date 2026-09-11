import { Link } from 'react-router-dom';
import { MaterialIcon } from '../../common';
import './AuthShell.css';

/**
 * Auth pages shell (Login / Signup) — dark emerald brand, not a white card center.
 */
export default function AuthShell({ children, badge = 'SECURE AUTH', footerNote }) {
  return (
    <div className="auth-shell min-h-screen flex flex-col bg-canvas-deep text-on-surface antialiased">
      <header className="w-full max-w-[1440px] mx-auto px-3 sm:px-margin-mobile lg:px-margin pt-space-xl flex items-center justify-between gap-md">
        <Link to="/" className="flex items-center gap-space-sm min-w-0">
          <div className="w-10 h-10 rounded-DEFAULT bg-surface-architectural border border-border-hairline flex items-center justify-center shrink-0">
            <MaterialIcon name="finance_mode" className="text-primary text-[22px]" />
          </div>
          <span className="font-headline-sm text-headline-sm text-editorial-sage-light tracking-tight truncate">
            머니로그
          </span>
        </Link>
        <div className="flex items-center gap-2 px-space-md py-1 rounded-full bg-surface-charcoal border border-border-hairline font-label-caps text-label-caps text-editorial-sage-muted shrink-0">
          <MaterialIcon name="shield" className="text-signal-positive text-[16px]" />
          {badge}
        </div>
      </header>

      <main className="w-full flex-1 flex items-center justify-center px-3 sm:px-margin-mobile py-space-xl">
        <div className="w-full max-w-[1380px]">{children}</div>
      </main>

      <footer className="w-full pb-space-lg text-center font-label-caps text-label-caps text-outline px-md">
        <p className="m-0">
          {footerNote || '© 2026 머니로그 · HIGH-PRECISION WEALTH TELEMETRY'}
        </p>
      </footer>
    </div>
  );
}
