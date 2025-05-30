'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, User, MapPin, Book, Edit, Trash2, Save, X, Globe, Scale, Sparkles, Wrench, Theater, Scroll } from 'lucide-react';

interface ContextFile {
  id: string;
  name: string;
  type: 'character' | 'place' | 'object' | 'story' | 'world' | 'rule' | 'magic' | 'technology' | 'culture' | 'history' | 'chapter' | 'other' | 'location';
  content: string;
  lastModified: Date;
}

const typeIcons = {
  character: User,
  place: MapPin,
  location: MapPin,
  object: FileText,
  story: Book,
  world: Globe,
  rule: Scale,
  magic: Sparkles,
  technology: Wrench,
  culture: Theater,
  history: Scroll,
  chapter: Book,
  other: FileText,
};

const typeLabels = {
  character: 'Charakter',
  place: 'Ort',
  location: 'Ort',
  object: 'Objekt',
  story: 'Geschichte',
  world: 'Welt',
  rule: 'Regel/System',
  magic: 'Magie',
  technology: 'Technologie',
  culture: 'Kultur',
  history: 'Geschichte',
  chapter: 'Kapitel',
  other: 'Sonstiges',
};

interface ContextPanelProps {
  currentPublicationId: string | null;
  currentMode: 'brainstorming' | 'writing';
  contextUpdateTrigger?: number;
}

