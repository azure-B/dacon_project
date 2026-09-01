import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { MaterialIcon } from '../../common';
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

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header">
      <nav className="sticky top-0 z-50 flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop bg-surface h-16 border-b border-outline-variant shadow-sm">
        <div className="flex items-center gap-md min-w-0">
          <Link
            to="/"
            className="text-headline-sm md:text-headline-md font-headline-md font-bold text-primary tracking-tight whitespace-nowrap"
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
        <div className="flex items-center gap-sm text-primary ml-auto shrink-0">
          <button
            type="button"
            className="hover:text-secondary transition-colors p-sm rounded-full hover:bg-surface-variant lg:hidden"
            aria-label="메뉴 열기"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MaterialIcon name="menu" />
          </button>
          <button
            type="button"
            className="hover:text-secondary transition-colors p-sm rounded-full hover:bg-surface-variant hidden lg:block"
            aria-label="알림"
          >
            <MaterialIcon name="notifications" />
          </button>
          <Link
            to="/login"
            className="hover:text-secondary transition-colors p-sm rounded-full hover:bg-surface-variant hidden lg:block"
            aria-label="계정"
          >
            <MaterialIcon name="account_circle" />
          </Link>
        </div>
      </nav>

      <div className="lg:hidden bg-surface border-b border-outline-variant px-margin-mobile py-sm flex gap-md overflow-x-auto hide-scrollbar whitespace-nowrap">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={navClassName}>
            {item.label}
          </NavLink>
        ))}
      </div>

      {menuOpen ? (
        <div className="lg:hidden bg-surface border-b border-outline-variant px-margin-mobile py-md flex flex-col gap-sm">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={`drawer-${item.to}`}
              to={item.to}
              end={item.end}
              className="text-label-md font-label-md text-on-surface py-sm"
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          <Link to="/login" className="text-label-md font-label-md text-secondary py-sm" onClick={() => setMenuOpen(false)}>
            로그인
          </Link>
        </div>
      ) : null}
    </header>
  );
}
