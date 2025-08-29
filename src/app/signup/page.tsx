// src/app/signup/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, User } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

export default function SignUpPage() {
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        if (!displayName.trim()) {
            toast.error("Please enter a display name.");
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters long.");
            setIsLoading(false);
            return;
        }

        try {
            // Step 1: Create the user with email and password
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Step 2: Update the user's profile with the display name
            await updateProfile(userCredential.user, {
                displayName: displayName.trim(),
            });

            // --- FIX: Step 3: Force a reload of the user's profile ---
            // This ensures the local session has the latest data (including displayName)
            // before we redirect, preventing the "flash" of the email address.
            await userCredential.user.reload();
            // --- END FIX ---

            toast.success("Account created successfully! Redirecting...");
            
            // Step 4: Redirect to the app dashboard
            router.push('/app');

        } catch (error: any) {
            console.error("Firebase Sign Up Error:", error);
            let errorMessage = "An unknown error occurred.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "This email address is already in use.";
            } else {
                errorMessage = "Failed to create an account. Please try again later.";
            }
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-background dark">
            <Card className="w-full max-w-sm mx-4">
                <CardHeader>
                    <CardTitle className="text-2xl">Sign Up</CardTitle>
                    <CardDescription>
                        Enter your information to create an account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSignUp} className="grid gap-4">
                        <div className="grid gap-2">
                            <label htmlFor="displayName">Display Name</label>
                            <Input
                                id="displayName"
                                type="text"
                                placeholder="Enter Username"
                                required
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="email">Email</label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="password">Password</label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center justify-center h-full w-10 text-muted-foreground"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="text-sm text-center block">
                    Already have an account?{' '}
                    <Link href="/login" className="underline">
                        Login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
