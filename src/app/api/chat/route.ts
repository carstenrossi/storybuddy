import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CONTEXT_DIR = path.join(process.cwd(), 'data', 'context');

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Lade alle Kontext-Dateien
async function loadContextFiles() {
  try {
    await fs.access(CONTEXT_DIR);
    const files = await fs.readdir(CONTEXT_DIR);
    const contextFiles = [];

    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(CONTEXT_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const { data, content: markdownContent } = matter(content);

        contextFiles.push({
          name: data.name || path.parse(file).name,
          type: data.type || 'other',
          content: markdownContent,
        });
      }
    }

    return contextFiles;
  } catch {
    return [];
  }
}

// Erstelle Kontext-String aus allen Dateien
function buildContextString(contextFiles: any[]) {
  if (contextFiles.length === 0) {
    return 'Noch keine Kontext-Informationen verfügbar.';
  }

  const typeLabels: { [key: string]: string } = {
    character: 'CHARAKTER',
    place: 'ORT',
    location: 'ORT', // Backward compatibility
    object: 'OBJEKT',
    story: 'GESCHICHTE',
    world: 'WELT',
    rule: 'REGEL/SYSTEM',
    magic: 'MAGIE',
    technology: 'TECHNOLOGIE',
    culture: 'KULTUR',
    history: 'GESCHICHTE',
    chapter: 'KAPITEL',
    other: 'KONTEXT',
  };

  // Separate chapters from other context files
  const chapters = contextFiles.filter(file => file.type === 'chapter');
  const otherContext = contextFiles.filter(file => file.type !== 'chapter');

  let contextString = '';

  // Add chapters section if any chapters exist
  if (chapters.length > 0) {
    contextString += '# GESCHRIEBENE KAPITEL\n\n';
    contextString += chapters
      .map(file => `## KAPITEL: ${file.name}\n\n${file.content}`)
      .join('\n\n---\n\n');
    
    if (otherContext.length > 0) {
      contextString += '\n\n===\n\n';
    }
  }

  // Add other context files
  if (otherContext.length > 0) {
    contextString += '# STORY-UNIVERSUM KONTEXT\n\n';
    contextString += otherContext
      .map(file => `## ${typeLabels[file.type] || 'KONTEXT'}: ${file.name}\n\n${file.content}`)
      .join('\n\n---\n\n');
  }

  return contextString;
}

// Erstelle den finalen System-Prompt basierend auf Modus und Kontext
function buildSystemPrompt(mode: 'brainstorming' | 'writing', contextString: string, customSystemPrompt?: string) {
  const defaultPrompts = {
    brainstorming: `Du bist ein kreativer Brainstorming-Partner für die Entwicklung von Story-Universen. Du hilfst dabei, Charaktere, Orte, Objekte, Geschichte, Geographie, Soziologie, Psychologie, Glaubenssysteme, Wissenschaft und Magie zu entwickeln.

DEINE AUFGABE:
- Stelle gezielte Fragen, um Ideen zu vertiefen
- Schlage kreative Erweiterungen vor
- Achte auf Konsistenz im Universum
- Entwickle Details, die das Universum lebendig machen
- Ermutige zur Exploration neuer Konzepte

STIL:
- Sei neugierig und inspirierend
- Stelle offene Fragen
- Biete konkrete Vorschläge an
- Denke in Zusammenhängen`,

    writing: `Du bist ein kreativer Schreibpartner. Du hilfst dabei, fesselnde Geschichten zu entwickeln, die im etablierten Universum spielen.

DEINE AUFGABE:
- Schreibe atmosphärische und charakterreiche Texte
- Achte auf Konsistenz mit dem bestehenden Universum
- Entwickle spannende Handlungsstränge
- Erschaffe lebendige Dialoge und Szenen
- Halte den etablierten Ton und Stil bei

STIL:
- Atmosphärisch und detailreich
- Charakterfokussiert
- Spannend und fesselnd
- Konsistent mit dem Universum`
  };

  // Verwende den benutzerdefinierten System-Prompt falls vorhanden, sonst den Standard
  const basePrompt = customSystemPrompt || defaultPrompts[mode];

  return `${basePrompt}

${contextString}

WICHTIG: Nutze die obigen Kontext-Informationen, um konsistente und zusammenhängende Antworten zu geben. Alle Charaktere, Orte und Konzepte sollten mit dem etablierten Universum übereinstimmen.`;
}

export async function POST(request: NextRequest) {
  try {
    const { message, mode, systemPrompt, conversationHistory } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'API-Schlüssel nicht konfiguriert. Bitte setzen Sie ANTHROPIC_API_KEY als Umgebungsvariable.' },
        { status: 500 }
      );
    }

    if (!message || !mode) {
      return NextResponse.json({ error: 'Nachricht und Modus sind erforderlich' }, { status: 400 });
    }

    // Lade Kontext-Dateien
    const contextFiles = await loadContextFiles();
    const contextString = buildContextString(contextFiles);

    // Baue System-Prompt
    const finalSystemPrompt = buildSystemPrompt(mode, contextString, systemPrompt);

    // Konvertiere Konversationshistorie für Claude
    const messages = [
      ...(conversationHistory || []).map((msg: Message) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      {
        role: 'user',
        content: message,
      },
    ];

    // Rufe Claude API auf
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.7,
      system: finalSystemPrompt,
      messages: messages.slice(-10), // Begrenze auf letzte 10 Nachrichten für Kontext-Effizienz
    });

    const assistantMessage = response.content[0];
    
    if (assistantMessage.type !== 'text') {
      throw new Error('Unerwarteter Antworttyp von Claude');
    }

    return NextResponse.json({
      response: assistantMessage.text,
      contextFilesCount: contextFiles.length,
    });

  } catch (error) {
    console.error('Fehler in Chat API:', error);
    
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: 'Authentifizierungsfehler. Bitte überprüfen Sie Ihren API-Schlüssel.' },
        { status: 401 }
      );
    }
    
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: 'Rate-Limit erreicht. Bitte versuchen Sie es später erneut.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' },
      { status: 500 }
    );
  }
} 