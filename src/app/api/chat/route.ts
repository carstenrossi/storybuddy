import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://storybuddy.app',
    'X-Title': 'Storybuddy',
  },
});

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Lade alle Kontext-Dateien für eine spezifische Publikation
async function loadContextFiles(publicationId: string) {
  try {
    const contextDir = path.join(process.cwd(), 'data', 'publications', publicationId, 'context');
    await fs.access(contextDir);
    const files = await fs.readdir(contextDir);
    const contextFiles = [];

    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(contextDir, file);
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
    const { message, mode, systemPrompt, publicationId, conversationHistory, model } = await request.json();

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'API-Schlüssel nicht konfiguriert. Bitte setzen Sie OPENROUTER_API_KEY als Umgebungsvariable.' },
        { status: 500 }
      );
    }

    if (!message || !mode || !publicationId) {
      return NextResponse.json({ error: 'Nachricht, Modus und PublikationId sind erforderlich' }, { status: 400 });
    }

    // Lade Kontext-Dateien für die spezifische Publikation
    const contextFiles = await loadContextFiles(publicationId);
    const contextString = buildContextString(contextFiles);

    // Baue System-Prompt
    const finalSystemPrompt = buildSystemPrompt(mode, systemPrompt, contextString);

    // Konvertiere Konversationshistorie für OpenAI
    const messages = [
      {
        role: 'system' as const,
        content: finalSystemPrompt,
      },
      ...(conversationHistory || []).map((msg: Message) => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: message,
      },
    ];

    // Rufe OpenRouter API auf mit dem gewählten Modell
    const response = await openai.chat.completions.create({
      model: model || 'anthropic/claude-3.5-sonnet:beta', // Fallback auf Standard-Modell
      max_tokens: 4000,
      temperature: 0.7,
      messages: messages.slice(-11), // Begrenze auf letzte 10 Nachrichten + System-Prompt für Kontext-Effizienz
    });

    const assistantMessage = response.choices[0].message;
    
    if (assistantMessage.role !== 'assistant') {
      throw new Error('Unerwarteter Antworttyp von OpenRouter');
    }

    return NextResponse.json({
      response: assistantMessage.content,
      contextFilesCount: contextFiles.length,
    });

  } catch (error) {
    console.error('Fehler in Chat API:', error);
    
    if (error instanceof OpenAI.AuthenticationError) {
      return NextResponse.json(
        { error: 'Authentifizierungsfehler. Bitte überprüfen Sie Ihren API-Schlüssel.' },
        { status: 401 }
      );
    }
    
    if (error instanceof OpenAI.RateLimitError) {
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