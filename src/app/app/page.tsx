// src/app/app/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";

export default function AppPage() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();
  const { user } = useAuth();

  // This logic is already perfect. It prioritizes the display name we just set.
  const displayName = user?.displayName || user?.email || "Anonymous";

  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      toast.error("Please enter a Room ID.");
      return;
    }
    // We pass the display name to the editor page
    router.push(`/editor/${roomId.trim()}?username=${encodeURIComponent(displayName)}`);
  };
  
  // --- New Feature: Create a unique room ID ---
  const handleCreateRoom = () => {
    // Generate a random, unique ID. This is a simple but effective way.
    const newRoomId = Math.random().toString(36).substring(2, 9);
    router.push(`/editor/${newRoomId}?username=${encodeURIComponent(displayName)}`);
  };
  // --- End New Feature ---

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleJoinRoom();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative dark">
      <Header />
      <div className="max-w-2xl mx-auto text-center space-y-8 z-10">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground tracking-tight">
            Welcome, <span className="text-primary">{displayName}</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-light">
            Create a new room or enter an existing Room ID to start collaborating.
          </p>
        </div>
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex flex-col gap-4 p-4 bg-card rounded-lg border">
            {/* --- New Feature: "Create Room" button --- */}
            <Button
              onClick={handleCreateRoom}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold px-6 text-lg py-6"
            >
              Create a New Room
            </Button>
            <div className="flex items-center space-x-2">
                <div className="flex-1 h-px bg-muted-foreground/20" />
                <span className="text-xs text-muted-foreground">OR</span>
                <div className="flex-1 h-px bg-muted-foreground/20" />
            </div>
            {/* --- End New Feature --- */}
            <Input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Enter an existing Room ID"
              className="bg-background border-border text-lg placeholder:text-muted-foreground"
            />
            <Button
              onClick={handleJoinRoom}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 text-lg py-6"
            >
              Join Room
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
    </div>
  );
}
