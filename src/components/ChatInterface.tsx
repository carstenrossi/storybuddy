'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Save, Settings2, Plus, MessageSquareOff, X } from 'lucide-react';
import type { Mode } from '@/app/page';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  name: string;
  mode: 'brainstorming' | 'writing';
  messages: Message[];
  createdAt: string;
  lastUpdated: string;
  messageCount: number;
}

interface ChatInterfaceProps {
  mode: Mode;
  currentSessionId: string | null;
  onNewSession: () => void;
  onSessionUpdate?: () => void;
}

// Modal für Context-Speicherung
interface SaveContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, type: string) => void;
  defaultContent: string;
  mode: 'brainstorming' | 'writing';
}

function SaveContextModal({ isOpen, onClose, onSave, defaultContent, mode }: SaveContextModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('character');
  const [isLoading, setIsLoading] = useState(false);

  const contextTypes = [
    { value: 'character', label: 'Charakter', icon: '👤' },
    { value: 'place', label: 'Ort', icon: '🏛️' },
    { value: 'object', label: 'Objekt', icon: '⚔️' },
    { value: 'story', label: 'Geschichte', icon: '📖' },
    { value: 'world', label: 'Welt', icon: '🌍' },
    { value: 'rule', label: 'Regel/System', icon: '⚖️' },
    { value: 'magic', label: 'Magie', icon: '✨' },
    { value: 'technology', label: 'Technologie', icon: '🔧' },
    { value: 'culture', label: 'Kultur', icon: '🎭' },
    { value: 'history', label: 'Geschichte', icon: '��' },
    { value: 'chapter', label: 'Kapitel', icon: '📚' },
    { value: 'other', label: 'Sonstiges', icon: '📝' },
  ];

  useEffect(() => {
    if (isOpen) {
      // Generiere einen Standard-Namen basierend auf dem aktuellen Datum
      const today = new Date().toLocaleDateString('de-DE');
      setName(`Chat Export ${today}`);
      // Setze Standard-Typ basierend auf dem Modus
      setType(mode === 'writing' ? 'chapter' : 'story');
    }
  }, [isOpen, mode]);

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setIsLoading(true);
    try {
      await onSave(name.trim(), type);
      onClose();
      setName('');
      setType('character');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Als Kontext speichern
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              placeholder="z.B. Hauptcharakter Elena"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Kategorie
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {contextTypes.map((contextType) => (
                <button
                  key={contextType.value}
                  onClick={() => setType(contextType.value)}
                  className={`flex items-center space-x-2 p-3 rounded-md border transition-colors text-left ${
                    type === contextType.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="text-lg">{contextType.icon}</span>
                  <span className="text-sm font-medium">{contextType.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vorschau
            </label>
            <div className="max-h-32 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {defaultContent.length > 200 
                  ? defaultContent.substring(0, 200) + '...'
                  : defaultContent
                }
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            disabled={isLoading}
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || isLoading}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Speichern</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatInterface({ mode, currentSessionId, onNewSession, onSessionUpdate }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedMessageContent, setSelectedMessageContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Session-spezifische Daten laden
  useEffect(() => {
    if (currentSessionId) {
      loadSession();
    } else {
      setMessages([]);
    }
    
    // Lade System-Prompt für beide Modi
    loadSystemPrompt();
  }, [currentSessionId, mode]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadSession = async () => {
    if (!currentSessionId) return;
    
    try {
      const response = await fetch(`/api/sessions?id=${currentSessionId}`);
      if (response.ok) {
        const session: ChatSession = await response.json();
        setMessages(session.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Session:', error);
    }
  };

  const saveSession = async (newMessages: Message[]) => {
    if (!currentSessionId) return;

    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          messages: newMessages,
        }),
      });
      
      // Benachrichtige Parent über Session-Update
      if (onSessionUpdate) {
        onSessionUpdate();
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Session:', error);
    }
  };

  const loadSystemPrompt = async () => {
    try {
      const response = await fetch(`/api/settings/system-prompt?mode=${mode}`);
      if (response.ok) {
        const data = await response.json();
        setSystemPrompt(data.prompt || '');
      }
    } catch (error) {
      console.error('Fehler beim Laden des System-Prompts:', error);
    }
  };

  const saveSystemPrompt = async () => {
    try {
      await fetch('/api/settings/system-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: systemPrompt, mode }),
      });
      setIsEditingPrompt(false);
    } catch (error) {
      console.error('Fehler beim Speichern des System-Prompts:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !currentSessionId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage.trim(),
          mode,
          systemPrompt: systemPrompt,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);
        await saveSession(finalMessages);
      } else {
        console.error('Fehler beim Senden der Nachricht');
      }
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openSaveModal = (content: string) => {
    setSelectedMessageContent(content);
    setShowSaveModal(true);
  };

  const saveAsContext = async (name: string, type: string) => {
    try {
      const response = await fetch('/api/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          content: selectedMessageContent,
        }),
      });

      if (response.ok) {
        // Visual feedback für erfolgreiches Speichern
        alert('✅ Als Kontext gespeichert!');
      } else {
        console.error('Fehler beim Speichern als Kontext');
        alert('❌ Fehler beim Speichern');
      }
    } catch (error) {
      console.error('Fehler beim Speichern als Kontext:', error);
      alert('❌ Fehler beim Speichern');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const modeInfo = {
    brainstorming: {
      placeholder: 'Erzählen Sie mir von Ihrer Idee...',
      color: 'blue',
      icon: '🧠',
      label: 'Brainstorming'
    },
    writing: {
      placeholder: 'Beginnen Sie Ihre Geschichte...',
      color: 'purple',
      icon: '✍️',
      label: 'Schreiben'
    },
  };

  const currentModeInfo = modeInfo[mode];

  // Zeige "Neue Session" Button wenn keine aktuelle Session
  if (!currentSessionId) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquareOff className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Keine Session ausgewählt
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
              Wählen Sie eine bestehende Session aus oder erstellen Sie eine neue, um mit dem {currentModeInfo.label} zu beginnen.
            </p>
            <button
              onClick={onNewSession}
              className={`inline-flex items-center space-x-2 px-6 py-3 bg-${currentModeInfo.color}-500 hover:bg-${currentModeInfo.color}-600 text-white rounded-lg transition-colors`}
            >
              <Plus className="h-5 w-5" />
              <span>Neue Session starten</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{currentModeInfo.icon}</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentModeInfo.label}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {messages.length} Nachricht{messages.length !== 1 ? 'en' : ''}
              </p>
            </div>
          </div>

          {/* System Prompt Settings für beide Modi */}
          <button
            onClick={() => setIsEditingPrompt(!isEditingPrompt)}
            className={`p-2 text-${currentModeInfo.color}-600 hover:text-${currentModeInfo.color}-700 dark:text-${currentModeInfo.color}-400 dark:hover:text-${currentModeInfo.color}-300 transition-colors`}
            title="System-Prompt bearbeiten"
          >
            <Settings2 className="h-5 w-5" />
          </button>
        </div>

        {/* System Prompt Editor für beide Modi */}
        {isEditingPrompt && (
          <div className={`mt-4 p-4 bg-${currentModeInfo.color}-50 dark:bg-${currentModeInfo.color}-900/20 rounded-lg border border-${currentModeInfo.color}-200 dark:border-${currentModeInfo.color}-800`}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              System-Prompt für {currentModeInfo.label}
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              placeholder={`z.B. Du bist ein kreativer ${mode === 'brainstorming' ? 'Brainstorming-Partner für Welten und Charaktere' : 'Schreibassistent, der hilft, fesselnde Geschichten zu entwickeln'}...`}
            />
            <div className="flex justify-end space-x-2 mt-3">
              <button
                onClick={() => setIsEditingPrompt(false)}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={saveSystemPrompt}
                className={`px-3 py-1 text-sm bg-${currentModeInfo.color}-500 text-white rounded hover:bg-${currentModeInfo.color}-600 transition-colors`}
              >
                Speichern
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-4">{currentModeInfo.icon}</div>
            <p className="text-lg font-medium mb-2">Bereit für {currentModeInfo.label}!</p>
            <p className="text-sm">Stellen Sie Ihre erste Frage oder teilen Sie Ihre Idee mit.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? `bg-${currentModeInfo.color}-500 text-white`
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                } group relative`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
                
                {/* Save as Context Button (nur für Assistant-Messages im Brainstorming) */}
                {message.role === 'assistant' && mode === 'brainstorming' && (
                  <button
                    onClick={() => openSaveModal(message.content)}
                    className="absolute top-2 right-2 p-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    title="Als Kontext speichern"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                )}

                {/* Save as Chapter Button (nur für Assistant-Messages im Writing) */}
                {message.role === 'assistant' && mode === 'writing' && (
                  <button
                    onClick={() => openSaveModal(message.content)}
                    className="absolute top-2 right-2 p-1 text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                    title="Als Kapitel speichern"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                )}
                
                <div className="text-xs mt-2 opacity-70">
                  {message.timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-lg">
              <Loader2 className="h-5 w-5 animate-spin text-gray-600 dark:text-gray-300" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-4">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={3}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            placeholder={currentModeInfo.placeholder}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className={`px-6 py-3 bg-${currentModeInfo.color}-500 text-white rounded-lg hover:bg-${currentModeInfo.color}-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2`}
          >
            <Send className="h-5 w-5" />
            <span>Senden</span>
          </button>
        </div>
      </div>

      {/* Save Context Modal */}
      <SaveContextModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={saveAsContext}
        defaultContent={selectedMessageContent}
        mode={mode}
      />
    </div>
  );
} 