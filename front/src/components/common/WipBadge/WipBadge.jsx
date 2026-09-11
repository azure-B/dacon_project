/** 작은 「공사중」 뱃지 */
export function WipBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold leading-none tracking-tight bg-signal-advisory-subtle text-signal-advisory border border-signal-advisory/30 ${className}`.trim()}
    >
      공사중
    </span>
  );
}

/** 페이지·섹션용 안내 배너 */
export function WipBanner({ title = '아직 공사 중이에요', children }) {
  return (
    <div
      className="mb-md md:mb-lg rounded-xl border border-signal-advisory/30 bg-signal-advisory-subtle px-md py-sm flex items-start gap-sm"
      role="status"
    >
      <span className="shrink-0 mt-0.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-surface-charcoal text-signal-advisory border border-signal-advisory/40">
        공사중
      </span>
      <div className="min-w-0">
        <p className="text-label-md font-label-md text-editorial-sage-light m-0">{title}</p>
        {children ? (
          <p className="text-body-sm font-body-sm text-on-surface-variant m-0 mt-xs break-keep">{children}</p>
        ) : null}
      </div>
    </div>
  );
}

export default WipBadge;
