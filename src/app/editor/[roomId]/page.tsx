// src/app/editor/[roomId]/page.tsx

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// This component will act as a loader for our main editor component.
// It uses next/dynamic to ensure the EditorComponent is only loaded on the client-side.

const EditorComponent = dynamic(
  () => import('./editor-component'),
  {
    // ssr: false is the key to preventing the "window is not defined" error.
    ssr: false,
    // You can add a custom loading component here if you wish.
    loading: () => (
        <div className="flex h-screen w-full items-center justify-center bg-background dark">
            <p className="text-lg text-muted-foreground">Loading Editor...</p>
        </div>
    ),
  }
);

export default function EditorPage() {
  return (
    <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center bg-background dark">
            <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
    }>
      <EditorComponent />
    </Suspense>
  );
}
