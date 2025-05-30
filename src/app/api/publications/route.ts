import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PUBLICATIONS_DIR = path.join(DATA_DIR, 'publications');
const INDEX_FILE = path.join(PUBLICATIONS_DIR, 'index.json');

interface Publication {
  id: string;
  title: string;
  description: string;
  genre: string;
  createdAt: string;
  updatedAt: string;
  sessionsCount: number;
  contextCount: number;
}

interface PublicationsIndex {
  publications: Publication[];
  activePublicationId: string | null;
  lastUpdated: string;
}

function ensureDirectoryExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getPublicationsIndex(): PublicationsIndex {
  ensureDirectoryExists(PUBLICATIONS_DIR);
  
  if (!fs.existsSync(INDEX_FILE)) {
    const defaultIndex: PublicationsIndex = {
      publications: [],
      activePublicationId: null,
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(INDEX_FILE, JSON.stringify(defaultIndex, null, 2));
    return defaultIndex;
  }
  
  return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
}

function savePublicationsIndex(index: PublicationsIndex) {
  index.lastUpdated = new Date().toISOString();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
}

function createPublicationStructure(publicationId: string) {
  const publicationDir = path.join(PUBLICATIONS_DIR, publicationId);
  const contextDir = path.join(publicationDir, 'context');
  const sessionsDir = path.join(publicationDir, 'sessions');
  const settingsDir = path.join(publicationDir, 'settings');
  
  ensureDirectoryExists(publicationDir);
  ensureDirectoryExists(contextDir);
  ensureDirectoryExists(sessionsDir);
  ensureDirectoryExists(settingsDir);
  
  // Erstelle Metadaten-Datei
  const metadata = {
    id: publicationId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(publicationDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
  
  // Erstelle leere Sessions-Index
  const sessionsIndex = {
    sessions: [],
    lastUpdated: new Date().toISOString()
  };
  fs.writeFileSync(path.join(sessionsDir, 'index.json'), JSON.stringify(sessionsIndex, null, 2));
  
  // Erstelle Standard-Settings
  const settings = {
    systemPrompts: {
      brainstorming: "",
      writing: ""
    },
    lastUpdated: new Date().toISOString()
  };
  fs.writeFileSync(path.join(settingsDir, 'system-prompts.json'), JSON.stringify(settings, null, 2));
}

function getPublicationStats(publicationId: string) {
  const publicationDir = path.join(PUBLICATIONS_DIR, publicationId);
  const contextDir = path.join(publicationDir, 'context');
  const sessionsFile = path.join(publicationDir, 'sessions', 'index.json');
  
  let contextCount = 0;
  let sessionsCount = 0;
  
  if (fs.existsSync(contextDir)) {
    contextCount = fs.readdirSync(contextDir).filter(file => file.endsWith('.md')).length;
  }
  
  if (fs.existsSync(sessionsFile)) {
    const sessionsData = JSON.parse(fs.readFileSync(sessionsFile, 'utf8'));
    sessionsCount = sessionsData.sessions.length;
  }
  
  return { contextCount, sessionsCount };
}

export async function GET() {
  try {
    const index = getPublicationsIndex();
    
    // Aktualisiere Statistiken für jede Publikation
    const updatedPublications = index.publications.map(pub => {
      const stats = getPublicationStats(pub.id);
      return { ...pub, ...stats };
    });
    
    return NextResponse.json({
      publications: updatedPublications,
      activePublicationId: index.activePublicationId
    });
  } catch (error) {
    console.error('Publications GET error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, genre } = await request.json();
    
    if (!title || !description) {
      return NextResponse.json({ error: 'Titel und Beschreibung sind erforderlich' }, { status: 400 });
    }
    
    const publicationId = Date.now().toString();
    const now = new Date().toISOString();
    
    const newPublication: Publication = {
      id: publicationId,
      title,
      description,
      genre: genre || 'Unbekannt',
      createdAt: now,
      updatedAt: now,
      sessionsCount: 0,
      contextCount: 0
    };
    
    // Erstelle Publikations-Struktur
    createPublicationStructure(publicationId);
    
    // Aktualisiere Index
    const index = getPublicationsIndex();
    index.publications.push(newPublication);
    
    // Setze als aktive Publikation wenn es die erste ist
    if (index.publications.length === 1) {
      index.activePublicationId = publicationId;
    }
    
    savePublicationsIndex(index);
    
    return NextResponse.json(newPublication, { status: 201 });
  } catch (error) {
    console.error('Publications POST error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
} 