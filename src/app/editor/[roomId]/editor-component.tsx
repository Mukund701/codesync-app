"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { type Socket, io } from 'socket.io-client';
import { useParams, useSearchParams } from 'next/navigation';
import Editor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Copy, User, Wifi, WifiOff, Code, Play, Terminal, X, ChevronsLeftRight, Cloud, CloudOff, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import debounce from 'lodash.debounce';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";


type UserData = {
  id: string;
  username: string;
};

type RemoteCursorState = {
  targetPosition: monaco.Position;
  lastRenderedPosition: monaco.Position;
  animationStartTime: number;
};

type ExecutionOutput = {
    output?: string;
    error?: string;
    compile_output?: string;
    status?: string;
    time?: string;
    memory?: number;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const languages = [ { value: 'javascript', label: 'JavaScript' }, { value: 'typescript', label: 'TypeScript' }, { value: 'python', label: 'Python' }, { value: 'java', label: 'Java' }, { value: 'html', label: 'HTML' }, { value: 'css', label: 'CSS' }];
const USER_COLORS = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF', '#33FFA1', '#FFC300', '#FF3333', '#33FFC3', '#C333FF'];
const getUserColor = (userId: string) => { let hash = 0; for (let i = 0; i < userId.length; i++) { hash = userId.charCodeAt(i) + ((hash << 5) - hash); } return USER_COLORS[Math.abs(hash) % USER_COLORS.length]; };

export default function EditorComponent() {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [code, setCode] = useState('// Loading room data...');
  const [users, setUsers] = useState<UserData[]>([]);
  const [language, setLanguage] = useState('javascript');
  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState<ExecutionOutput | null>(null);
  const [isOutputVisible, setIsOutputVisible] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  
  const socketRef = useRef<Socket | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const cursorDecorationsRef = useRef<Record<string, string[]>>({});
  const selectionDecorationsRef = useRef<Record<string, string[]>>({});
  const remoteCursorsRef = useRef<Record<string, RemoteCursorState>>({});
  const animationFrameRef = useRef<number>();
  const usersRef = useRef(users);
  
  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const username = searchParams.get('username') || 'Anonymous';

  const debouncedSave = useCallback(
    debounce(async (newCode: string, newLanguage: string) => {
      if (!roomId) return;
      setSaveStatus('saving');
      try {
        const roomRef = doc(db, 'rooms', roomId);
        await setDoc(roomRef, { 
            code: newCode, 
            language: newLanguage,
            lastUpdated: serverTimestamp() 
        }, { merge: true });
        setSaveStatus('saved');
      } catch (error) {
        console.error("Error saving to Firestore:", error);
        toast.error("Could not save changes to the cloud.");
        setSaveStatus('error');
      }
    }, 2000),
    [roomId]
  );

  useEffect(() => {
    const loadRoomData = async () => {
        if (!roomId) return;
        try {
            const roomRef = doc(db, 'rooms', roomId);
            const docSnap = await getDoc(roomRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setCode(data.code || '// Start coding...');
                setLanguage(data.language || 'javascript');
            } else {
                setCode('// Welcome to your new collaborative room!\n// Your code will be saved automatically.');
            }
        } catch (error) {
            console.error("Error loading from Firestore:", error);
            toast.error("Could not load room data.");
            setCode('// Error loading room data. Please check the console.');
        } finally {
            setIsDataLoaded(true);
            setSaveStatus('saved');
        }
    };
    loadRoomData();
  }, [roomId]);

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.id = 'dynamic-cursor-styles';
    document.head.appendChild(styleElement);
    const newStyles = `@keyframes blink { 50% { opacity: 0; } }` + users.map(user => `.remote-cursor.userId-${user.id} { background-color: ${getUserColor(user.id)}; width: 2px !important; animation: blink 1.2s infinite; } .remote-selection.userId-${user.id} { background-color: ${getUserColor(user.id)}40; } .remote-cursor-label.userId-${user.id} { background-color: ${getUserColor(user.id)}; color: #ffffff; padding: 1px 4px; border-radius: 2px; font-size: 12px; }`).join('\n');
    styleElement.innerHTML = newStyles;
    return () => { styleElement.remove(); };
  }, [users]);
  
  const runAnimationLoop = useCallback(() => {
    const now = Date.now();
    let needsAnotherFrame = false;
    Object.entries(remoteCursorsRef.current).forEach(([userId, cursorState]) => {
        const { targetPosition, lastRenderedPosition, animationStartTime } = cursorState;
        const TWEEN_DURATION = 100;
        const progress = Math.min((now - animationStartTime) / TWEEN_DURATION, 1);
        const interpolatedLine = lastRenderedPosition.lineNumber + (targetPosition.lineNumber - lastRenderedPosition.lineNumber) * progress;
        const interpolatedColumn = lastRenderedPosition.column + (targetPosition.column - lastRenderedPosition.column) * progress;
        const newPosition = new monaco.Position(interpolatedLine, interpolatedColumn);
        const user = usersRef.current.find(u => u.id === userId);
        if (user) {
            updateUserCursor(userId, user.username, new monaco.Range(newPosition.lineNumber, newPosition.column, newPosition.lineNumber, newPosition.column));
        }
        if (progress < 1) {
            needsAnotherFrame = true;
        } else {
            cursorState.lastRenderedPosition = targetPosition;
        }
    });
    if (needsAnotherFrame) {
        animationFrameRef.current = requestAnimationFrame(runAnimationLoop);
    } else {
        animationFrameRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    if (!isDataLoaded) return;
    if (!process.env.NEXT_PUBLIC_SOCKET_URL) {
        toast.error("Socket server URL is not configured in .env.local");
        return;
    }
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, { autoConnect: false });
    socketRef.current = socket;
    if (roomId) {
        socket.connect();
    }
    
    function onConnect() { setIsConnected(true); toast.success(`Welcome, ${username}!`); socket.emit('joinRoom', { roomId, username }); }
    function onDisconnect() { setIsConnected(false); toast.error('Disconnected.'); }
    function onCodeUpdate(newCode: string) { if (editorRef.current?.getValue() !== newCode) setCode(newCode); }
    function onUserListUpdate(userList: UserData[]) { setUsers(userList); }
    function onUserJoined({ username }: { username: string }) { toast.info(`${username} joined.`); }
    function onUserLeft({ username }: { username: string }) { toast.warning(`${username} left.`); }
    function onLanguageUpdate(newLanguage: string) { setLanguage(newLanguage); }
    function onCursorUpdate({ userId, username, position }: { userId: string, username: string, position: monaco.Position }) {
        if (userId === socketRef.current?.id) return;
        if (!remoteCursorsRef.current[userId]) {
            remoteCursorsRef.current[userId] = { targetPosition: position, lastRenderedPosition: position, animationStartTime: 0 };
        }
        remoteCursorsRef.current[userId].targetPosition = position;
        remoteCursorsRef.current[userId].animationStartTime = Date.now();
        if (!animationFrameRef.current) {
            animationFrameRef.current = requestAnimationFrame(runAnimationLoop);
        }
    }
    function onSelectionUpdate({ userId, username, selection }: { userId: string, username: string, selection: monaco.IRange }) {
        if (userId === socketRef.current?.id) return;
        updateUserSelection(userId, username, new monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn));
    }
    function onCursorRemove({ userId }: { userId: string }) {
        removeUserDecorations(userId);
        delete remoteCursorsRef.current[userId];
    }
    
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('codeUpdate', onCodeUpdate);
    socket.on('updateUserList', onUserListUpdate);
    socket.on('user:joined', onUserJoined);
    socket.on('user:left', onUserLeft);
    socket.on('language:update', onLanguageUpdate);
    socket.on('cursor:update', onCursorUpdate);
    socket.on('selection:update', onSelectionUpdate);
    socket.on('cursor:remove', onCursorRemove);
    
    return () => {
        socket.disconnect();
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        socket.off();
    };
  }, [roomId, username, runAnimationLoop, isDataLoaded]);

  const updateUserCursor = (userId: string, decorationUsername: string, range: monaco.Range) => {
    if (!editorRef.current) return;
    const newDecorations = [{ range, options: { className: `remote-cursor userId-${userId}`, after: { content: ` ${decorationUsername}`, inlineClassName: `remote-cursor-label userId-${userId}` }, stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges } }];
    const newDecorationIds = editorRef.current.deltaDecorations(cursorDecorationsRef.current[userId] || [], newDecorations);
    cursorDecorationsRef.current[userId] = newDecorationIds;
  };

  const updateUserSelection = (userId: string, decorationUsername: string, range: monaco.Range) => {
    if (!editorRef.current) return;
    const isSelectionEmpty = range.startLineNumber === range.endLineNumber && range.startColumn === range.endColumn;
    if (!isSelectionEmpty) {
        removeUserCursor(userId);
        const newDecorations = [{ range, options: { className: `remote-selection userId-${userId}`, stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges } }];
        const newDecorationIds = editorRef.current.deltaDecorations(selectionDecorationsRef.current[userId] || [], newDecorations);
        selectionDecorationsRef.current[userId] = newDecorationIds;
    } else {
        editorRef.current.deltaDecorations(selectionDecorationsRef.current[userId] || [], []);
        selectionDecorationsRef.current[userId] = [];
    }
  };

  const removeUserCursor = (userId: string) => {
    if (editorRef.current) {
        editorRef.current.deltaDecorations(cursorDecorationsRef.current[userId] || [], []);
        delete cursorDecorationsRef.current[userId];
    }
  }

  const removeUserDecorations = (userId: string) => {
    if (editorRef.current) {
        removeUserCursor(userId);
        editorRef.current.deltaDecorations(selectionDecorationsRef.current[userId] || [], []);
        delete selectionDecorationsRef.current[userId];
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    const throttle = <T extends (...args: any[]) => void>(func: T, delay: number) => {
        let timeout: NodeJS.Timeout | null = null;
        return (...args: Parameters<T>) => {
            if (!timeout) {
                timeout = setTimeout(() => {
                    func(...args);
                    timeout = null;
                }, delay);
            }
        };
    };
    const throttledCursorEmit = throttle((position: monaco.Position) => { socketRef.current?.emit('cursor:move', { roomId, position }); }, 50);
    const throttledSelectionEmit = throttle((selection: monaco.Selection) => { socketRef.current?.emit('selection:change', { roomId, selection }); }, 100);
    editor.onDidChangeCursorPosition(e => { throttledCursorEmit(e.position); });
    editor.onDidChangeCursorSelection(e => { throttledSelectionEmit(e.selection); });
  };

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    if (newCode !== code) {
        setSaveStatus('saving');
        setCode(newCode);
        socketRef.current?.emit('codeChange', { roomId, newCode });
        debouncedSave(newCode, language);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setSaveStatus('saving');
    setLanguage(newLanguage);
    socketRef.current?.emit('language:change', { roomId, newLanguage });
    if(editorRef.current) {
        debouncedSave(editorRef.current.getValue(), newLanguage);
    }
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Room link copied!");
  };

  const handleRunCode = async () => {
    if (!editorRef.current) return;
    const currentCode = editorRef.current.getValue();
    if (!currentCode.trim()) {
        toast.info("There is no code to execute.");
        return;
    }

    setIsExecuting(true);
    setIsOutputVisible(true);
    setOutput(null);

    try {
        const response = await fetch('/api/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: currentCode, language }),
        });

        const result = await response.json();

        if (response.ok) {
            setOutput(result);
        } else {
            setOutput({ error: result.error || "An unknown error occurred." });
            toast.error(result.error || "Failed to execute code.");
        }
    } catch (error) {
        console.error("Execution fetch error:", error);
        setOutput({ error: "Failed to connect to the execution server." });
        toast.error("Failed to connect to the execution server.");
    } finally {
        setIsExecuting(false);
    }
  };
  
  const SaveStatusIndicator = () => {
    switch (saveStatus) {
        case 'saving':
            return <div className="flex items-center gap-2 text-sm text-yellow-500"><Loader2 className="h-4 w-4 animate-spin" /><span>Saving...</span></div>;
        case 'saved':
            return <div className="flex items-center gap-2 text-sm text-green-500"><Cloud className="h-4 w-4" /><span>All changes saved</span></div>;
        case 'error':
            return <div className="flex items-center gap-2 text-sm text-red-500"><CloudOff className="h-4 w-4" /><span>Error saving</span></div>;
        default:
            return null;
    }
  };

  return (
    <div className="h-screen bg-background text-foreground flex flex-col md:flex-row dark">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold hidden sm:block">
              Room: <span className="font-mono bg-muted px-2 py-1 rounded">{roomId}</span>
            </h1>
            <div className="flex items-center gap-2 text-sm">
              {isConnected ? <><Wifi className="h-4 w-4 text-green-500" /> <span className="text-green-500">Connected</span></> : <><WifiOff className="h-4 w-4 text-red-500" /> <span className="text-red-500">Disconnected</span></>}
            </div>
            <SaveStatusIndicator />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleRunCode} variant="secondary" size="sm" disabled={isExecuting}>
                <Play className={`h-4 w-4 mr-2 ${isExecuting ? 'animate-spin' : ''}`} />
                {isExecuting ? 'Running...' : 'Run Code'}
            </Button>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[150px]"><div className="flex items-center gap-2"><Code className="h-4 w-4" /><SelectValue /></div></SelectTrigger>
              <SelectContent>{languages.map((lang) => (<SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>))}</SelectContent>
            </Select>
            <Button onClick={handleCopyLink} variant="outline" size="sm"><Copy className="h-4 w-4 mr-2" />Copy Link</Button>
          </div>
        </header>
        <main className="flex-1 p-4">
            <PanelGroup direction="vertical">
                <Panel defaultSize={isOutputVisible ? 60 : 100} minSize={20}>
                    <div className="h-full w-full bg-card rounded-lg overflow-hidden">
                        <Editor height="100%" language={language} theme="vs-dark" value={code} onMount={handleEditorDidMount} onChange={handleCodeChange} options={{ minimap: { enabled: false }, readOnly: !isDataLoaded }} />
                    </div>
                </Panel>
                {isOutputVisible && (
                    <>
                        <PanelResizeHandle className="h-2 flex items-center justify-center bg-transparent transition hover:bg-muted">
                            <ChevronsLeftRight className="h-3 w-3 rotate-90 text-muted-foreground" />
                        </PanelResizeHandle>
                        <Panel defaultSize={40} minSize={20}>
                            <div className="h-full w-full bg-card rounded-lg flex flex-col">
                                <div className="flex items-center justify-between p-2 border-b">
                                    <div className="flex items-center gap-2">
                                        <Terminal className="h-5 w-5" />
                                        <h3 className="font-semibold">Output</h3>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOutputVisible(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex-1 p-4 font-mono text-sm overflow-auto">
                                    {isExecuting ? (
                                        <p className="text-muted-foreground">Executing code...</p>
                                    ) : output ? (
                                        <>
                                            {output.output && <pre className="whitespace-pre-wrap">{output.output}</pre>}
                                            {output.error && <pre className="whitespace-pre-wrap text-red-500">{output.error}</pre>}
                                            {output.compile_output && <pre className="whitespace-pre-wrap text-yellow-500">{output.compile_output}</pre>}
                                            <div className="text-xs text-muted-foreground mt-4 pt-2 border-t">
                                                Status: {output.status || 'N/A'} | Time: {output.time || 'N/A'}s | Memory: {output.memory ? (output.memory / 1024).toFixed(2) : 'N/A'} MB
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-muted-foreground">{"Click 'Run Code' to see the output here."}</p>
                                    )}
                                </div>
                            </div>
                        </Panel>
                    </>
                )}
            </PanelGroup>
        </main>
      </div>
      <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l bg-card">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Active Users</h2>
          <p className="text-sm text-muted-foreground mt-1">{users.length} user{users.length !== 1 ? "s" : ""} online</p>
        </div>
        {/* --- Final Polish: Conditional rendering for the user list --- */}
        <div className="p-4 h-[calc(100vh-12rem)] md:h-[calc(100vh-5rem)] overflow-y-auto">
          {users.length > 1 ? (
            <div className="space-y-3">
              {users.map((user) => (
                <Card key={user.id} className="p-3 bg-background/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8" style={{ boxShadow: `0 0 0 2px ${getUserColor(user.id)}` }}>
                      <AvatarFallback className="bg-transparent text-foreground"><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" title={user.username}>{user.username} {socketRef.current && socketRef.current.id === user.id && '(You)'}</p>
                    </div>
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: getUserColor(user.id) }}/>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold">You&apos;re the first one here!</h3>
                <p className="text-sm text-muted-foreground mt-2">
                    Copy the room link and share it with others to start collaborating.
                </p>
            </div>
          )}
        </div>
        {/* --- End Final Polish --- */}
      </aside>
    </div>
  );
}

