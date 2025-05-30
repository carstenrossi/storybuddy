import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';

const DATA_DIR = path.join(process.cwd(), 'data');
const PUBLICATIONS_DIR = path.join(DATA_DIR, 'publications');

async function findContextFile(id: string): Promise<string | null> {
  try {
    // Suche durch alle Publikationen
    const publications = await fs.readdir(PUBLICATIONS_DIR);
    
    for (const publicationId of publications) {
      if (publicationId === 'index.json') continue;
      
      const contextDir = path.join(PUBLICATIONS_DIR, publicationId, 'context');
      const fileName = `${id}.md`;
      const filePath = path.join(contextDir, fileName);
      
      try {
        await fs.access(filePath);
        return filePath;
      } catch {
        // Datei nicht in dieser Publikation, weiter suchen
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Fehler beim Suchen der Context-Datei:', error);
    return null;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const filePath = await findContextFile(id);

    if (!filePath) {
      return NextResponse.json({ error: 'Datei nicht gefunden' }, { status: 404 });
    }

    const updates = await request.json();
    
    // Lade bestehende Datei
    const existingContent = await fs.readFile(filePath, 'utf-8');
    const { data: existingData, content: existingMarkdown } = matter(existingContent);

    // Aktualisiere Metadaten
    const updatedData = {
      ...existingData,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Verwende neuen Content oder behalte bestehenden
    const updatedContent = updates.content !== undefined ? updates.content : existingMarkdown;

    const newFileContent = matter.stringify(updatedContent, updatedData);
    
    await fs.writeFile(filePath, newFileContent, 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Kontext-Datei:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren der Datei' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const filePath = await findContextFile(id);

    if (!filePath) {
      return NextResponse.json({ error: 'Datei nicht gefunden' }, { status: 404 });
    }

    await fs.unlink(filePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Löschen der Kontext-Datei:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen der Datei' }, { status: 500 });
  }
} 