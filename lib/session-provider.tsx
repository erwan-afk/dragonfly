'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSession as useBetterAuthSession } from '@/lib/auth-client';

type SessionContextType = {
  user: any;
  isPending: boolean;
};

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useBetterAuthSession();
  const user = session?.user || null;

  return (
    <SessionContext.Provider value={{ user, isPending }}>
      {children}
    </SessionContext.Provider>
  );
}

// Hook personnalisé pour utiliser la session mise en cache
export function useOptimizedSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useOptimizedSession must be used within SessionProvider');
  }
  return context;
}

