import React, { useState, useEffect } from 'react';
import { Plus, Settings, BookOpen, Trash2, Edit3 } from 'lucide-react';

interface Publication {
  id: string;
  title: string;
  description: string;
  genre: string;
  createdAt: string;
  updatedAt: string;
  sessionsCount: number;
  contextCount: number;
}

interface PublicationSelectorProps {
  onPublicationChange: (publicationId: string | null) => void;
  currentPublicationId: string | null;
}

export default function PublicationSelector({ onPublicationChange, currentPublicationId }: PublicationSelectorProps) {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showManagerDialog, setShowManagerDialog] = useState(false);
  const [editingPublication, setEditingPublication] = useState<Publication | null>(null);
  const [newPublication, setNewPublication] = useState({
    title: '',
    description: '',
    genre: ''
  });

  useEffect(() => {
    loadPublications();
  }, []);

  const loadPublications = async () => {
    try {
      const response = await fetch('/api/publications');
      const data = await response.json();
      setPublications(data.publications);
      
      // Wenn noch keine aktive Publikation gesetzt ist, aber Publikationen existieren
      if (!currentPublicationId && data.publications.length > 0 && data.activePublicationId) {
        onPublicationChange(data.activePublicationId);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Publikationen:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createPublication = async () => {
    if (!newPublication.title || !newPublication.description) return;

    try {
      const response = await fetch('/api/publications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPublication)
      });

      if (response.ok) {
        const publication = await response.json();
        setPublications(prev => [...prev, publication]);
        onPublicationChange(publication.id);
        setNewPublication({ title: '', description: '', genre: '' });
        setShowCreateDialog(false);
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Publikation:', error);
    }
  };

  const updatePublication = async (publicationId: string, updates: Partial<Publication> & { setActive?: boolean }) => {
    try {
      const response = await fetch(`/api/publications/${publicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedPublication = await response.json();
        setPublications(prev => prev.map(pub => 
          pub.id === publicationId ? updatedPublication : pub
        ));
        
        if (updates.setActive) {
          onPublicationChange(publicationId);
        }
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Publikation:', error);
    }
  };

  const deletePublication = async (publicationId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Publikation löschen möchten? Alle Daten gehen verloren.')) {
      return;
    }

    try {
      const response = await fetch(`/api/publications/${publicationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setPublications(prev => prev.filter(pub => pub.id !== publicationId));
        
        if (currentPublicationId === publicationId) {
          const remaining = publications.filter(pub => pub.id !== publicationId);
          onPublicationChange(remaining.length > 0 ? remaining[0].id : null);
        }
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Publikation:', error);
    }
  };

  const currentPublication = publications.find(pub => pub.id === currentPublicationId);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>Lade Publikationen...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {/* Aktuelle Publikation anzeigen */}
      {currentPublication ? (
        <div className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{currentPublication.title}</span>
            <span className="text-xs text-gray-500">
              {currentPublication.sessionsCount} Sessions • {currentPublication.contextCount} Kontext-Dateien
            </span>
          </div>
        </div>
      ) : (
        <div className="text-gray-500">Keine Publikation ausgewählt</div>
      )}

      {/* Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowManagerDialog(true)}
          className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span>Verwalten</span>
        </button>

        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Neue Publikation</span>
        </button>
      </div>

      {/* Publikation erstellen Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Neue Publikation erstellen</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titel *
                </label>
                <input
                  type="text"
                  value={newPublication.title}
                  onChange={(e) => setNewPublication(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="z.B. 'Mein neuer Roman'"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung *
                </label>
                <textarea
                  value={newPublication.description}
                  onChange={(e) => setNewPublication(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Kurze Beschreibung der Publikation..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Genre
                </label>
                <input
                  type="text"
                  value={newPublication.genre}
                  onChange={(e) => setNewPublication(prev => ({ ...prev, genre: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="z.B. 'Science Fiction', 'Fantasy', etc."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={createPublication}
                disabled={!newPublication.title || !newPublication.description}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
              >
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publikationen verwalten Dialog */}
      {showManagerDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Publikationen verwalten</h3>
            
            {publications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Noch keine Publikationen vorhanden.
              </div>
            ) : (
              <div className="space-y-3">
                {publications.map(publication => (
                  <div
                    key={publication.id}
                    className={`border rounded-lg p-4 ${
                      publication.id === currentPublicationId 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{publication.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{publication.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>Genre: {publication.genre || 'Unbekannt'}</span>
                          <span>{publication.sessionsCount} Sessions</span>
                          <span>{publication.contextCount} Kontext-Dateien</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {publication.id !== currentPublicationId && (
                          <button
                            onClick={() => updatePublication(publication.id, { setActive: true })}
                            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                          >
                            Aktivieren
                          </button>
                        )}
                        <button
                          onClick={() => setEditingPublication(publication)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deletePublication(publication.id)}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowManagerDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publikation bearbeiten Dialog */}
      {editingPublication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Publikation bearbeiten</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
                <input
                  type="text"
                  value={editingPublication.title}
                  onChange={(e) => setEditingPublication(prev => prev ? { ...prev, title: e.target.value } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
                <textarea
                  value={editingPublication.description}
                  onChange={(e) => setEditingPublication(prev => prev ? { ...prev, description: e.target.value } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                <input
                  type="text"
                  value={editingPublication.genre}
                  onChange={(e) => setEditingPublication(prev => prev ? { ...prev, genre: e.target.value } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setEditingPublication(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  if (editingPublication) {
                    updatePublication(editingPublication.id, {
                      title: editingPublication.title,
                      description: editingPublication.description,
                      genre: editingPublication.genre
                    });
                    setEditingPublication(null);
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 