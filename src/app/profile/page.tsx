"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import { auth } from "@/lib/firebase";
// --- Account Management: Import new functions from Firebase ---
import { updateProfile, updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { Loader2 } from "lucide-react";
// --- End Account Management ---

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // State for the display name form
  const [displayName, setDisplayName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  // --- Account Management: State for password change ---
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  // --- End Account Management ---

  // --- Account Management: State for account deletion ---
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // --- End Account Management ---


  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user]);

  const handleUpdateDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("You must be logged in.");
    if (!displayName.trim()) return toast.error("Display name cannot be empty.");

    setIsSavingName(true);
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      await user.reload();
      toast.success("Display name updated successfully!");
    } catch (error) {
      console.error("Error updating display name:", error);
      toast.error("Failed to update display name.");
    } finally {
      setIsSavingName(false);
    }
  };

  // --- Account Management: Implement password change logic ---
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("You must be logged in.");
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters.");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match.");

    setIsSavingPassword(true);
    try {
      await updatePassword(user, newPassword);
      toast.success("Password updated successfully! Please log in again.");
      // For security, Firebase will log the user out after a password change
      // The AuthProvider will handle the redirect to the login page
    } catch (error: any) {
      console.error("Error updating password:", error);
      // Firebase requires recent login for this action. We can prompt for re-authentication later if needed.
      if (error.code === 'auth/requires-recent-login') {
        toast.error("This action is sensitive. Please log out and log back in before changing your password.");
      } else {
        toast.error("Failed to update password.");
      }
    } finally {
      setIsSavingPassword(false);
      setNewPassword("");
      setConfirmPassword("");
    }
  };
  // --- End Account Management ---

  // --- Account Management: Implement account deletion logic ---
  const handleDeleteAccount = async () => {
    if (!user) return toast.error("You must be logged in.");
    
    setIsDeleting(true);
    try {
      await deleteUser(user);
      toast.success("Your account has been permanently deleted.");
      // The AuthProvider will handle the redirect to the login page
    } catch (error: any) {
      console.error("Error deleting account:", error);
       if (error.code === 'auth/requires-recent-login') {
        toast.error("This action is sensitive. Please log out and log back in before deleting your account.");
      } else {
        toast.error("Failed to delete account.");
      }
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };
  // --- End Account Management ---


  return (
    <>
      <div className="min-h-screen bg-background dark">
        <Header />
        <main className="container mx-auto max-w-3xl py-12 px-4">
          <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>

            <Card>
              <CardHeader>
                <CardTitle>Update Profile</CardTitle>
                <CardDescription>
                  This is how your name will be displayed in the app.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateDisplayName} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="grid w-full sm:w-auto sm:flex-1 gap-2">
                      <label htmlFor="displayName" className="sr-only">Display Name</label>
                      <Input
                          id="displayName"
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Enter your display name"
                          disabled={isSavingName}
                      />
                  </div>
                  <Button type="submit" disabled={isSavingName} className="w-full sm:w-auto">
                    {isSavingName ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* --- Account Management: Add UI for password change --- */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  For security, you will be logged out after changing your password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="grid gap-2">
                        <label htmlFor="new-password">New Password</label>
                        <Input 
                            id="new-password" 
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={isSavingPassword}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="confirm-password">Confirm New Password</label>
                        <Input 
                            id="confirm-password" 
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={isSavingPassword}
                        />
                    </div>
                    <Button type="submit" disabled={isSavingPassword}>
                      {isSavingPassword ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : "Update Password"}
                    </Button>
                </form>
              </CardContent>
            </Card>
            {/* --- End Account Management --- */}

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  This action is permanent and cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* --- Account Management: Button now opens the confirmation dialog --- */}
                <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={isDeleting}>
                  Delete Account
                </Button>
                {/* --- End Account Management --- */}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* --- Account Management: Add the confirmation dialog for deletion --- */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : "Yes, delete my account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* --- End Account Management --- */}
    </>
  );
}

