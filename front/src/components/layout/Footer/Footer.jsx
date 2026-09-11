import { Link } from 'react-router-dom';
import { MaterialIcon } from '../../common';
import { NAV_ITEMS } from '../Header/Header';
import './Footer.css';

const LEGAL_LINKS = [
  { href: '#', label: '개인정보처리방침' },
  { href: '#', label: '이용약관' },
  { href: '#', label: '위험고지서' },
];

export default function Footer() {
  return (
    <footer className="footer w-full bg-surface-charcoal border-t border-border-hairline mt-space-2xl">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-margin-mobile lg:px-margin py-space-2xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-space-xl mb-space-xl">
          <div className="md:col-span-2 flex flex-col gap-space-sm">
            <div className="flex items-center gap-space-xs">
              <MaterialIcon name="verified_user" className="text-primary text-[20px]" />
              <span className="font-headline-sm text-headline-sm text-editorial-sage-light">머니로그</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-lg leading-relaxed">
              자산·부채·현금흐름을 한곳에서 보고, 상환과 저축 궤적을 차분히 정리하는 AI 재무 인터페이스입니다.
            </p>
            <div className="flex items-center gap-3 font-label-caps text-label-caps text-outline">
              <span className="inline-flex items-center gap-1">
                <MaterialIcon name="lock" className="text-[14px] text-signal-positive" />
                보안 세션
              </span>
              <span>•</span>
              <span>UI 실험 빌드</span>
            </div>
          </div>

          <div className="flex flex-col gap-space-xs">
            <span className="font-label-caps text-label-caps text-editorial-sage-light tracking-wider uppercase mb-1">
              재무 모듈
            </span>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-space-xs">
            <span className="font-label-caps text-label-caps text-editorial-sage-light tracking-wider uppercase mb-1">
              계정
            </span>
            <Link
              to="/login"
              className="font-label-numeric text-label-numeric text-secondary hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              로그인
              <MaterialIcon name="arrow_forward" className="text-[16px]" />
            </Link>
          </div>
        </div>

        <div className="pt-space-md border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-space-sm font-label-caps text-label-caps text-outline">
          <p>© 2026 머니로그. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center gap-space-md">
            {LEGAL_LINKS.map((link) => (
              <a key={link.label} href={link.href} className="hover:text-on-surface transition-colors">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
