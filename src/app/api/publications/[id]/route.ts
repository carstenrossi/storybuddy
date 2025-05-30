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

function getPublicationsIndex(): PublicationsIndex {
  if (!fs.existsSync(INDEX_FILE)) {
    throw new Error('Publications index not found');
  }
  return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
}

function savePublicationsIndex(index: PublicationsIndex) {
  index.lastUpdated = new Date().toISOString();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
}

function removeDirectory(dir: string) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  
  if (!id) {
    return NextResponse.json({ error: 'Ungültige Publikations-ID' }, { status: 400 });
  }
  
  try {
    const index = getPublicationsIndex();
    const publication = index.publications.find(pub => pub.id === id);
    
    if (!publication) {
      return NextResponse.json({ error: 'Publikation nicht gefunden' }, { status: 404 });
    }
    
    return NextResponse.json(publication);
  } catch (error) {
    console.error('Publication GET error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  
  if (!id) {
    return NextResponse.json({ error: 'Ungültige Publikations-ID' }, { status: 400 });
  }
  
  try {
    const { title, description, genre, setActive } = await request.json();
    const index = getPublicationsIndex();
    const publicationIndex = index.publications.findIndex(pub => pub.id === id);
    
    if (publicationIndex === -1) {
      return NextResponse.json({ error: 'Publikation nicht gefunden' }, { status: 404 });
    }
    
    // Aktualisiere Publikations-Daten
    if (title !== undefined) index.publications[publicationIndex].title = title;
    if (description !== undefined) index.publications[publicationIndex].description = description;
    if (genre !== undefined) index.publications[publicationIndex].genre = genre;
    index.publications[publicationIndex].updatedAt = new Date().toISOString();
    
    // Setze als aktive Publikation
    if (setActive === true) {
      index.activePublicationId = id;
    }
    
    savePublicationsIndex(index);
    return NextResponse.json(index.publications[publicationIndex]);
  } catch (error) {
    console.error('Publication PUT error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  
  if (!id) {
    return NextResponse.json({ error: 'Ungültige Publikations-ID' }, { status: 400 });
  }
  
  try {
    const index = getPublicationsIndex();
    const publicationIndex = index.publications.findIndex(pub => pub.id === id);
    
    if (publicationIndex === -1) {
      return NextResponse.json({ error: 'Publikation nicht gefunden' }, { status: 404 });
    }
    
    // Lösche Publikations-Ordner
    const publicationDir = path.join(PUBLICATIONS_DIR, id);
    removeDirectory(publicationDir);
    
    // Entferne aus Index
    index.publications.splice(publicationIndex, 1);
    
    // Wenn das die aktive Publikation war, setze neue aktive
    if (index.activePublicationId === id) {
      index.activePublicationId = index.publications.length > 0 ? index.publications[0].id : null;
    }
    
    savePublicationsIndex(index);
    return NextResponse.json({ message: 'Publikation gelöscht' });
  } catch (error) {
    console.error('Publication DELETE error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
} 