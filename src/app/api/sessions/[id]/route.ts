import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');

interface ChatSession {
  id: string;
  name: string;
  mode: 'brainstorming' | 'writing';
  messages: any[];
  createdAt: string;
  lastUpdated: string;
  messageCount: number;
}

interface SessionsIndex {
  sessions: ChatSession[];
  lastUpdated: string;
}

// Lade den Sessions-Index
async function loadSessionsIndex(): Promise<SessionsIndex> {
  const indexPath = path.join(SESSIONS_DIR, 'index.json');
  
  try {
    const content = await fs.readFile(indexPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {
      sessions: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Speichere den Sessions-Index
async function saveSessionsIndex(index: SessionsIndex) {
  const indexPath = path.join(SESSIONS_DIR, 'index.json');
  index.lastUpdated = new Date().toISOString();
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');
}

// PATCH: Session umbenennen
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { name } = await request.json();
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Gültiger Name ist erforderlich' }, { status: 400 });
    }
    
    // Lade Session-Datei
    const sessionPath = path.join(SESSIONS_DIR, `${id}.json`);
    
    try {
      const sessionContent = await fs.readFile(sessionPath, 'utf-8');
      const session = JSON.parse(sessionContent);
      
      // Aktualisiere Namen
      session.name = name.trim();
      session.lastUpdated = new Date().toISOString();
      
      // Speichere Session-Datei
      await fs.writeFile(sessionPath, JSON.stringify(session, null, 2), 'utf-8');
      
      // Aktualisiere Index
      const index = await loadSessionsIndex();
      const sessionIndex = index.sessions.findIndex(s => s.id === id);
      
      if (sessionIndex >= 0) {
        index.sessions[sessionIndex].name = name.trim();
        index.sessions[sessionIndex].lastUpdated = session.lastUpdated;
        await saveSessionsIndex(index);
      }
      
      return NextResponse.json({ success: true, session });
    } catch {
      return NextResponse.json({ error: 'Session nicht gefunden' }, { status: 404 });
    }
  } catch (error) {
    console.error('Fehler beim Umbenennen der Session:', error);
    return NextResponse.json({ error: 'Fehler beim Umbenennen der Session' }, { status: 500 });
  }
}

// DELETE: Session löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Lösche Session-Datei
    const sessionPath = path.join(SESSIONS_DIR, `${id}.json`);
    
    try {
      await fs.unlink(sessionPath);
    } catch {
      // Datei existiert nicht - trotzdem aus Index entfernen
    }
    
    // Entferne aus Index
    const index = await loadSessionsIndex();
    index.sessions = index.sessions.filter(s => s.id !== id);
    await saveSessionsIndex(index);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Löschen der Session:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen der Session' }, { status: 500 });
  }
} 