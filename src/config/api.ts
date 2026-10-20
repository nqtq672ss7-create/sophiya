// API Configuration for Russian high-speed edge delivery
// When hosted on GitHub Pages or custom domain (цветы-софия.рф),
// API requests automatically route to the active high-availability serverless database backend.

export const API_BASE = import.meta.env.VITE_API_BASE || 'https://sitesophiya.vercel.app';

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // During local development on localhost, keep relative if proxy is used, or fallback to API_BASE
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return cleanPath;
    }
  }
  
  return `${API_BASE}${cleanPath}`;
}
