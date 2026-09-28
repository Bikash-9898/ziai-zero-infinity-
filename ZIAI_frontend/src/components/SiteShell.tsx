// src/components/SiteShell.tsx
/**
 * Layout shell shared by the public marketing pages (/, /services, /contact).
 *
 * Owns the dark canvas, the two blurred "aura" background blobs and the
 * footer. The page header (eyebrow / title / subtitle) is optional: home.tsx
 * passes its own hero markup as children, while /services and /contact let the
 * shell render the standard header.
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface SiteShellProps {
  children: ReactNode;
  theme?: 'default' | 'violet';
  /** Small pill above the title, e.g. "Our Services". Omit to skip the header. */
  eyebrow?: string;
  /** Headline, first line. Rendered in white above the gradient second line. */
  title?: string;
  /** One or two sentences under the title. */
  subtitle?: string;
}

const FOOTER_LINKS = [
  { name: 'Documentation', path: '/services' },
  { name: 'Privacy & Policy', path: '/contact' },
  { name: 'Terms', path: '/contact' },
];

export default function SiteShell({ children, eyebrow, title, subtitle, theme = 'default' }: SiteShellProps) {
  const hasHeader = Boolean(eyebrow && title);
  const violetTheme = theme === 'violet';

  return (
    <div className={`relative min-h-screen overflow-hidden font-sans text-white ${violetTheme ? 'bg-[#030308] selection:bg-[#9b8cff]/30' : 'bg-[#0f0f0f] selection:bg-[#1488fc]/30'}`}>
      {violetTheme ? (
        <div className="pointer-events-none absolute left-1/2 top-[18rem] h-[75vh] min-h-[30rem] w-[145vw] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_50%_5%,rgba(190,180,255,0.88)_0%,rgba(112,91,255,0.62)_28%,rgba(64,43,205,0.34)_52%,transparent_73%)] blur-[18px]" />
      ) : (
        <>
          <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-[#1488fc]/12 blur-[120px]" />
          <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-[#1a94ff]/10 blur-[120px]" />
        </>
      )}

      <main
        className={
          hasHeader
            ? 'relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-28 sm:px-6 sm:pt-32'
            : 'relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pb-10 pt-24 sm:px-6 lg:pt-20'
        }
      >
        {hasHeader && (
          <header className="mx-auto max-w-3xl text-center">
            <div className="inline-flex animate-fade-in items-center gap-2 rounded-full border border-[#1488fc]/25 bg-[#1488fc]/5 px-3 py-1 text-[11px] font-medium text-[#79bbff] sm:text-xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500" />
              </span>
              {eyebrow}
            </div>

            <h1 className="mt-5 text-[clamp(2.1rem,7vw,3.75rem)] font-black leading-[1.05] tracking-tight">
              {title}
              <br />
              <span className="bg-linear-to-b from-[#79bbff] to-[#1488fc] bg-clip-text text-transparent">
                with Zero Infinity.
              </span>
            </h1>

            {subtitle && (
              <p className="mx-auto mt-4 max-w-xl text-sm font-light leading-relaxed text-gray-400 sm:text-base">
                {subtitle}
              </p>
            )}
          </header>
        )}

        {children}
      </main>

      <footer className="relative z-10 border-t border-white/5 bg-[#06060c]/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <p className="text-xs font-medium uppercase tracking-widest text-gray-500">Systems Operational</p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-medium text-gray-500 sm:text-sm">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.name} to={link.path} className="transition-colors hover:text-[#79bbff]">
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