export default function ContextPanel({ currentPublicationId, currentMode, contextUpdateTrigger }: ContextPanelProps) {
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newFile, setNewFile] = useState({ name: '', type: 'character' as const, content: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Lade Kontext-Dateien beim Start und wenn sich die Publikation ändert
  useEffect(() => {
    // Setze alle States zurück beim Publikationswechsel
    setIsCreating(false);
    setEditingId(null);
    setNewFile({ name: '', type: 'character', content: '' });

    // Setze Daten sofort zurück wenn keine Publikation ausgewählt ist
    if (!currentPublicationId) {
      setContextFiles([]);
      setIsLoading(false);
      return;
    }

    // Lade neue Daten für die ausgewählte Publikation
    loadContextFiles();
  }, [currentPublicationId]);

  // Lade Kontext-Dateien neu wenn externe Updates stattfinden
  useEffect(() => {
    if (contextUpdateTrigger && currentPublicationId) {
      loadContextFiles();
    }
  }, [contextUpdateTrigger, currentPublicationId]);

  const loadContextFiles = async () => {
    if (!currentPublicationId) {
      setContextFiles([]);
      return;
    }

    setIsLoading(true);
    const publicationIdAtStart = currentPublicationId;

    try {
      const response = await fetch(`/api/context?publicationId=${currentPublicationId}`);
      
      // Race-Condition-Check: Nur setzen wenn Publikation nicht gewechselt hat
      if (publicationIdAtStart !== currentPublicationId) {
        return;
      }

      if (response.ok) {
        const files = await response.json();
        setContextFiles(files);
      } else {
        setContextFiles([]);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Kontext-Dateien:', error);
      // Nur bei Fehler leeren wenn noch die gleiche Publikation
      if (publicationIdAtStart === currentPublicationId) {
        setContextFiles([]);
      }
    } finally {
      // Nur Loading-State setzen wenn noch die gleiche Publikation
      if (publicationIdAtStart === currentPublicationId) {
        setIsLoading(false);
      }
    }
  };

  const saveContextFile = async (file: Omit<ContextFile, 'id' | 'lastModified'>) => {
    if (!currentPublicationId) return;

    try {
      const response = await fetch('/api/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...file,
          publicationId: currentPublicationId
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Sofortige UI-Updates
        setIsCreating(false);
        setNewFile({ name: '', type: 'character', content: '' });
        
        // Lade die Liste neu um sicherzustellen dass sie aktuell ist
        await loadContextFiles();
        
        // Falls das nicht funktioniert, füge die neue Datei manuell hinzu
        if (result.file) {
          setContextFiles(prevFiles => {
            // Prüfe ob die Datei bereits existiert
            const exists = prevFiles.some(f => f.id === result.file.id);
            if (!exists) {
              return [...prevFiles, result.file];
            }
            return prevFiles;
          });
        }
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    }
  };

  const updateContextFile = async (id: string, updates: Partial<ContextFile>) => {
    try {
      const response = await fetch(`/api/context/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        await loadContextFiles();
        setEditingId(null);
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
    }
  };

  const deleteContextFile = async (id: string) => {
    if (!confirm('Möchten Sie diese Datei wirklich löschen?')) return;
    
    try {
      const response = await fetch(`/api/context/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await loadContextFiles();
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    }
  };

  // Filter Kontextdateien basierend auf dem aktuellen Modus
  const filteredContextFiles = contextFiles.filter(file => {
    if (currentMode === 'brainstorming') {
      // Im Brainstorming-Modus: Alle außer Kapitel anzeigen
      return file.type !== 'chapter';
    } else {
      // Im Writing-Modus: Alle Dateien anzeigen
      return true;
    }
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Kontext-Dateien
          </h2>
          <button
            onClick={() => setIsCreating(true)}
            disabled={!currentPublicationId}
            className={`p-2 transition-colors ${
              currentPublicationId
                ? 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
                : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
            title={currentPublicationId ? "Neue Kontext-Datei erstellen" : "Wählen Sie zuerst eine Publikation aus"}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!currentPublicationId ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Keine Publikation ausgewählt</p>
            <p className="text-xs mt-1">Wählen Sie zuerst eine Publikation aus</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50 animate-pulse" />
            <p className="text-sm">Lade Kontext-Dateien...</p>
          </div>
        ) : (
          <>
            {/* Neue Datei erstellen */}
            {isCreating && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Dateiname"
                    value={newFile.name}
                    onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <select
                    value={newFile.type}
                    onChange={(e) => setNewFile({ ...newFile, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    {Object.entries(typeLabels)
                      .filter(([key]) => key !== 'location' && key !== 'chapter') // Exclude backward compatibility key and chapter (chapters are created from writing mode)
                      .map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                  </select>
                  <textarea
                    placeholder="Inhalt..."
                    value={newFile.content}
                    onChange={(e) => setNewFile({ ...newFile, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm h-24 resize-none"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => saveContextFile(newFile)}
                      disabled={!newFile.name.trim()}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      <span>Speichern</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setNewFile({ name: '', type: 'character', content: '' });
                      }}
                      className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      <span>Abbrechen</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Separate Kapitel-Sektion - nur im Writing-Modus */}
            {currentMode === 'writing' && contextFiles.filter(file => file.type === 'chapter').length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Book className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                    Geschriebene Kapitel
                  </h3>
                  <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                    {contextFiles.filter(file => file.type === 'chapter').length}
                  </span>
                </div>
                <div className="space-y-3">
                  {contextFiles
                    .filter(file => file.type === 'chapter')
                    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
                    .map((file) => {
                      const Icon = typeIcons[file.type as keyof typeof typeIcons] || FileText;
                      const typeLabel = typeLabels[file.type as keyof typeof typeLabels] || 'Unbekannt';
                      const isEditing = editingId === file.id;

                      return (
                        <div key={file.id} className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Icon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={file.name}
                                  onChange={(e) => setContextFiles(files => 
                                    files.map(f => f.id === file.id ? { ...f, name: e.target.value } : f)
                                  )}
                                  className="text-sm font-medium bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-600 rounded px-2 py-1 text-gray-900 dark:text-white"
                                />
                              ) : (
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {file.name}
                                </h4>
                              )}
                              <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2 py-1 rounded">
                                {typeLabel}
                              </span>
                            </div>
                            <div className="flex space-x-1">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => updateContextFile(file.id, { name: file.name, content: file.content })}
                                    className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                                    title="Speichern"
                                  >
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingId(null);
                                      loadContextFiles();
                                    }}
                                    className="p-1 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                                    title="Abbrechen"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setEditingId(file.id)}
                                    className="p-1 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                                    title="Bearbeiten"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteContextFile(file.id)}
                                    className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                    title="Löschen"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {isEditing ? (
                            <textarea
                              value={file.content}
                              onChange={(e) => setContextFiles(files => 
                                files.map(f => f.id === file.id ? { ...f, content: e.target.value } : f)
                              )}
                              className="w-full text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-600 rounded px-2 py-2 h-32 resize-none"
                            />
                          ) : (
                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4">
                              {file.content || 'Noch kein Inhalt...'}
                            </p>
                          )}
                          
                          <div className="mt-2 text-xs text-purple-500 dark:text-purple-400">
                            Zuletzt geändert: {new Date(file.lastModified).toLocaleDateString('de-DE')}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Kontext-Dateien - nur im Brainstorming-Modus */}
            {currentMode === 'brainstorming' && filteredContextFiles.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                    Kontext-Dateien
                  </h3>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                    {filteredContextFiles.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {filteredContextFiles
                    .map((file) => {
                      // Safe icon lookup with fallback
                      const Icon = typeIcons[file.type as keyof typeof typeIcons] || FileText;
                      const typeLabel = typeLabels[file.type as keyof typeof typeLabels] || 'Unbekannt';
                      const isEditing = editingId === file.id;

                      return (
                        <div key={file.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={file.name}
                                  onChange={(e) => setContextFiles(files => 
                                    files.map(f => f.id === file.id ? { ...f, name: e.target.value } : f)
                                  )}
                                  className="text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-900 dark:text-white"
                                />
                              ) : (
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {file.name}
                                </h4>
                              )}
                              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                                {typeLabel}
                              </span>
                            </div>
                            <div className="flex space-x-1">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => updateContextFile(file.id, { name: file.name, content: file.content })}
                                    className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                                    title="Speichern"
                                  >
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingId(null);
                                      loadContextFiles();
                                    }}
                                    className="p-1 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                                    title="Abbrechen"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setEditingId(file.id)}
                                    className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                    title="Bearbeiten"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteContextFile(file.id)}
                                    className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                    title="Löschen"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {isEditing ? (
                            <textarea
                              value={file.content}
                              onChange={(e) => setContextFiles(files => 
                                files.map(f => f.id === file.id ? { ...f, content: e.target.value } : f)
                              )}
                              className="w-full text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-2 h-24 resize-none"
                            />
                          ) : (
                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                              {file.content || 'Noch kein Inhalt...'}
                            </p>
                          )}
                          
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Zuletzt geändert: {new Date(file.lastModified).toLocaleDateString('de-DE')}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Keine Dateien Nachricht - modusabhängig */}
            {((currentMode === 'brainstorming' && filteredContextFiles.length === 0) || 
              (currentMode === 'writing' && contextFiles.filter(file => file.type === 'chapter').length === 0)) && 
              !isCreating && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {currentMode === 'brainstorming' 
                    ? 'Noch keine Kontext-Dateien erstellt' 
                    : 'Noch keine Kapitel geschrieben'
                  }
                </p>
                <p className="text-xs mt-1">Klicken Sie auf + um zu beginnen</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 