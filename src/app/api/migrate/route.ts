import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const HISTORY_DIR = path.join(process.cwd(), 'data', 'chat-history');
const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');

interface OldChatHistory {
  mode: 'brainstorming' | 'writing';
  messages: any[];
  lastUpdated: string;
}

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

// Stelle sicher, dass Sessions-Verzeichnis existiert
async function ensureSessionsDir() {
  try {
    await fs.access(SESSIONS_DIR);
  } catch {
    await fs.mkdir(SESSIONS_DIR, { recursive: true });
  }
}

// Speichere Sessions-Index
async function saveSessionsIndex(index: SessionsIndex) {
  const indexPath = path.join(SESSIONS_DIR, 'index.json');
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');
}

// Speichere Session
async function saveSession(session: ChatSession) {
  const sessionPath = path.join(SESSIONS_DIR, `${session.id}.json`);
  await fs.writeFile(sessionPath, JSON.stringify(session, null, 2), 'utf-8');
}

// POST: Migriere alte Chat-Historien zu Sessions
export async function POST() {
  try {
    await ensureSessionsDir();
    
    const migratedSessions: ChatSession[] = [];
    
    // Prüfe auf bestehende Brainstorming-Historie
    const brainstormingPath = path.join(HISTORY_DIR, 'brainstorming.json');
    try {
      const brainstormingContent = await fs.readFile(brainstormingPath, 'utf-8');
      const brainstormingHistory: OldChatHistory = JSON.parse(brainstormingContent);
      
      if (brainstormingHistory.messages && brainstormingHistory.messages.length > 0) {
        const brainstormingSession: ChatSession = {
          id: `migrated-brainstorming-${Date.now()}`,
          name: 'Brainstorming Session (migriert)',
          mode: 'brainstorming',
          messages: brainstormingHistory.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp || Date.now())
          })),
          createdAt: brainstormingHistory.lastUpdated || new Date().toISOString(),
          lastUpdated: brainstormingHistory.lastUpdated || new Date().toISOString(),
          messageCount: brainstormingHistory.messages.length,
        };
        
        await saveSession(brainstormingSession);
        migratedSessions.push({
          ...brainstormingSession,
          messages: [], // Index ohne Nachrichten
        });
      }
    } catch {
      // Keine Brainstorming-Historie gefunden
    }
    
    // Prüfe auf bestehende Writing-Historie
    const writingPath = path.join(HISTORY_DIR, 'writing.json');
    try {
      const writingContent = await fs.readFile(writingPath, 'utf-8');
      const writingHistory: OldChatHistory = JSON.parse(writingContent);
      
      if (writingHistory.messages && writingHistory.messages.length > 0) {
        const writingSession: ChatSession = {
          id: `migrated-writing-${Date.now() + 1}`,
          name: 'Schreib-Session (migriert)',
          mode: 'writing',
          messages: writingHistory.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp || Date.now())
          })),
          createdAt: writingHistory.lastUpdated || new Date().toISOString(),
          lastUpdated: writingHistory.lastUpdated || new Date().toISOString(),
          messageCount: writingHistory.messages.length,
        };
        
        await saveSession(writingSession);
        migratedSessions.push({
          ...writingSession,
          messages: [], // Index ohne Nachrichten
        });
      }
    } catch {
      // Keine Writing-Historie gefunden
    }
    
    // Erstelle oder aktualisiere Sessions-Index
    if (migratedSessions.length > 0) {
      const index: SessionsIndex = {
        sessions: migratedSessions,
        lastUpdated: new Date().toISOString(),
      };
      
      await saveSessionsIndex(index);
      
      return NextResponse.json({
        success: true,
        migratedSessions: migratedSessions.length,
        sessions: migratedSessions,
      });
    } else {
      return NextResponse.json({
        success: true,
        migratedSessions: 0,
        message: 'Keine Chat-Historien zum Migrieren gefunden',
      });
    }
  } catch (error) {
    console.error('Fehler bei der Migration:', error);
    return NextResponse.json({ error: 'Fehler bei der Migration' }, { status: 500 });
  }
}

// GET: Prüfe ob Migration notwendig ist
export async function GET() {
  try {
    // Prüfe ob alte Historien existieren
    const brainstormingExists = await fs.access(path.join(HISTORY_DIR, 'brainstorming.json')).then(() => true).catch(() => false);
    const writingExists = await fs.access(path.join(HISTORY_DIR, 'writing.json')).then(() => true).catch(() => false);
    
    // Prüfe ob Sessions bereits existieren
    const sessionsIndexExists = await fs.access(path.join(SESSIONS_DIR, 'index.json')).then(() => true).catch(() => false);
    
    return NextResponse.json({
      needsMigration: (brainstormingExists || writingExists) && !sessionsIndexExists,
      oldHistoriesFound: brainstormingExists || writingExists,
      sessionsExist: sessionsIndexExists,
    });
  } catch (error) {
    console.error('Fehler bei der Migrations-Prüfung:', error);
    return NextResponse.json({ error: 'Fehler bei der Migrations-Prüfung' }, { status: 500 });
  }
} 