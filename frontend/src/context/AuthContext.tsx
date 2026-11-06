'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_URL from '@/lib/api';

// Enforce credentials (cookies) and anti-CSRF headers on all Axios requests
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['X-CSRF-Protection'] = '1';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_META_KEY = 'kc_user_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize from client-side stored non-sensitive profile (without token)
  useEffect(() => {
    // Purge legacy insecure storage that contained raw JWT tokens
    try {
      const legacyUserInfo = localStorage.getItem('userInfo');
      if (legacyUserInfo) {
        localStorage.removeItem('userInfo');
      }
    } catch {
      // Ignore in SSR
    }

    try {
      const cached = localStorage.getItem(USER_META_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Ensure no token field is kept
        if (parsed && parsed._id) {
          const { token, ...safeUser } = parsed as any;
          setUser(safeUser as UserProfile);
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached user profile', e);
    }

    // Verify session validity with backend /api/users/profile via HttpOnly cookie
    refreshProfile().finally(() => {
      setLoading(false);
    });
  }, []);

  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const res = await axios.get(`${API_URL}/users/profile`, {
        withCredentials: true,
      });
      if (res.data && res.data._id) {
        const safeProfile: UserProfile = {
          _id: res.data._id,
          name: res.data.name,
          email: res.data.email,
          phone: res.data.phone || '',
          isAdmin: Boolean(res.data.isAdmin),
        };
        setUser(safeProfile);
        try {
          localStorage.setItem(USER_META_KEY, JSON.stringify(safeProfile));
        } catch {
          // ignore
        }
        return safeProfile;
      }
      return null;
    } catch (err: any) {
      // Not logged in or session expired
      setUser(null);
      try {
        localStorage.removeItem(USER_META_KEY);
      } catch {
        // ignore
      }
      return null;
    }
  }, []);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    const res = await axios.post(
      `${API_URL}/users/login`,
      { email, password },
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      }
    );

    // Backend sets 'jwt' HttpOnly cookie. We store only safe profile state in React context.
    const safeProfile: UserProfile = {
      _id: res.data._id,
      name: res.data.name,
      email: res.data.email,
      phone: res.data.phone || '',
      isAdmin: Boolean(res.data.isAdmin),
    };

    setUser(safeProfile);
    try {
      localStorage.setItem(USER_META_KEY, JSON.stringify(safeProfile));
      // Ensure legacy token is purged
      localStorage.removeItem('userInfo');
    } catch {
      // ignore
    }

    return safeProfile;
  };

  const register = async (name: string, email: string, password: string, phone?: string): Promise<UserProfile> => {
    const res = await axios.post(
      `${API_URL}/users`,
      { name, email, password, phone },
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      }
    );

    const safeProfile: UserProfile = {
      _id: res.data._id,
      name: res.data.name,
      email: res.data.email,
      phone: res.data.phone || '',
      isAdmin: Boolean(res.data.isAdmin),
    };

    setUser(safeProfile);
    try {
      localStorage.setItem(USER_META_KEY, JSON.stringify(safeProfile));
      localStorage.removeItem('userInfo');
    } catch {
      // ignore
    }

    return safeProfile;
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/users/logout`, {}, { withCredentials: true });
    } catch (e) {
      console.warn('Logout API error', e);
    } finally {
      setUser(null);
      try {
        localStorage.removeItem(USER_META_KEY);
        localStorage.removeItem('userInfo');
      } catch {
        // ignore
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

