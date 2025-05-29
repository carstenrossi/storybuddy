'use client';

import { useState, useEffect } from 'react';
import { Plus, MessageSquare, Edit, Trash2, Save, X, Calendar, Hash } from 'lucide-react';
import type { Mode } from '@/app/page';

interface ChatSession {
  id: string;
  name: string;
  mode: 'brainstorming' | 'writing';
  messages: any[];
  createdAt: string;
  lastUpdated: string;
  messageCount: number;
}

interface SessionBrowserProps {
  currentMode: Mode;
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  sessionUpdateTrigger?: number;
}

export default function SessionBrowser({ 
  currentMode, 
  currentSessionId, 
  onSessionSelect, 
  onNewSession,
  sessionUpdateTrigger
}: SessionBrowserProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');

  useEffect(() => {
    loadSessions();
  }, [currentMode]);

  // Trigger Session-Reload wenn sessionUpdateTrigger sich ändert
  useEffect(() => {
    loadSessions();
  }, [sessionUpdateTrigger]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/sessions?mode=${currentMode}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewSession = async () => {
    if (!newSessionName.trim()) return;

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSessionName.trim(),
          mode: currentMode,
          messages: [],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await loadSessions();
        setShowCreateDialog(false);
        setNewSessionName('');
        onSessionSelect(data.session.id);
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Session:', error);
    }
  };

  const renameSession = async (sessionId: string) => {
    if (!editName.trim()) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });

      if (response.ok) {
        await loadSessions();
        setEditingId(null);
        setEditName('');
      }
    } catch (error) {
      console.error('Fehler beim Umbenennen der Session:', error);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Möchten Sie diese Session wirklich löschen?')) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadSessions();
        if (currentSessionId === sessionId) {
          onNewSession(); // Wechsle zu neuer Session wenn aktuelle gelöscht wird
        }
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Session:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Heute';
    if (diffDays === 2) return 'Gestern';
    if (diffDays <= 7) return `vor ${diffDays - 1} Tagen`;
    return date.toLocaleDateString('de-DE');
  };

  const modeInfo = {
    brainstorming: { color: 'blue', icon: '🧠', label: 'Brainstorming' },
    writing: { color: 'purple', icon: '✍️', label: 'Schreiben' },
  };

  const currentModeInfo = modeInfo[currentMode];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <span>{currentModeInfo.icon}</span>
              <span>{currentModeInfo.label} Sessions</span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {sessions.length} Session{sessions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            title="Neue Session erstellen"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Sessions Liste */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50 animate-pulse" />
            <p className="text-sm">Lade Sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Noch keine Sessions</p>
            <p className="text-xs mt-1">Klicken Sie auf + um zu beginnen</p>
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === currentSessionId;
            const isEditing = editingId === session.id;

            return (
              <div
                key={session.id}
                className={`group p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                onClick={() => !isEditing && onSessionSelect(session.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') renameSession(session.id);
                          if (e.key === 'Escape') {
                            setEditingId(null);
                            setEditName('');
                          }
                        }}
                        className="w-full text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-900 dark:text-white"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <h3 className={`text-sm font-medium truncate ${
                        isActive ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                      }`}>
                        {session.name}
                      </h3>
                    )}
                    
                    <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Hash className="h-3 w-3" />
                        <span>{session.messageCount} Nachrichten</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(session.lastUpdated)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-1 ml-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            renameSession(session.id);
                          }}
                          className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                          title="Speichern"
                        >
                          <Save className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(null);
                            setEditName('');
                          }}
                          className="p-1 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                          title="Abbrechen"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(session.id);
                            setEditName(session.name);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors opacity-0 group-hover:opacity-100"
                          title="Umbenennen"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                          className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100"
                          title="Löschen"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Neue Session erstellen Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Neue {currentModeInfo.label} Session
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Session-Name
                </label>
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') createNewSession();
                  }}
                  placeholder={`z.B. ${currentMode === 'brainstorming' ? 'Hauptcharakter entwickeln' : 'Kapitel 1 schreiben'}`}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewSessionName('');
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={createNewSession}
                disabled={!newSessionName.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 