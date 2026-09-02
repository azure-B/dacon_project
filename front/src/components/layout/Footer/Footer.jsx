import { Link } from 'react-router-dom';

const FOOTER_LINKS = [
  { href: '#', label: '서비스 약관' },
  { href: '#', label: '개인정보 처리방침' },
  { href: '#', label: '고객 지원' },
  { href: '#', label: '규제 고지' },
];

export default function Footer() {
  return (
    <footer className="mt-auto flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop py-lg w-full bg-surface-container-lowest border-t border-outline-variant text-center md:text-left gap-md md:gap-0">
      <div className="text-label-sm font-label-sm font-semibold text-on-surface-variant">
        © 2026 AI 재무 인터렉티브. 모든 권리 보유.
      </div>
      <div className="flex flex-wrap justify-center gap-md">
        {FOOTER_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="text-on-surface-variant hover:text-secondary transition-colors text-label-sm font-label-sm"
          >
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  );
}
