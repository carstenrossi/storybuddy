import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PUBLICATIONS_DIR = path.join(DATA_DIR, 'publications');

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

// Finde Session-Datei durch alle Publikationen
async function findSessionFile(sessionId: string): Promise<{sessionPath: string, publicationId: string} | null> {
  try {
    const publications = await fs.readdir(PUBLICATIONS_DIR);
    
    for (const publicationId of publications) {
      if (publicationId === 'index.json') continue;
      
      const sessionsDir = path.join(PUBLICATIONS_DIR, publicationId, 'sessions');
      const sessionPath = path.join(sessionsDir, `${sessionId}.json`);
      
      try {
        await fs.access(sessionPath);
        return { sessionPath, publicationId };
      } catch {
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Fehler beim Suchen der Session-Datei:', error);
    return null;
  }
}

// Lade den Sessions-Index für eine Publikation
async function loadSessionsIndex(publicationId: string): Promise<SessionsIndex> {
  const indexPath = path.join(PUBLICATIONS_DIR, publicationId, 'sessions', 'index.json');
  
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

// Speichere den Sessions-Index für eine Publikation
async function saveSessionsIndex(publicationId: string, index: SessionsIndex) {
  const indexPath = path.join(PUBLICATIONS_DIR, publicationId, 'sessions', 'index.json');
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
    
    // Finde Session
    const result = await findSessionFile(id);
    if (!result) {
      return NextResponse.json({ error: 'Session nicht gefunden' }, { status: 404 });
    }
    
    const { sessionPath, publicationId } = result;
    
    try {
      const sessionContent = await fs.readFile(sessionPath, 'utf-8');
      const session = JSON.parse(sessionContent);
      
      // Aktualisiere Namen
      session.name = name.trim();
      session.lastUpdated = new Date().toISOString();
      
      // Speichere Session-Datei
      await fs.writeFile(sessionPath, JSON.stringify(session, null, 2), 'utf-8');
      
      // Aktualisiere Index
      const index = await loadSessionsIndex(publicationId);
      const sessionIndex = index.sessions.findIndex(s => s.id === id);
      
      if (sessionIndex >= 0) {
        index.sessions[sessionIndex].name = name.trim();
        index.sessions[sessionIndex].lastUpdated = session.lastUpdated;
        await saveSessionsIndex(publicationId, index);
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
    
    // Finde Session
    const result = await findSessionFile(id);
    if (!result) {
      return NextResponse.json({ error: 'Session nicht gefunden' }, { status: 404 });
    }
    
    const { sessionPath, publicationId } = result;
    
    // Lösche Session-Datei
    try {
      await fs.unlink(sessionPath);
    } catch {
      // Datei existiert nicht - trotzdem aus Index entfernen
    }
    
    // Entferne aus Index
    const index = await loadSessionsIndex(publicationId);
    index.sessions = index.sessions.filter(s => s.id !== id);
    await saveSessionsIndex(publicationId, index);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Löschen der Session:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen der Session' }, { status: 500 });
  }
} 