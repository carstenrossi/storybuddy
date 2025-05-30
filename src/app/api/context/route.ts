import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';

const DATA_DIR = path.join(process.cwd(), 'data');

// Stelle sicher, dass das Verzeichnis existiert
async function ensureContextDir(publicationId: string) {
  const contextDir = path.join(DATA_DIR, 'publications', publicationId, 'context');
  try {
    await fs.access(contextDir);
  } catch {
    await fs.mkdir(contextDir, { recursive: true });
  }
  return contextDir;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicationId = searchParams.get('publicationId');
    
    if (!publicationId) {
      return NextResponse.json({ error: 'publicationId ist erforderlich' }, { status: 400 });
    }

    const contextDir = await ensureContextDir(publicationId);
    
    const files = await fs.readdir(contextDir);
    const contextFiles = [];

    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(contextDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const { data, content: markdownContent } = matter(content);
        const stats = await fs.stat(filePath);

        contextFiles.push({
          id: path.parse(file).name,
          name: data.name || path.parse(file).name,
          type: data.type || 'other',
          content: markdownContent,
          lastModified: stats.mtime,
        });
      }
    }

    return NextResponse.json(contextFiles);
  } catch (error) {
    console.error('Fehler beim Laden der Kontext-Dateien:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Dateien' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, type, content, publicationId } = await request.json();
    
    if (!name || !type || !publicationId) {
      return NextResponse.json({ error: 'Name, Typ und publicationId sind erforderlich' }, { status: 400 });
    }

    const contextDir = await ensureContextDir(publicationId);

    const id = Date.now().toString();
    const fileName = `${id}.md`;
    const filePath = path.join(contextDir, fileName);

    const frontMatter = {
      name,
      type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const fileContent = matter.stringify(content || '', frontMatter);
    
    await fs.writeFile(filePath, fileContent, 'utf-8');

    // Erstelle die Datei-Info für die Antwort
    const stats = await fs.stat(filePath);
    const newFile = {
      id,
      name,
      type,
      content: content || '',
      lastModified: stats.mtime,
    };

    return NextResponse.json({ success: true, id, file: newFile });
  } catch (error) {
    console.error('Fehler beim Speichern der Kontext-Datei:', error);
    return NextResponse.json({ error: 'Fehler beim Speichern der Datei' }, { status: 500 });
  }
} 