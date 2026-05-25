'use client';

import { useAuth } from '@/contexts/AuthContext';

export function useRequireAuthAction() {
  const { isAuthenticated } = useAuth();

  const requireAuth = () => {
    if (isAuthenticated) {
      return true;
    }

    return false;
  };

  return { requireAuth, isAuthenticated };
}
