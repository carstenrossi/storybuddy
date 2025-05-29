import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const SETTINGS_DIR = path.join(process.cwd(), 'data', 'settings');
const SYSTEM_PROMPTS_FILE = path.join(SETTINGS_DIR, 'system-prompts.json');

// Stelle sicher, dass das Verzeichnis existiert
async function ensureSettingsDir() {
  try {
    await fs.access(SETTINGS_DIR);
  } catch {
    await fs.mkdir(SETTINGS_DIR, { recursive: true });
  }
}

// Standard-Prompts für beide Modi
const defaultPrompts = {
  brainstorming: 'Du bist ein kreativer Brainstorming-Partner für Geschichten und Welten. Hilf dabei, interessante Charaktere, faszinierende Orte, komplexe Welten und spannende Konzepte zu entwickeln. Stelle durchdachte Fragen, biete kreative Ideen und unterstütze bei der Ausarbeitung von Details für das Storytelling.',
  writing: 'Du bist ein kreativer und hilfsreicher Schreibpartner. Hilf dabei, fesselnde und gut strukturierte Geschichten zu entwickeln. Achte auf charakterliche Tiefe, atmosphärische Beschreibungen und eine kohärente Handlung. Unterstütze beim eigentlichen Schreibprozess mit konkreten Textvorschlägen.'
};

export async function GET(request: NextRequest) {
  try {
    await ensureSettingsDir();
    
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('mode') as 'brainstorming' | 'writing';
    
    if (!mode || !['brainstorming', 'writing'].includes(mode)) {
      return NextResponse.json({ error: 'Ungültiger Mode-Parameter' }, { status: 400 });
    }
    
    try {
      const content = await fs.readFile(SYSTEM_PROMPTS_FILE, 'utf-8');
      const data = JSON.parse(content);
      return NextResponse.json({ 
        prompt: data[mode] || defaultPrompts[mode] 
      });
    } catch {
      // Datei existiert nicht, gib Standard-Prompt zurück
      return NextResponse.json({ 
        prompt: defaultPrompts[mode]
      });
    }
  } catch (error) {
    console.error('Fehler beim Laden des System-Prompts:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Einstellungen' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureSettingsDir();
    
    const { prompt, mode } = await request.json();
    
    if (typeof prompt !== 'string' || !mode || !['brainstorming', 'writing'].includes(mode)) {
      return NextResponse.json({ error: 'Ungültige Parameter' }, { status: 400 });
    }

    // Lade bestehende Prompts
    let data: any = { ...defaultPrompts };
    try {
      const content = await fs.readFile(SYSTEM_PROMPTS_FILE, 'utf-8');
      data = { ...data, ...JSON.parse(content) };
    } catch {
      // Datei existiert nicht, verwende defaults
    }

    // Aktualisiere den spezifischen Prompt
    data[mode as 'brainstorming' | 'writing'] = prompt;
    data.updatedAt = new Date().toISOString();

    await fs.writeFile(SYSTEM_PROMPTS_FILE, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Speichern des System-Prompts:', error);
    return NextResponse.json({ error: 'Fehler beim Speichern der Einstellungen' }, { status: 500 });
  }
} 