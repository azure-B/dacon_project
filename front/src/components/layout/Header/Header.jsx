import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { MaterialIcon } from '../../common';
import { getAccessToken, getStoredUser } from '../../../services/authStorage';
import './Header.css';

export const NAV_ITEMS = [
  { to: '/', label: '대시보드', end: true },
  { to: '/debt-analysis', label: '부채 분석' },
  { to: '/simulation', label: '시뮬레이션' },
  { to: '/ai-feedback', label: 'AI 가계부' },
  { to: '/ai-report', label: 'AI 리포트' },
];

function navClassName({ isActive }) {
  return [
    'header__nav-link',
    isActive ? 'header__nav-link--active' : 'header__nav-link--idle',
  ].join(' ');
}

function drawerNavClassName({ isActive }) {
  return [
    'header__drawer-link text-label-numeric font-label-numeric min-h-[44px] flex items-center py-2 px-md rounded-full',
    isActive
      ? 'bg-primary-container text-on-primary-container font-semibold shadow-extrude-sm'
      : 'text-on-surface-variant hover:text-editorial-sage-light hover:bg-surface-container-high',
  ].join(' ');
}

function getAuthDisplay() {
  const accessToken = getAccessToken();
  const user = getStoredUser();
  const isLoggedIn = Boolean(accessToken && user);
  const displayName = user?.name || user?.loginId || '로그인됨';

  return { isLoggedIn, displayName };
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoggedIn, displayName } = getAuthDisplay();

  useEffect(() => {
    if (!menuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="header">
      <nav className="header__bar h-20 max-w-[1440px] mx-auto px-3 sm:px-margin-mobile lg:px-margin flex items-center justify-between gap-md">
        <Link to="/" className="header__brand flex items-center gap-sm min-w-0" onClick={closeMenu}>
          <div className="w-10 h-10 rounded-DEFAULT bg-surface-architectural border border-border-hairline flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] shrink-0">
            <MaterialIcon name="finance_mode" className="text-primary text-[22px]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-headline-sm text-headline-sm text-editorial-sage-light tracking-tight truncate">
              머니로그
            </span>
            <span className="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase hidden sm:block">
              AI 재무 인터렉티브
            </span>
          </div>
        </Link>

        <div className="header__nav-shell hidden xl:flex items-center gap-space-xs p-1.5 rounded-full bg-surface-charcoal/90 border border-border-hairline shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClassName}>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-sm shrink-0">
          <div className="hidden md:flex items-center gap-2 px-md py-1.5 rounded-full bg-surface-architectural border border-border-hairline">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-signal-positive" />
            </span>
            <span className="font-label-caps text-label-caps text-editorial-sage-muted">
              {isLoggedIn ? '동기화됨' : '게스트'}
            </span>
          </div>

          <button
            type="button"
            className="header__icon-btn xl:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-editorial-sage-light hover:bg-surface-container"
            aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MaterialIcon name={menuOpen ? 'close' : 'menu'} />
          </button>

          {isLoggedIn ? (
            <div className="hidden xl:flex items-center gap-sm pl-space-xs">
              <span className="font-label-numeric text-label-numeric text-on-surface-variant max-w-[100px] truncate">
                {displayName}
              </span>
              <div
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-glow-primary"
                aria-label="계정"
              >
                <MaterialIcon name="person" className="text-on-primary text-[18px]" />
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden xl:flex w-8 h-8 rounded-full bg-surface-container-high border border-border-hairline items-center justify-center text-editorial-sage-light hover:border-primary/40 transition-colors"
              aria-label="로그인"
            >
              <MaterialIcon name="person" className="text-[18px]" />
            </Link>
          )}
        </div>
      </nav>

      {menuOpen ? (
        <>
          <button type="button" className="header__overlay xl:hidden" aria-label="메뉴 닫기" onClick={closeMenu} />
          <div className="header__drawer xl:hidden bg-surface-charcoal border-b border-border-hairline px-3 sm:px-margin-mobile py-md flex flex-col gap-xs">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={`drawer-${item.to}`}
                to={item.to}
                end={item.end}
                className={drawerNavClassName}
                onClick={closeMenu}
              >
                {item.label}
              </NavLink>
            ))}
            <div className="border-t border-border-subtle mt-sm pt-sm">
              {isLoggedIn ? (
                <div className="flex items-center gap-sm py-2 px-md">
                  <MaterialIcon name="person" className="text-primary shrink-0" />
                  <span className="text-label-numeric font-label-numeric text-on-surface-variant truncate">
                    {displayName}
                  </span>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="header__drawer-link flex items-center gap-sm text-label-numeric font-label-numeric text-primary min-h-[44px] py-2 px-md rounded-full hover:bg-surface-container"
                  onClick={closeMenu}
                >
                  <MaterialIcon name="login" className="shrink-0" />
                  로그인
                </Link>
              )}
            </div>
          </div>
        </>
      ) : null}
    </header>
  );
}
