'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Search, Star, Zap, DollarSign, Cpu, X, RefreshCw } from 'lucide-react';

interface ModelInfo {
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

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  mode?: 'brainstorming' | 'writing';
}

const categoryInfo = {
  general: { label: 'Allgemein', icon: '🤖', color: 'blue' },
  creative: { label: 'Creative Writing', icon: '✍️', color: 'purple' },
  nsfw: { label: 'NSFW', icon: '🔓', color: 'red' },
  budget: { label: 'Andere', icon: '💰', color: 'green' }
};

const formatCost = (cost: number) => {
  if (cost === 0) return 'Kostenlos';
  if (cost < 0.001) return `$${(cost * 1000000).toFixed(1)}/1M`;
  return `$${cost.toFixed(4)}/1K`;
};

export default function ModelSelector({ selectedModel, onModelChange, mode }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Lade Modelle beim ersten Öffnen
  useEffect(() => {
    if (isOpen && models.length === 0) {
      loadModels();
    }
  }, [isOpen]);

  const loadModels = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = `/api/models${forceRefresh ? '?refresh=true' : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Modelle');
      }
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      }
      
      setModels(data.models || []);
    } catch (error) {
      console.error('Fehler beim Laden der Modelle:', error);
      setError('Modelle konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  // Filtere Modelle basierend auf Suchbegriff und Kategorie
  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || model.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Gruppiere Modelle nach Kategorien für bessere Übersicht
  const groupedModels = filteredModels.reduce((groups, model) => {
    const category = model.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(model);
    return groups;
  }, {} as Record<string, ModelInfo[]>);

  const selectedModelInfo = models.find(m => m.id === selectedModel);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between min-w-[250px] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {selectedModelInfo?.isRecommended && <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />}
          <span className="truncate">
            {selectedModelInfo?.name || selectedModel.split('/').pop() || 'Modell auswählen'}
          </span>
          {selectedModelInfo && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
              ({selectedModelInfo.provider})
            </span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[500px] overflow-hidden">
          {/* Header mit Suche und Filtern */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Modell auswählen
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => loadModels(true)}
                  disabled={loading}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Modelle aktualisieren"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Suchfeld */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Modell suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Alle Kategorien</option>
                {Object.entries(categoryInfo).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.icon} {info.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Modell-Liste */}
          <div className="max-h-[350px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                Lade Modelle...
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-600 dark:text-red-400">
                <p>{error}</p>
                <button
                  onClick={() => loadModels(true)}
                  className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Erneut versuchen
                </button>
              </div>
            ) : filteredModels.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Keine Modelle gefunden
              </div>
            ) : (
              <div className="p-2">
                {/* Alle Modelle nach Kategorien */}
                {Object.entries(groupedModels).map(([category, categoryModels]) => {
                  const categoryConfig = categoryInfo[category as keyof typeof categoryInfo];
                  return (
                    <div key={category} className="mb-4">
                      <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 px-2 py-1 mb-2">
                        {categoryConfig?.icon} {categoryConfig?.label} ({categoryModels.length})
                      </h4>
                      {categoryModels.map(model => (
                        <ModelItem
                          key={model.id}
                          model={model}
                          isSelected={selectedModel === model.id}
                          onSelect={(modelId) => {
                            onModelChange(modelId);
                            setIsOpen(false);
                          }}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ModelItemProps {
  model: ModelInfo;
  isSelected: boolean;
  onSelect: (modelId: string) => void;
}

function ModelItem({ model, isSelected, onSelect }: ModelItemProps) {
  return (
    <button
      onClick={() => onSelect(model.id)}
      className={`w-full text-left p-3 rounded-md transition-colors ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            {model.isRecommended && <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />}
            <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
              {model.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
              {model.provider}
            </span>
          </div>
          
          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
            {model.description}
          </p>
          
          {/* Tags */}
          {model.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {model.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
              {model.tags.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{model.tags.length - 3} mehr
                </span>
              )}
            </div>
          )}
          
          {/* Preise und Kontext */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <DollarSign className="h-3 w-3" />
                <span>{formatCost(model.pricing.prompt)}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Cpu className="h-3 w-3" />
                <span>{(model.contextLength / 1000).toFixed(0)}K</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
} 