import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://storybuddy.app',
    'X-Title': 'Storybuddy',
  },
});

interface OpenRouterModel {
  id: string;
  name: string;
  created: number;
  description: string;
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type?: string;
    input_modalities?: string[];
  };
  pricing: {
    prompt: string;
    completion: string;
    image?: string;
    request?: string;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens: number;
    is_moderated: boolean;
  };
  per_request_limits: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

interface ProcessedModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  category: string;
  pricing: {
    prompt: number;
    completion: number;
  };
  contextLength: number;
  isModerated: boolean;
  isRecommended: boolean;
  tags: string[];
}

// Cache für Modelle (1 Stunde)
let modelsCache: ProcessedModel[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 Stunde

function categorizeModel(model: OpenRouterModel): string {
  const id = model.id.toLowerCase();
  const name = model.name.toLowerCase();
  const description = model.description.toLowerCase();
  
  // Allgemein: Anthropic, OpenAI und Google Modelle
  if (model.id.startsWith('anthropic/') || 
      model.id.startsWith('openai/') || 
      model.id.startsWith('google/')) {
    return 'general';
  }
  
  // NSFW: Explizite NSFW-Modelle und bekannte uncensored Creative Writing Modelle
  if ((description.includes('nsfw') || 
      description.includes('erotic') || 
      description.includes('uncensored') ||
      // Bekannte NSFW/Uncensored Creative Writing Modelle
      id.includes('lumimaid') || 
      id.includes('noromaid') || 
      id.includes('toppy') ||
      id.includes('mythomax') ||
      id.includes('fimbulvetr') ||
      id.includes('midnight') ||
      id.includes('spicyboros') ||
      (id.includes('dolphin') && description.includes('uncensored')) ||
      model.id.startsWith('neversleep/') ||
      model.id.startsWith('nothingiisreal/')) &&
      // Ausschlüsse: Modelle die fälschlicherweise erkannt werden
      !model.id.startsWith('perplexity/')) {
    return 'nsfw';
  }
  
  // Creative Writing: wo Creative Writing in der Beschreibung steht
  if (description.includes('creative writing') || 
      description.includes('storytelling') || 
      description.includes('fiction') || 
      description.includes('narrative')) {
    return 'creative';
  }
  
  // Budget/Günstig als Default für alle anderen
  return 'budget';
}

function getModelTags(model: OpenRouterModel): string[] {
  const tags: string[] = [];
  const id = model.id.toLowerCase();
  const name = model.name.toLowerCase();
  const description = model.description.toLowerCase();
  
  // Performance tags
  if (model.context_length > 500000) tags.push('🚀 Sehr große Kontextlänge');
  else if (model.context_length > 200000) tags.push('📚 Große Kontextlänge');
  else if (model.context_length > 100000) tags.push('📄 Mittlere Kontextlänge');
  
  // Speed tags
  if (description.includes('fast') || description.includes('efficient') ||
      id.includes('mini') || id.includes('haiku') || name.includes('small')) {
    tags.push('⚡ Schnell');
  }
  
  // Quality tags
  if (description.includes('flagship') || description.includes('premium') || 
      description.includes('most advanced') || description.includes('largest')) {
    tags.push('👑 Premium Qualität');
  }
  
  // Special capabilities - nur bei expliziten Erwähnungen
  if (description.includes('creative writing') || description.includes('storytelling') ||
      description.includes('fiction') || id.includes('creative') || id.includes('story')) {
    tags.push('✍️ Kreatives Schreiben');
  }
  
  // Online/Search capabilities
  if (description.includes('online') || description.includes('search') ||
      description.includes('real-time') || description.includes('web search')) {
    tags.push('🌐 Online/Suche');
  }
  
  // Language support
  if (description.includes('multilingual') || description.includes('deutsch') ||
      description.includes('german')) {
    tags.push('🌍 Mehrsprachig');
  }
  
  return tags;
}

function getRecommendedModels(): string[] {
  return [
    'anthropic/claude-3.5-sonnet:beta',
    'anthropic/claude-3.5-haiku',
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'meta-llama/llama-3.1-405b-instruct',
    'google/gemini-pro-1.5',
    'mistralai/mistral-large',
    'qwen/qwen-2.5-72b-instruct',
    'liquid/lfm-40b',
    'nvidia/llama-3.1-nemotron-70b-instruct'
  ];
}

function processModel(model: OpenRouterModel): ProcessedModel | null {
  try {
    const nameParts = model.id.split('/');
    const provider = nameParts[0];
    const modelName = nameParts[1] || model.name;
    
    return {
      id: model.id,
      name: model.name || modelName,
      provider: provider.charAt(0).toUpperCase() + provider.slice(1),
      description: model.description || 'Keine Beschreibung verfügbar',
      category: categorizeModel(model),
      pricing: {
        prompt: parseFloat(model.pricing.prompt),
        completion: parseFloat(model.pricing.completion),
      },
      contextLength: model.context_length,
      isModerated: model.top_provider.is_moderated,
      isRecommended: getRecommendedModels().includes(model.id),
      tags: getModelTags(model),
    };
  } catch (error) {
    console.log(`⚠️ Fehler beim Verarbeiten von Modell ${model?.id}:`, error);
    return null;
  }
}

// Fallback-Modelle falls OpenRouter nicht verfügbar ist
function getFallbackModels(): ProcessedModel[] {
  return [
    {
      id: 'anthropic/claude-3.5-sonnet:beta',
      name: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      description: 'Sehr gut für kreatives Schreiben und komplexe Analysen',
      category: 'premium',
      pricing: { prompt: 0.003, completion: 0.015 },
      contextLength: 200000,
      isModerated: true,
      isRecommended: true,
      tags: ['👑 Premium Qualität', '✍️ Kreatives Schreiben', '📚 Große Kontextlänge']
    },
    {
      id: 'anthropic/claude-3.5-haiku',
      name: 'Claude 3.5 Haiku',
      provider: 'Anthropic',
      description: 'Schnell und effizient für einfachere Aufgaben',
      category: 'budget',
      pricing: { prompt: 0.0001, completion: 0.0005 },
      contextLength: 200000,
      isModerated: true,
      isRecommended: true,
      tags: ['⚡ Schnell', '💰 Sehr günstig', '📚 Große Kontextlänge']
    },
    {
      id: 'openai/gpt-4o',
      name: 'GPT-4o',
      provider: 'OpenAI',
      description: 'Vielseitig und stark in allen Bereichen',
      category: 'premium',
      pricing: { prompt: 0.005, completion: 0.015 },
      contextLength: 128000,
      isModerated: true,
      isRecommended: true,
      tags: ['👑 Premium Qualität', '✍️ Kreatives Schreiben']
    },
    {
      id: 'openai/gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'OpenAI',
      description: 'Kostengünstig und schnell',
      category: 'budget',
      pricing: { prompt: 0.00015, completion: 0.0006 },
      contextLength: 128000,
      isModerated: true,
      isRecommended: true,
      tags: ['⚡ Schnell', '💵 Günstig']
    },
    {
      id: 'meta-llama/llama-3.1-405b-instruct',
      name: 'Llama 3.1 405B',
      provider: 'Meta',
      description: 'Sehr großes Open-Source-Modell',
      category: 'premium',
      pricing: { prompt: 0.005, completion: 0.015 },
      contextLength: 131072,
      isModerated: false,
      isRecommended: true,
      tags: ['👑 Premium Qualität', '🔓 Ohne Zensur']
    },
    {
      id: 'google/gemini-pro-1.5',
      name: 'Gemini Pro 1.5',
      provider: 'Google',
      description: 'Googles fortschrittlichstes Modell',
      category: 'premium',
      pricing: { prompt: 0.00125, completion: 0.005 },
      contextLength: 2000000,
      isModerated: true,
      isRecommended: true,
      tags: ['👑 Premium Qualität', '🚀 Sehr große Kontextlänge']
    }
  ];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    // Prüfe Cache
    const now = Date.now();
    if (!forceRefresh && modelsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json({ 
        models: modelsCache,
        cached: true,
        cacheAge: Math.floor((now - cacheTimestamp) / 1000)
      });
    }

    // Überprüfe API-Schlüssel
    if (!process.env.OPENROUTER_API_KEY) {
      console.log('⚠️ OpenRouter API-Schlüssel nicht konfiguriert, verwende Fallback-Modelle');
      const fallbackModels = getFallbackModels();
      modelsCache = fallbackModels;
      cacheTimestamp = now;
      
      return NextResponse.json({ 
        models: fallbackModels,
        cached: false,
        totalModels: fallbackModels.length,
        fallback: true,
        reason: 'API-Schlüssel fehlt'
      });
    }

    console.log('🔄 Lade Modelle von OpenRouter...');

    // Lade Modelle von OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://storybuddy.app',
        'X-Title': 'Storybuddy',
      },
    });

    if (!response.ok) {
      console.log(`❌ OpenRouter API Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text().catch(() => 'Unknown error');
      console.log('Error details:', errorText);
      
      const fallbackModels = getFallbackModels();
      modelsCache = fallbackModels;
      cacheTimestamp = now;
      
      return NextResponse.json({ 
        models: fallbackModels,
        cached: false,
        totalModels: fallbackModels.length,
        fallback: true,
        reason: `OpenRouter API Error: ${response.status}`,
        error: errorText
      });
    }

    const data = await response.json();
    console.log(`📊 Erhalten: ${data.data?.length || 0} Modelle von OpenRouter`);
    
    if (!data.data || data.data.length === 0) {
      console.log('⚠️ Keine Modelle von OpenRouter erhalten, verwende Fallback-Modelle');
      const fallbackModels = getFallbackModels();
      modelsCache = fallbackModels;
      cacheTimestamp = now;
      
      return NextResponse.json({ 
        models: fallbackModels,
        cached: false,
        totalModels: fallbackModels.length,
        fallback: true,
        reason: 'Keine Modelle erhalten'
      });
    }
    
    // Verarbeite und filtere Modelle
    const processedModels: ProcessedModel[] = data.data
      .filter((model: OpenRouterModel) => {
        // Filtere nur Text-Modelle mit gültigen Preisen
        try {
          const isTextModel = model.architecture?.modality === 'text' || 
                             model.architecture?.modality === 'text->text' ||
                             model.architecture?.input_modalities?.includes('text');
          
          return isTextModel && 
                 model.context_length > 0 &&
                 model.pricing &&
                 (model.pricing.prompt !== null && model.pricing.prompt !== undefined);
        } catch (error) {
          console.log(`⚠️ Fehler beim Verarbeiten von Modell ${model.id}:`, error);
          return false;
        }
      })
      .map((model: OpenRouterModel) => processModel(model))
      .filter((model: ProcessedModel | null) => model && model.id) // Entferne null/undefined Modelle
      .sort((a: ProcessedModel, b: ProcessedModel) => {
        // Sortierung: Empfohlen zuerst, dann nach Name
        if (a.isRecommended && !b.isRecommended) return -1;
        if (!a.isRecommended && b.isRecommended) return 1;
        return a.name.localeCompare(b.name);
      });

    console.log(`✅ Erfolgreich ${processedModels.length} Modelle verarbeitet`);

    // Cache aktualisieren
    modelsCache = processedModels;
    cacheTimestamp = now;

    return NextResponse.json({ 
      models: processedModels,
      cached: false,
      totalModels: processedModels.length,
      source: 'openrouter'
    });

  } catch (error) {
    console.error('❌ Unerwarteter Fehler beim Laden der Modelle:', error);
    
    // Fallback auf gecachte Modelle wenn vorhanden
    if (modelsCache && modelsCache.length > 0) {
      console.log('🔄 Verwende gecachte Modelle als Fallback');
      return NextResponse.json({ 
        models: modelsCache,
        cached: true,
        totalModels: modelsCache.length,
        error: 'Aktuelle Daten nicht verfügbar, zeige gecachte Modelle'
      });
    }
    
    // Letzte Notfall-Fallback
    console.log('🆘 Verwende Fallback-Modelle wegen Fehler');
    const fallbackModels = getFallbackModels();
    
    return NextResponse.json({ 
      models: fallbackModels,
      cached: false,
      totalModels: fallbackModels.length,
      fallback: true,
      reason: 'Unerwarteter Fehler',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 