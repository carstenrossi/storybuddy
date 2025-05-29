import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTEXT_DIR = path.join(process.cwd(), 'data', 'context');

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const fileName = `${id}.md`;
    const filePath = path.join(CONTEXT_DIR, fileName);

    // Prüfe ob Datei existiert
    try {
      await fs.access(filePath);
    } catch {
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
    const fileName = `${id}.md`;
    const filePath = path.join(CONTEXT_DIR, fileName);

    // Prüfe ob Datei existiert
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: 'Datei nicht gefunden' }, { status: 404 });
    }

    await fs.unlink(filePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Löschen der Kontext-Datei:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen der Datei' }, { status: 500 });
  }
} 