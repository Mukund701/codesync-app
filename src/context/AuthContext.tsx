// src/context/AuthContext.tsx

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const FullPageLoader = () => (
    <div className="flex h-screen w-full items-center justify-center bg-background dark">
        <p className="text-lg text-muted-foreground">Loading...</p>
    </div>
);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/signup';
    const isAuthPage = pathname === '/login' || pathname === '/signup';

    if (!user && !isPublicPage) {
      router.push('/login');
    } else if (user && isAuthPage) {
      router.push('/app'); // Redirect logged-in users from login/signup to the app dashboard
    }
  }, [user, loading, pathname, router]);

  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/signup';
  
  if (loading) {
    return <FullPageLoader />;
  }

  if (!user && !isPublicPage) {
    return <FullPageLoader />; // Show loader while redirecting
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

