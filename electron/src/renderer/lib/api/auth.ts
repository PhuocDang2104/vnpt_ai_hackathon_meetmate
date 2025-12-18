/**
 * Authentication API Client
 */
import api from '../apiClient';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config/env';

export interface UserRegister {
  email: string;
  password: string;
  display_name: string;
  department_id?: string;
  organization_id?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

export interface CurrentUser {
  id: string;
  email: string;
  display_name: string;
  role: string;
  department_id?: string;
  department_name?: string;
  organization_id?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  display_name: string;
  role: string;
  message: string;
}

// Token storage keys
const ACCESS_TOKEN_KEY = 'meetmate_access_token';
const REFRESH_TOKEN_KEY = 'meetmate_refresh_token';
const USER_KEY = 'meetmate_user';

/**
 * Store tokens in localStorage
 */
export function storeTokens(tokens: Token): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  if (tokens.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  }
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Store current user in localStorage
 */
export function storeUser(user: CurrentUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Get current user from localStorage
 */
export function getStoredUser(): CurrentUser | null {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Clear all auth data from localStorage
 */
export function clearAuth(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// Helpers for Supabase Auth REST
async function supabaseRequest<T>(path: string, init: RequestInit): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase chưa được cấu hình (SUPABASE_URL/SUPABASE_ANON_KEY)');
  }
  const resp = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      ...(init.headers || {}),
    },
  });
  const data = await resp.json().catch(() => null);
  if (!resp.ok) {
    const msg = data?.error_description || data?.message || resp.statusText;
    throw new Error(msg);
  }
  return data as T;
}

/**
 * Register via Supabase Auth (email/password)
 */
export async function register(data: UserRegister): Promise<RegisterResponse> {
  const payload: any = {
    email: data.email,
    password: data.password,
    data: {
      display_name: data.display_name,
      department_id: data.department_id,
      organization_id: data.organization_id,
    },
  };
  const res: any = await supabaseRequest('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const session = res?.session;
  const access_token = session?.access_token;
  if (access_token) {
    storeTokens({
      access_token,
      refresh_token: session?.refresh_token,
      token_type: 'bearer',
      expires_in: session?.expires_in || 3600,
    });
  }

  const user = res?.user || {};
  const display_name =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    data.display_name;

  const profile = {
    id: user?.id,
    email: user?.email,
    display_name,
    role: user?.user_metadata?.role || 'user',
  };
  if (profile.id) storeUser(profile as CurrentUser);

  return {
    id: profile.id || '',
    email: profile.email || '',
    display_name: profile.display_name || '',
    role: profile.role || 'user',
    message: 'Đăng ký thành công',
  };
}

/**
 * Login via Supabase Auth
 */
export async function login(data: UserLogin): Promise<Token> {
  const res: any = await supabaseRequest('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({
      email: data.email,
      password: data.password,
    }),
  });
  const access_token = res?.access_token;
  if (!access_token) throw new Error('Không nhận được access_token');

  storeTokens({
    access_token,
    refresh_token: res?.refresh_token,
    token_type: res?.token_type || 'bearer',
    expires_in: res?.expires_in || 3600,
  });

  // Lưu user thô (nếu có)
  if (res?.user) {
    const u = res.user;
    storeUser({
      id: u.id,
      email: u.email,
      display_name: u.user_metadata?.display_name || u.email,
      role: u.user_metadata?.role || 'user',
    } as CurrentUser);
  }
  return {
    access_token,
    refresh_token: res?.refresh_token,
    token_type: res?.token_type || 'bearer',
    expires_in: res?.expires_in || 3600,
  };
}

/**
 * Get current user from Supabase
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');
  const res: any = await supabaseRequest('/auth/v1/user', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const u = res || {};
  const user: CurrentUser = {
    id: u.id,
    email: u.email,
    display_name: u.user_metadata?.display_name || u.user_metadata?.full_name || u.email,
    role: u.user_metadata?.role || 'user',
  };
  storeUser(user);
  return user;
}

/**
 * Logout (Supabase)
 */
export async function logout(): Promise<void> {
  const token = getAccessToken();
  try {
    if (token && SUPABASE_URL && SUPABASE_ANON_KEY) {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch {
    // ignore
  } finally {
    clearAuth();
  }
}

/**
 * verifyToken: gọi /user để xem token còn hợp lệ
 */
export async function verifyToken(): Promise<boolean> {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}

// refreshTokens: Supabase REST không cung cấp riêng, lấy lại bằng sign-in nếu cần
export async function refreshTokens(): Promise<Token> {
  throw new Error('Supabase refresh chưa được hỗ trợ trong client này');
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  throw new Error('Change password chưa hỗ trợ (dùng Supabase UI/reset).');
}
