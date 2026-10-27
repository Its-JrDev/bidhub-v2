'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CurrentUser {
  userId: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setUser(json.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active) {
          setUser(json ? json.data : null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.replace(`${window.location.origin}/login`);
      }
    } catch {
      if (typeof window !== 'undefined') {
        window.location.replace(`${window.location.origin}/login`);
      }
    }
  };

  return { user, loading, refreshUser: fetchUser, logout };
}
