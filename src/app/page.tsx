'use client';

import { useState, useEffect } from 'react';
import { History, Database } from 'lucide-react';
import ModeSelector from '@/components/ModeSelector';
import ContextPanel from '@/components/ContextPanel';
import ChatInterface from '@/components/ChatInterface';
import SessionBrowser from '@/components/SessionBrowser';
import PublicationSelector from '@/components/PublicationSelector';

export type Mode = 'brainstorming' | 'writing';

interface ChatSession {
  id: string;
  name: string;
  mode: 'brainstorming' | 'writing';
  messages: any[];
  createdAt: string;
  lastUpdated: string;
  messageCount: number;
}

export default function Home() {
  const [mode, setMode] = useState<Mode>('brainstorming');
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [showSessionBrowser, setShowSessionBrowser] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentPublicationId, setCurrentPublicationId] = useState<string | null>(null);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [sessionUpdateTrigger, setSessionUpdateTrigger] = useState(0);
  const [contextUpdateTrigger, setContextUpdateTrigger] = useState(0);

  useEffect(() => {
    checkMigrationStatus();
  }, []);

  // Load last session when mode or publication changes
  useEffect(() => {
    if (currentPublicationId && mode) {
      loadLastSessionForMode();
    }
  }, [mode, currentPublicationId]);

  const checkMigrationStatus = async () => {
    try {
      const response = await fetch('/api/migrate');
      if (response.ok) {
        const data = await response.json();
        if (data.needsMigration) {
          setNeedsMigration(true);
          setShowMigrationDialog(true);
        }
      }
    } catch (error) {
      console.error('Fehler bei der Migrations-Prüfung:', error);
    }
  };

  const loadLastSessionForMode = async () => {
    if (!currentPublicationId) return;
    
    try {
      const response = await fetch(`/api/sessions?mode=${mode}&publicationId=${currentPublicationId}`);
      if (response.ok) {
        const sessions: ChatSession[] = await response.json();
        
        // Check if current session matches the new mode
        if (currentSessionId) {
          const currentSession = sessions.find(s => s.id === currentSessionId);
          if (currentSession && currentSession.mode === mode) {
            // Current session is valid for this mode, keep it
            return;
          }
        }
        
        // Load most recent session for this mode
        if (sessions.length > 0) {
          const lastSession = sessions.sort((a, b) => 
            new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
          )[0];
          setCurrentSessionId(lastSession.id);
        } else {
          // No sessions for this mode, clear current session
          setCurrentSessionId(null);
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der letzten Session:', error);
      setCurrentSessionId(null);
    }
  };

  const runMigration = async () => {
    try {
      const response = await fetch('/api/migrate', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        console.log(`Migration abgeschlossen! ${data.migratedSessions} Sessions migriert.`);
        setNeedsMigration(false);
        setShowMigrationDialog(false);
        
        // Wenn Sessions migriert wurden, wähle die erste aus
        if (data.sessions && data.sessions.length > 0) {
          const relevantSession = data.sessions.find((s: ChatSession) => s.mode === mode);
          if (relevantSession) {
            setCurrentSessionId(relevantSession.id);
          }
        }
        
        // Trigger Session-Browser Update
        setSessionUpdateTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Fehler bei der Migration:', error);
    }
  };

  const handlePublicationChange = (publicationId: string | null) => {
    setCurrentPublicationId(publicationId);
    // Reset current session when switching publications
    setCurrentSessionId(null);
    // Trigger session browser update to load sessions for new publication
    setSessionUpdateTrigger(prev => prev + 1);
  };

  const handleNewSession = async () => {
    if (!currentPublicationId) {
      alert('Bitte wählen Sie zuerst eine Publikation aus.');
      return;
    }

    // Öffne Session-Browser falls geschlossen
    if (!showSessionBrowser) {
      setShowSessionBrowser(true);
    }
    
    // Erstelle automatisch eine neue Session
    const sessionName = `Neue ${mode === 'brainstorming' ? 'Brainstorming' : 'Schreib'}-Session`;
    
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sessionName,
          mode,
          messages: [],
          publicationId: currentPublicationId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentSessionId(data.session.id);
        // Trigger Session-Browser Update
        setSessionUpdateTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der neuen Session:', error);
    }
  };

  const handleSessionUpdate = () => {
    // Trigger Session-Browser Update
    setSessionUpdateTrigger(prev => prev + 1);
  };

  const handleContextUpdate = () => {
    // Trigger Context-Panel Update
    setContextUpdateTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto p-4 h-screen flex flex-col space-y-4">
        {/* Header */}
        <header className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Storybuddy
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Dein Partner für die Entwicklung von großartigen Geschichten
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSessionBrowser(!showSessionBrowser)}
                className={`p-2 rounded-lg transition-colors ${
                  showSessionBrowser
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Sessions anzeigen/verbergen"
              >
                <History className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => setShowContextPanel(!showContextPanel)}
                className={`p-2 rounded-lg transition-colors ${
                  showContextPanel
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Kontext-Panel anzeigen/verbergen"
              >
                <Database className="h-5 w-5" />
              </button>
              
              <ModeSelector currentMode={mode} onModeChange={setMode} />
            </div>
          </div>

          {/* Publication Selector */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <PublicationSelector
              onPublicationChange={handlePublicationChange}
              currentPublicationId={currentPublicationId}
            />
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 grid gap-4" style={{
          gridTemplateColumns: `${showSessionBrowser ? '300px' : '0px'} 1fr ${showContextPanel ? '300px' : '0px'}`,
          transition: 'grid-template-columns 0.3s ease-in-out'
        }}>
          {/* Session Browser */}
          {showSessionBrowser && (
            <div className="transition-all duration-300">
              <SessionBrowser
                currentMode={mode}
                currentSessionId={currentSessionId}
                currentPublicationId={currentPublicationId}
                onSessionSelect={setCurrentSessionId}
                onNewSession={handleNewSession}
                sessionUpdateTrigger={sessionUpdateTrigger}
              />
            </div>
          )}

          {/* Chat Interface */}
          <div className="transition-all duration-300">
            <ChatInterface
              mode={mode}
              currentSessionId={currentSessionId}
              currentPublicationId={currentPublicationId}
              onNewSession={handleNewSession}
              onSessionUpdate={handleSessionUpdate}
              onContextUpdate={handleContextUpdate}
            />
          </div>

          {/* Context Panel */}
          {showContextPanel && (
            <div className="transition-all duration-300">
              <ContextPanel 
                currentPublicationId={currentPublicationId} 
                currentMode={mode}
                contextUpdateTrigger={contextUpdateTrigger}
              />
            </div>
          )}
        </div>
      </div>

      {/* Migration Dialog */}
      {showMigrationDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Story Buddy Update
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Wir haben alte Chat-Historien gefunden und können diese zu dem neuen Session-System migrieren. 
                Dies ermöglicht es Ihnen, mehrere Chats pro Modus zu verwalten!
              </p>
              
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setShowMigrationDialog(false);
                    setNeedsMigration(false);
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Später
                </button>
                <button
                  onClick={runMigration}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Jetzt migrieren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 