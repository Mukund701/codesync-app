'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';
// --- Profile Page: Import the Settings icon ---
import { LogIn, LogOut, UserPlus, Settings } from 'lucide-react';
// --- End Profile Page ---

export default function Header() {
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("You have been logged out.");
    } catch (error) {
      toast.error("Failed to log out.");
    }
  };

  return (
    <header className="absolute top-0 left-0 right-0 p-4 bg-transparent z-20">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-foreground">
          CodeSync
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/app">
                  <Button variant="ghost">Dashboard</Button>
              </Link>
              {/* --- Profile Page: Add the new link to the profile page --- */}
              <Link href="/profile">
                  <Button variant="ghost">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                  </Button>
              </Link>
              {/* --- End Profile Page --- */}
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
