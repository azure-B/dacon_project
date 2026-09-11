/**
 * App page width shell — matches Dashboard / Stitch max-w 1440.
 */
export default function PageContainer({ children, className = '', as: Component = 'div' }) {
  return (
    <Component
      className={`page-shell max-w-[1440px] w-full mx-auto px-3 sm:px-margin-mobile lg:px-margin py-space-xl flex flex-col gap-space-xl min-w-0 ${className}`.trim()}
    >
      {children}
    </Component>
  );
}
