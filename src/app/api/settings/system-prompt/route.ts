import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const GLOBAL_SETTINGS_DIR = path.join(DATA_DIR, 'settings');
const GLOBAL_SYSTEM_PROMPTS_FILE = path.join(GLOBAL_SETTINGS_DIR, 'system-prompts.json');

// Stelle sicher, dass das Verzeichnis existiert
async function ensureSettingsDir(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

function getPublicationSettingsFile(publicationId: string) {
  return path.join(DATA_DIR, 'publications', publicationId, 'settings', 'system-prompts.json');
}

// Standard-Prompts für beide Modi
const defaultPrompts = {
  brainstorming: 'Du bist ein kreativer Brainstorming-Partner für Geschichten und Welten. Hilf dabei, interessante Charaktere, faszinierende Orte, komplexe Welten und spannende Konzepte zu entwickeln. Stelle durchdachte Fragen, biete kreative Ideen und unterstütze bei der Ausarbeitung von Details für das Storytelling.',
  writing: 'Du bist ein kreativer und hilfsreicher Schreibpartner. Hilf dabei, fesselnde und gut strukturierte Geschichten zu entwickeln. Achte auf charakterliche Tiefe, atmosphärische Beschreibungen und eine kohärente Handlung. Unterstütze beim eigentlichen Schreibprozess mit konkreten Textvorschlägen.'
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('mode') as 'brainstorming' | 'writing';
    const publicationId = searchParams.get('publicationId');
    
    if (!mode || !['brainstorming', 'writing'].includes(mode)) {
      return NextResponse.json({ error: 'Ungültiger Mode-Parameter' }, { status: 400 });
    }
    
    let prompt = defaultPrompts[mode];
    
    if (publicationId) {
      // Versuche publikations-spezifische Prompts zu laden
      const publicationPromptsFile = getPublicationSettingsFile(publicationId);
      try {
        const content = await fs.readFile(publicationPromptsFile, 'utf-8');
        const data = JSON.parse(content);
        if (data.systemPrompts && data.systemPrompts[mode]) {
          prompt = data.systemPrompts[mode];
        }
      } catch {
        // Publikations-spezifische Prompts existieren nicht, nutze globale
      }
    }
    
    // Fallback zu globalen Prompts wenn publikations-spezifische nicht existieren
    if (prompt === defaultPrompts[mode]) {
      await ensureSettingsDir(GLOBAL_SETTINGS_DIR);
      try {
        const content = await fs.readFile(GLOBAL_SYSTEM_PROMPTS_FILE, 'utf-8');
        const data = JSON.parse(content);
        if (data[mode]) {
          prompt = data[mode];
        }
      } catch {
        // Globale Prompts existieren nicht, nutze Defaults
      }
    }
    
    return NextResponse.json({ prompt });
  } catch (error) {
    console.error('Fehler beim Laden des System-Prompts:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Einstellungen' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, mode, publicationId } = await request.json();
    
    if (typeof prompt !== 'string' || !mode || !['brainstorming', 'writing'].includes(mode)) {
      return NextResponse.json({ error: 'Ungültige Parameter' }, { status: 400 });
    }

    if (publicationId) {
      // Speichere publikations-spezifische Prompts
      const publicationSettingsDir = path.join(DATA_DIR, 'publications', publicationId, 'settings');
      await ensureSettingsDir(publicationSettingsDir);
      
      const publicationPromptsFile = getPublicationSettingsFile(publicationId);
      
      // Lade bestehende publikations-spezifische Prompts
      let data: any = {
        systemPrompts: { ...defaultPrompts },
        lastUpdated: new Date().toISOString()
      };
      
      try {
        const content = await fs.readFile(publicationPromptsFile, 'utf-8');
        data = { ...data, ...JSON.parse(content) };
      } catch {
        // Datei existiert nicht, verwende defaults
      }

      // Aktualisiere den spezifischen Prompt
      data.systemPrompts[mode as 'brainstorming' | 'writing'] = prompt;
      data.lastUpdated = new Date().toISOString();

      await fs.writeFile(publicationPromptsFile, JSON.stringify(data, null, 2), 'utf-8');
    } else {
      // Speichere globale Prompts (Backward Compatibility)
      await ensureSettingsDir(GLOBAL_SETTINGS_DIR);
      
      // Lade bestehende globale Prompts
      let data: any = { ...defaultPrompts };
      try {
        const content = await fs.readFile(GLOBAL_SYSTEM_PROMPTS_FILE, 'utf-8');
        data = { ...data, ...JSON.parse(content) };
      } catch {
        // Datei existiert nicht, verwende defaults
      }

      // Aktualisiere den spezifischen Prompt
      data[mode as 'brainstorming' | 'writing'] = prompt;
      data.updatedAt = new Date().toISOString();

      await fs.writeFile(GLOBAL_SYSTEM_PROMPTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Speichern des System-Prompts:', error);
    return NextResponse.json({ error: 'Fehler beim Speichern der Einstellungen' }, { status: 500 });
  }
} 