import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTEXT_DIR = path.join(process.cwd(), 'data', 'context');

// Stelle sicher, dass das Verzeichnis existiert
async function ensureContextDir() {
  try {
    await fs.access(CONTEXT_DIR);
  } catch {
    await fs.mkdir(CONTEXT_DIR, { recursive: true });
  }
}

export async function GET() {
  try {
    await ensureContextDir();
    
    const files = await fs.readdir(CONTEXT_DIR);
    const contextFiles = [];

    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(CONTEXT_DIR, file);
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
    await ensureContextDir();
    
    const { name, type, content } = await request.json();
    
    if (!name || !type) {
      return NextResponse.json({ error: 'Name und Typ sind erforderlich' }, { status: 400 });
    }

    const id = Date.now().toString();
    const fileName = `${id}.md`;
    const filePath = path.join(CONTEXT_DIR, fileName);

    const frontMatter = {
      name,
      type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const fileContent = matter.stringify(content || '', frontMatter);
    
    await fs.writeFile(filePath, fileContent, 'utf-8');

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Fehler beim Speichern der Kontext-Datei:', error);
    return NextResponse.json({ error: 'Fehler beim Speichern der Datei' }, { status: 500 });
  }
} 