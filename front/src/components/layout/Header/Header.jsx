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
  return isActive
    ? 'text-secondary font-bold border-b-2 border-secondary pb-1 text-label-md font-label-md'
    : 'text-on-surface-variant hover:text-secondary transition-colors text-label-md font-label-md';
}

function drawerNavClassName({ isActive }) {
  return isActive
    ? 'text-secondary font-bold text-label-md font-label-md min-h-[44px] flex items-center py-2 px-sm rounded-lg bg-surface-container-low'
    : 'text-on-surface text-label-md font-label-md min-h-[44px] flex items-center py-2 px-sm rounded-lg hover:bg-surface-variant transition-colors';
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
    <header className="header relative">
      <nav className="sticky top-0 z-50 flex justify-between items-center w-full px-3 sm:px-margin-mobile md:px-margin-desktop bg-surface h-16 border-b border-outline-variant shadow-sm">
        <div className="flex items-center gap-sm md:gap-md min-w-0 flex-1">
          <Link
            to="/"
            className="text-headline-sm md:text-headline-md font-headline-md font-bold text-primary tracking-tight truncate max-w-[52vw] sm:max-w-none"
          >
            AI 재무 인터렉티브
          </Link>
          <div className="hidden lg:flex items-center gap-lg ml-lg">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClassName}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-xs sm:gap-sm text-primary ml-auto shrink-0">
          {isLoggedIn ? (
            <span className="lg:hidden text-label-sm font-label-md text-on-surface-variant max-w-[72px] sm:max-w-[100px] truncate">
              {displayName}
            </span>
          ) : null}
          <button
            type="button"
            className="hover:text-secondary transition-colors p-sm rounded-full hover:bg-surface-variant lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MaterialIcon name={menuOpen ? 'close' : 'menu'} />
          </button>
          <button
            type="button"
            className="hover:text-secondary transition-colors p-sm rounded-full hover:bg-surface-variant hidden lg:flex min-h-[44px] min-w-[44px] items-center justify-center"
            aria-label="알림"
          >
            <MaterialIcon name="notifications" />
          </button>
          {isLoggedIn ? (
            <div className="hidden lg:flex items-center gap-xs shrink-0">
              <span className="text-label-md font-label-md text-on-surface-variant max-w-[120px] truncate">
                {displayName}
              </span>
              <span className="p-sm rounded-full text-primary cursor-default min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="계정">
                <MaterialIcon name="account_circle" />
              </span>
            </div>
          ) : (
            <Link
              to="/login"
              className="hover:text-secondary transition-colors p-sm rounded-full hover:bg-surface-variant hidden lg:flex min-h-[44px] min-w-[44px] items-center justify-center"
              aria-label="계정"
            >
              <MaterialIcon name="account_circle" />
            </Link>
          )}
        </div>
      </nav>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="header__overlay lg:hidden"
            aria-label="메뉴 닫기"
            onClick={closeMenu}
          />
          <div className="header__drawer lg:hidden bg-surface border-b border-outline-variant px-3 sm:px-margin-mobile py-md flex flex-col gap-xs">
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
            <div className="border-t border-outline-variant/50 mt-sm pt-sm">
              {isLoggedIn ? (
                <div className="flex items-center gap-sm py-2 px-sm">
                  <MaterialIcon name="account_circle" className="text-primary shrink-0" />
                  <span className="text-label-md font-label-md text-on-surface-variant truncate">{displayName}</span>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-sm text-label-md font-label-md text-secondary min-h-[44px] py-2 px-sm"
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
