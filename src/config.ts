// export const BASE_URL = 'http://localhost:8000/api';
// export const ADMIN_KEY = 'supersecretadminkey';

export const BASE_URL  = import.meta.env.VITE_API_URL  ?? 'http://localhost:8000/api';
export const ADMIN_SECRET_KEY = import.meta.env.VITE_ADMIN_SECRET_KEY ?? 'supersecretadminkey';


export const USER_KEY  = import.meta.env.VITE_USER_KEY  ?? 'zi_user';

export const ADMIN_USER_KEY = import.meta.env.VITE_ADMIN_USER_KEY ?? 'zi_admin_user';
