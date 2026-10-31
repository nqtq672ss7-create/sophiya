// API Configuration for Russian high-speed edge delivery
// When hosted on GitHub Pages or custom domain (цветы-софия.рф) or local dev,
// API requests automatically route to the active high-availability serverless database backend.

export const API_BASE = import.meta.env.VITE_API_BASE || 'https://sitesophiya.vercel.app';

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}
