import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const HISTORY_DIR = path.join(process.cwd(), 'data', 'chat-history');

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatHistory {
  mode: 'brainstorming' | 'writing';
  messages: Message[];
  lastUpdated: string;
}

// Stelle sicher, dass das Verzeichnis existiert
async function ensureHistoryDir() {
  try {
    await fs.access(HISTORY_DIR);
  } catch {
    await fs.mkdir(HISTORY_DIR, { recursive: true });
  }
}

// GET: Lade Chat-Historie für einen Modus
export async function GET(request: NextRequest) {
  try {
    await ensureHistoryDir();
    
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    
    if (!mode || !['brainstorming', 'writing'].includes(mode)) {
      return NextResponse.json({ error: 'Ungültiger Modus' }, { status: 400 });
    }

    const fileName = `${mode}.json`;
    const filePath = path.join(HISTORY_DIR, fileName);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const history: ChatHistory = JSON.parse(content);
      return NextResponse.json(history);
    } catch {
      // Datei existiert nicht, gib leere Historie zurück
      const emptyHistory: ChatHistory = {
        mode: mode as 'brainstorming' | 'writing',
        messages: [],
        lastUpdated: new Date().toISOString(),
      };
      return NextResponse.json(emptyHistory);
    }
  } catch (error) {
    console.error('Fehler beim Laden der Chat-Historie:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Historie' }, { status: 500 });
  }
}

// POST: Speichere Chat-Historie für einen Modus
export async function POST(request: NextRequest) {
  try {
    await ensureHistoryDir();
    
    const { mode, messages } = await request.json();
    
    if (!mode || !['brainstorming', 'writing'].includes(mode)) {
      return NextResponse.json({ error: 'Ungültiger Modus' }, { status: 400 });
    }

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'Nachrichten müssen ein Array sein' }, { status: 400 });
    }

    const fileName = `${mode}.json`;
    const filePath = path.join(HISTORY_DIR, fileName);

    const history: ChatHistory = {
      mode,
      messages,
      lastUpdated: new Date().toISOString(),
    };

    await fs.writeFile(filePath, JSON.stringify(history, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Speichern der Chat-Historie:', error);
    return NextResponse.json({ error: 'Fehler beim Speichern der Historie' }, { status: 500 });
  }
}

// DELETE: Lösche Chat-Historie für einen Modus
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    
    if (!mode || !['brainstorming', 'writing'].includes(mode)) {
      return NextResponse.json({ error: 'Ungültiger Modus' }, { status: 400 });
    }

    const fileName = `${mode}.json`;
    const filePath = path.join(HISTORY_DIR, fileName);

    try {
      await fs.unlink(filePath);
    } catch {
      // Datei existiert nicht - das ist okay
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Löschen der Chat-Historie:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen der Historie' }, { status: 500 });
  }
} 