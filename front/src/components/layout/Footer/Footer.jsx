import { Link } from 'react-router-dom';

const FOOTER_LINKS = [
  { href: '#', label: '서비스 약관' },
  { href: '#', label: '개인정보 처리방침' },
  { href: '#', label: '고객 지원' },
  { href: '#', label: '규제 고지' },
];

export default function Footer() {
  return (
    <footer className="mt-auto flex flex-col items-center md:flex-row md:justify-between px-3 sm:px-margin-mobile md:px-margin-desktop py-md md:py-lg w-full min-w-0 bg-surface-container-lowest border-t border-outline-variant text-center md:text-left gap-sm md:gap-md">
      <div className="text-label-sm font-label-sm font-semibold text-on-surface-variant break-keep">
        © 2026 AI 재무 인터렉티브. 모든 권리 보유.
      </div>
      <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-sm sm:gap-md w-full md:w-auto">
        {FOOTER_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="text-on-surface-variant hover:text-secondary transition-colors text-label-sm font-label-sm py-1 min-h-[44px] flex items-center justify-center sm:min-h-0"
          >
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  );
}
