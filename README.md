CodeSync - Real-Time Collaborative Code Editor
Live Demo: https://codesync-app-five.vercel.app

CodeSync is a feature-rich, full-stack web application that allows multiple users to write and edit code together in real-time. It provides a seamless, low-latency collaborative experience with a suite of professional features, from live multi-cursor presence to sandboxed code execution.

Features
This project is packed with features designed to provide a complete and professional user experience.

👥 Real-Time Collaboration
Live Code Syncing: Code written by any user is instantly synchronized across all clients in the room.

Multi-User Cursors & Selections: See every user's cursor and text selections in real-time, complete with smooth animations.

Live User Presence: A real-time list displays all active users in the room, identified by their chosen display names.

Join/Leave Notifications: Receive toast notifications when users join or leave the room.

Synchronized Language Selection: The editor's language and syntax highlighting (JavaScript, Python, etc.) syncs in real-time for everyone.

🔐 User & Account Management
Full User Authentication: Secure sign-up, login, and logout functionality powered by Firebase Authentication.

Protected Routes: Core application pages are protected, redirecting unauthenticated users to the login page.

Customizable User Profiles: Users can set and update their display name from a dedicated Account Settings page.

Secure Password Change: Functionality for users to securely update their password.

Permanent Account Deletion: A secure, multi-step process for users to permanently delete their account.

💾 Code & Room Management
Persistent Code Saving: All code and language settings for a room are automatically saved to a Firestore database.

Automatic State Loading: When returning to a room, the last saved version of the code is automatically loaded into the editor.

Unique Room Generation: A "Create a New Room" feature generates a unique, random ID and directs the user straight into the session.

🚀 Code Execution
Multi-Language Runtime: Run code in multiple languages, including JavaScript (Node.js), Python, and Java.

Secure Sandboxed Execution: Code is executed securely via a backend API using the Judge0 sandbox, preventing malicious code from running on the server.

Resizable Output Panel: A rich output panel displays stdout, stderr, compile errors, and execution metadata like run time and memory usage.

✨ UI/UX Polishes
Professional Dark-Themed UI: Built with shadcn/ui, Tailwind CSS, and custom Geist fonts.

Custom App Icon: A programmatically generated SVG favicon for crisp branding.

Toast Notifications: Sonner is used for non-intrusive notifications for all major user actions.

Save Status Indicator: A live indicator in the editor header shows the current save state (Saving..., All changes saved).

Friendly Empty States: Welcoming messages are displayed when a user is the first to join a room.

Tech Stack
This project was built with a modern, full-stack technology set.

Frontend:

Framework: Next.js 14 (App Router)

Language: TypeScript

UI Library: React 18

Styling: Tailwind CSS

Real-Time: Socket.IO Client

Code Editor: Monaco Editor

UI Components: shadcn/ui, Lucide React, Sonner

Layout: React Resizable Panels

Backend (Socket.IO Server):

Runtime: Node.js

Framework: Express.js

Real-Time: Socket.IO

Platform & Services:

Database & Auth: Firebase Authentication & Firestore

Code Execution API: Judge0

Deployment:

Frontend: Vercel

Backend: Render (or any Node.js hosting service)

Getting Started
To run this project on your local machine, follow these steps.

Prerequisites
Node.js (v18 or later)

npm or yarn

1. Clone the Repository
git clone [https://github.com/Mukund701/codesync-app.git](https://github.com/Mukund701/codesync-app.git)
cd codesync-app

2. Setup Frontend
Navigate to the root directory.

Install dependencies:

npm install

Create a .env.local file in the root and add the following environment variables.

# Your Socket.IO server URL
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Firebase Project Keys (from your Firebase project console)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Judge0 API Key (from RapidAPI)
RAPIDAPI_KEY=

3. Setup Backend Server
Navigate to the server directory.

cd server

Install dependencies:

npm install

4. Run the Application
You need to run both the frontend and backend servers simultaneously in two separate terminals.

Terminal 1 (Backend):

cd server
npm start

The server will be running on http://localhost:3001.

Terminal 2 (Frontend):

# From the root directory
npm run dev

The application will be available at http://localhost:3000.

This project was built as a comprehensive showcase of full-stack development skills, focusing on real-time communication, modern UI/UX, and secure application architecture.
