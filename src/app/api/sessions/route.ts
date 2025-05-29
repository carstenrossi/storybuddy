import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  name: string;
  mode: 'brainstorming' | 'writing';
  messages: Message[];
  createdAt: string;
  lastUpdated: string;
  messageCount: number;
}

interface SessionsIndex {
  sessions: ChatSession[];
  lastUpdated: string;
}

// Stelle sicher, dass das Verzeichnis existiert
async function ensureSessionsDir() {
  try {
    await fs.access(SESSIONS_DIR);
  } catch {
    await fs.mkdir(SESSIONS_DIR, { recursive: true });
  }
}

// Lade den Sessions-Index
async function loadSessionsIndex(): Promise<SessionsIndex> {
  const indexPath = path.join(SESSIONS_DIR, 'index.json');
  
  try {
    const content = await fs.readFile(indexPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    // Index existiert nicht, erstelle leeren
    const emptyIndex: SessionsIndex = {
      sessions: [],
      lastUpdated: new Date().toISOString(),
    };
    return emptyIndex;
  }
}

// Speichere den Sessions-Index
async function saveSessionsIndex(index: SessionsIndex) {
  const indexPath = path.join(SESSIONS_DIR, 'index.json');
  index.lastUpdated = new Date().toISOString();
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');
}

// Lade eine einzelne Session
async function loadSession(sessionId: string): Promise<ChatSession | null> {
  const sessionPath = path.join(SESSIONS_DIR, `${sessionId}.json`);
  
  try {
    const content = await fs.readFile(sessionPath, 'utf-8');
    const session = JSON.parse(content);
    // Konvertiere timestamp strings zurück zu Date objects
    session.messages = session.messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
    return session;
  } catch {
    return null;
  }
}

// Speichere eine Session
async function saveSession(session: ChatSession) {
  await ensureSessionsDir();
  const sessionPath = path.join(SESSIONS_DIR, `${session.id}.json`);
  
  session.lastUpdated = new Date().toISOString();
  session.messageCount = session.messages.length;
  
  await fs.writeFile(sessionPath, JSON.stringify(session, null, 2), 'utf-8');
  
  // Aktualisiere den Index
  const index = await loadSessionsIndex();
  const existingIndex = index.sessions.findIndex(s => s.id === session.id);
  
  const sessionSummary: ChatSession = {
    ...session,
    messages: [], // Im Index speichern wir nicht die Nachrichten
  };
  
  if (existingIndex >= 0) {
    index.sessions[existingIndex] = sessionSummary;
  } else {
    index.sessions.push(sessionSummary);
  }
  
  await saveSessionsIndex(index);
}

// GET: Alle Sessions auflisten oder eine spezifische Session laden
export async function GET(request: NextRequest) {
  try {
    await ensureSessionsDir();
    
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');
    const mode = searchParams.get('mode');
    
    if (sessionId) {
      // Lade spezifische Session
      const session = await loadSession(sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Session nicht gefunden' }, { status: 404 });
      }
      return NextResponse.json(session);
    } else {
      // Lade Sessions-Liste
      const index = await loadSessionsIndex();
      let sessions = index.sessions;
      
      // Filtere nach Modus wenn angegeben
      if (mode && ['brainstorming', 'writing'].includes(mode)) {
        sessions = sessions.filter(s => s.mode === mode);
      }
      
      // Sortiere nach letztem Update (neueste zuerst)
      sessions.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
      
      return NextResponse.json({ sessions });
    }
  } catch (error) {
    console.error('Fehler beim Laden der Sessions:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Sessions' }, { status: 500 });
  }
}

// POST: Neue Session erstellen oder bestehende aktualisieren
export async function POST(request: NextRequest) {
  try {
    await ensureSessionsDir();
    
    const { name, mode, messages, sessionId } = await request.json();
    
    if (sessionId) {
      // Aktualisiere bestehende Session
      const existingSession = await loadSession(sessionId);
      if (!existingSession) {
        return NextResponse.json({ error: 'Session nicht gefunden' }, { status: 404 });
      }
      
      const updatedSession: ChatSession = {
        ...existingSession,
        name: name || existingSession.name,
        messages: messages || existingSession.messages,
        mode: mode || existingSession.mode, // Verwende bestehenden Modus falls nicht angegeben
      };
      
      await saveSession(updatedSession);
      return NextResponse.json({ success: true, session: updatedSession });
    } else {
      // Erstelle neue Session
      if (!name) {
        return NextResponse.json({ error: 'Session-Name ist erforderlich' }, { status: 400 });
      }
      
      if (!mode || !['brainstorming', 'writing'].includes(mode)) {
        return NextResponse.json({ error: 'Ungültiger Modus' }, { status: 400 });
      }
      
      const newSession: ChatSession = {
        id: Date.now().toString(),
        name,
        mode,
        messages: messages || [],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        messageCount: (messages || []).length,
      };
      
      await saveSession(newSession);
      return NextResponse.json({ success: true, session: newSession });
    }
  } catch (error) {
    console.error('Fehler beim Speichern der Session:', error);
    return NextResponse.json({ error: 'Fehler beim Speichern der Session' }, { status: 500 });
  }
} 