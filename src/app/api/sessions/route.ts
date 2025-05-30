import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

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
  model?: string;
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
async function ensureSessionsDir(publicationId: string) {
  const sessionsDir = path.join(DATA_DIR, 'publications', publicationId, 'sessions');
  try {
    await fs.access(sessionsDir);
  } catch {
    await fs.mkdir(sessionsDir, { recursive: true });
  }
  return sessionsDir;
}

// Lade den Sessions-Index
async function loadSessionsIndex(publicationId: string): Promise<SessionsIndex> {
  const sessionsDir = await ensureSessionsDir(publicationId);
  const indexPath = path.join(sessionsDir, 'index.json');
  
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
async function saveSessionsIndex(publicationId: string, index: SessionsIndex) {
  const sessionsDir = await ensureSessionsDir(publicationId);
  const indexPath = path.join(sessionsDir, 'index.json');
  index.lastUpdated = new Date().toISOString();
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');
}

// Lade eine einzelne Session
async function loadSession(publicationId: string, sessionId: string): Promise<ChatSession | null> {
  const sessionsDir = await ensureSessionsDir(publicationId);
  const sessionPath = path.join(sessionsDir, `${sessionId}.json`);
  
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
async function saveSession(publicationId: string, session: ChatSession) {
  const sessionsDir = await ensureSessionsDir(publicationId);
  const sessionPath = path.join(sessionsDir, `${session.id}.json`);
  
  session.lastUpdated = new Date().toISOString();
  session.messageCount = session.messages.length;
  
  await fs.writeFile(sessionPath, JSON.stringify(session, null, 2), 'utf-8');
  
  // Aktualisiere den Index
  const index = await loadSessionsIndex(publicationId);
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
  
  await saveSessionsIndex(publicationId, index);
}

// GET: Alle Sessions auflisten oder eine spezifische Session laden
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');
    const mode = searchParams.get('mode');
    const publicationId = searchParams.get('publicationId');
    
    if (!publicationId && !sessionId) {
      return NextResponse.json({ error: 'publicationId ist erforderlich' }, { status: 400 });
    }
    
    if (sessionId) {
      // Wenn sessionId angegeben ist, suche durch alle Publikationen
      if (publicationId) {
        const session = await loadSession(publicationId, sessionId);
        if (!session) {
          return NextResponse.json({ error: 'Session nicht gefunden' }, { status: 404 });
        }
        return NextResponse.json(session);
      } else {
        // Suche durch alle Publikationen
        const publicationsDir = path.join(DATA_DIR, 'publications');
        try {
          const publications = await fs.readdir(publicationsDir);
          
          for (const pubId of publications) {
            if (pubId === 'index.json') continue;
            
            const session = await loadSession(pubId, sessionId);
            if (session) {
              return NextResponse.json(session);
            }
          }
          
          return NextResponse.json({ error: 'Session nicht gefunden' }, { status: 404 });
        } catch {
          return NextResponse.json({ error: 'Session nicht gefunden' }, { status: 404 });
        }
      }
    } else {
      // Lade Sessions-Liste für eine Publikation
      const index = await loadSessionsIndex(publicationId!);
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
    const { name, mode, messages, sessionId, publicationId, model } = await request.json();
    
    if (!publicationId) {
      return NextResponse.json({ error: 'publicationId ist erforderlich' }, { status: 400 });
    }
    
    if (sessionId) {
      // Aktualisiere bestehende Session
      const existingSession = await loadSession(publicationId, sessionId);
      if (!existingSession) {
        return NextResponse.json({ error: 'Session nicht gefunden' }, { status: 404 });
      }
      
      const updatedSession: ChatSession = {
        ...existingSession,
        name: name || existingSession.name,
        messages: messages || existingSession.messages,
        mode: mode || existingSession.mode,
        model: model !== undefined ? model : existingSession.model,
      };
      
      await saveSession(publicationId, updatedSession);
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
        model: model || 'anthropic/claude-3.5-sonnet:beta', // Standard-Modell
        messages: messages || [],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        messageCount: (messages || []).length,
      };
      
      await saveSession(publicationId, newSession);
      return NextResponse.json({ success: true, session: newSession });
    }
  } catch (error) {
    console.error('Fehler beim Speichern der Session:', error);
    return NextResponse.json({ error: 'Fehler beim Speichern der Session' }, { status: 500 });
  }
} 