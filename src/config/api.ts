// API Configuration for Russian high-speed edge delivery
// When hosted on GitHub Pages or custom domain (цветы-софия.рф) or local dev,
// API requests automatically route to the active high-availability serverless database backend.

// In `vite dev` the default is a same-origin path, so local work never writes to the
// production database. Point at a backend explicitly with VITE_API_BASE when needed.
export const API_BASE =
  import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? '' : 'https://sitesophiya.vercel.app');

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}
