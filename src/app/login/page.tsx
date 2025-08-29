// src/app/login/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import the Link component
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff } from 'lucide-react'; // Import icons for the toggle

// Import auth and the signIn function from our firebase config
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // State for password visibility
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Attempt to sign in with Firebase
            await signInWithEmailAndPassword(auth, email, password);
            
            toast.success("Login successful! Redirecting...");
            
            // Redirect to the homepage on successful login
            router.push('/');

        } catch (error: any) {
            console.error("Firebase Login Error:", error);
            // Provide user-friendly error messages
            let errorMessage = "An unknown error occurred.";
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = "No account found with this email address.";
                    break;
                case 'auth/wrong-password':
                    errorMessage = "Incorrect password. Please try again.";
                    break;
                case 'auth/invalid-credential':
                     errorMessage = "Invalid credentials. Please check your email and password.";
                    break;
                default:
                    errorMessage = "Failed to log in. Please try again later.";
                    break;
            }
            toast.error(errorMessage);
        } finally {
            // Ensure loading state is turned off
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-background dark">
            <Card className="w-full max-w-sm mx-4">
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="grid gap-4">
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
                            {/* Wrap input and button for positioning */}
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"} // Toggle type
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    className="pr-10" // Add padding to prevent text overlap
                                />
                                <button
                                    type="button" // Prevent form submission
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center justify-center h-full w-10 text-muted-foreground"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Logging in...' : 'Login'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="text-sm text-center block">
                    Don`&apos;t have an account?{' '}
                    <Link href="/signup" className="underline">
                        Sign up
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
