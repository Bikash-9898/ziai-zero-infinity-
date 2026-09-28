// export const BASE_URL = 'http://localhost:8000/api';
// export const ADMIN_KEY = 'supersecretadminkey';

export const BASE_URL  = import.meta.env.VITE_API_URL  ?? 'http://localhost:8000/api';
export const ADMIN_SECRET_KEY = import.meta.env.VITE_ADMIN_SECRET_KEY ?? 'supersecretadminkey';


export const USER_KEY  = import.meta.env.VITE_USER_KEY  ?? 'zi_user';

export const ADMIN_USER_KEY = import.meta.env.VITE_ADMIN_USER_KEY ?? 'zi_admin_user';

// ── Public contact details ────────────────────────────────────────────────────
// Rendered on the /contact page. Replace the placeholder values below with the
// real business details — the page reads everything from this object, so no
// component needs to be touched.
export const CONTACT = {
  email: 'support@zeroinfinity.ai',
  phone: '+977 9800000000',
  location: 'Kathmandu Valley, Nepal',
  hours: 'Sunday – Friday, 10:00 – 18:00 NPT (UTC+5:45)',
  responseTime: 'We reply to every message within one business day.',
  socials: [
    { name: 'GitHub',   href: '#', handle: '@zero-infinity' },
    { name: 'X',        href: '#', handle: '@zeroinfinity' },
    { name: 'LinkedIn', href: '#', handle: 'Zero Infinity' },
  ],
} as const;
