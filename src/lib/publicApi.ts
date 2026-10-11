import axios from 'axios';

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (process.env.NODE_ENV === 'production') {
    return 'https://hr-ms-management-backend.vercel.app/api';
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:6002/api`;
  }
  return 'http://localhost:6002/api';
};

/**
 * Clean public API instance for Candidate Career Portal.
 * Does NOT require authentication and NEVER redirects candidates to /login.
 */
export const publicApi = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Accept': 'application/json',
  },
});
