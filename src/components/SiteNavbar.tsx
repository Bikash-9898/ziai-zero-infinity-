// src/components/SiteNavbar.tsx
/**
 * Shared top navigation for the public marketing pages (/, /services, /contact).
 *
 * Extracted from home.tsx so the nav links, brand mark and auth actions stay in
 * one place — previously the markup was inline in home.tsx and the /services
 * and /contact routes it links to had nothing to render.
 *
 * Adds two things over the original inline markup:
 *   1. Active-link highlighting, derived from the current route.
 *   2. A mobile menu, since the center nav is `hidden md:flex` and was
 *      therefore unreachable on small screens.
 */
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, User, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/useAuth';

const NAV_ITEMS = [
  { name: 'Home', path: '/' },
  { name: 'Services', path: '/services' },
  { name: 'Contact', path: '/contact' },
];

const isActivePath = (pathname: string, path: string) =>
  path === '/' ? pathname === '/' : pathname.startsWith(path);

export default function SiteNavbar({ onSignInClick, accent = 'blue' }: { onSignInClick: () => void; accent?: 'blue' | 'violet' }) {
  const { user, logout } = useAuth();
  const violetAccent = accent === 'violet';
  const navigate       = useNavigate();
  const { pathname }   = useLocation();

  // The open menu remembers the path it was opened on, so a navigation (link
  // click, or browser back/forward) closes it automatically. Derived during
  // render rather than reset from an effect, which would cost an extra render.
  const [menu, setMenu]           = useState({ open: false, path: pathname });
  const menuOpen                  = menu.open && menu.path === pathname;
  const toggleMenu = ()           => setMenu((m) => ({ open: !m.open, path: pathname }));
  const closeMenu  = ()           => setMenu({ open: false, path: pathname });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const authActions = (
    <>
      {user ? (
        <div className="flex max-w-[46vw] items-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-1 pl-1.5 pr-1 sm:max-w-none sm:gap-2">
          <Link
            to="/client"
            className="flex min-w-0 cursor-pointer items-center gap-2 px-2"
          >
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${violetAccent ? 'bg-violet-500/20' : 'bg-purple-500/20'}`}>
              <User size={14} className={violetAccent ? 'text-violet-300' : 'text-purple-400'} />
            </div>
            <span className="truncate text-xs font-medium text-gray-200 sm:text-sm">{user.username}</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={onSignInClick}
          className="px-2.5 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white sm:px-3"
        >
          Sign In
        </button>
      )}
      <button
        onClick={() => navigate(user ? '/client/chat' : '/guest')}
        className="hidden rounded-full bg-white px-4 py-2 text-xs font-bold text-black transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 active:scale-95 sm:block"
      >
        Get Started
      </button>
    </>
  );

  return (
    <nav className="fixed inset-x-0 top-0 z-100 border-b border-white/5 bg-[#0a0a0d]/80 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        {/* Logo */}
        <Link to="/" className="group flex min-w-0 items-center gap-2.5">
          <div className={[
            'flex h-8 w-9 shrink-0 items-center justify-center rounded-lg transition-all sm:h-9 sm:w-9',
            violetAccent
              ? 'bg-linear-to-br from-[#a99cff] to-[#6550ed] shadow-[0_0_20px_rgba(119,100,255,0.3)] group-hover:shadow-[0_0_25px_rgba(119,100,255,0.55)]'
              : 'bg-linear-to-br from-[#1488fc] to-[#1a94ff] shadow-[0_0_20px_rgba(20,136,252,0.3)] group-hover:shadow-[0_0_25px_rgba(20,136,252,0.55)]',
          ].join(' ')}>
            <img
              src="/images/logo/logo.png"
              alt="Logo"
              className="h-6 w-6 rounded-md object-contain"
            />
          </div>
          <span className={violetAccent
            ? 'truncate bg-linear-to-r from-white via-white to-[#c1b8ff] bg-clip-text text-base font-bold tracking-tight text-transparent sm:text-lg'
            : 'truncate bg-linear-to-r from-white via-white to-[#79bbff] bg-clip-text text-base font-bold tracking-tight text-transparent sm:text-lg'}>
            Zero Infinity
          </span>
        </Link>

        {/* Center Nav */}
        <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.path);
            const activeClass = violetAccent
              ? 'bg-[#9b8cff]/10 text-[#c1b8ff]'
              : 'bg-[#1488fc]/10 text-[#79bbff]';
            return (
              <Link
                key={item.name}
                to={item.path}
                aria-current={active ? 'page' : undefined}
                className={[
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                  active ? activeClass : 'text-gray-400 hover:bg-white/5 hover:text-white',
                ].join(' ')}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Right Side Actions */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">{authActions}</div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={toggleMenu}
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
          className="-mr-1 rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white md:hidden"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="mx-auto mt-3 max-w-6xl rounded-2xl border border-white/10 bg-[#0b0b1a]/95 p-2 backdrop-blur-2xl md:hidden">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={closeMenu}
                aria-current={active ? 'page' : undefined}
                className={[
                  'block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? violetAccent ? 'bg-[#9b8cff]/10 text-[#c1b8ff]' : 'bg-[#1488fc]/10 text-[#79bbff]'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white',
                ].join(' ')}
              >
                {item.name}
              </Link>
            );
          })}
          <button
            onClick={() => {
              closeMenu();
              navigate(user ? '/client/chat' : '/guest');
            }}
            className="mt-1 w-full rounded-xl bg-white px-3 py-2.5 text-sm font-bold text-black"
          >
            Get Started
          </button>
        </div>
      )}
    </nav>
  );
}
