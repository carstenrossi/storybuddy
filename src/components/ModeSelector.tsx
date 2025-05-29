'use client';

import { Brain, PenTool } from 'lucide-react';
import type { Mode } from '@/app/page';

interface ModeSelectorProps {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
}

export default function ModeSelector({ currentMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 shadow-sm">
      <button
        onClick={() => onModeChange('brainstorming')}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
          ${currentMode === 'brainstorming'
            ? 'bg-blue-500 text-white shadow-md'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
          }
        `}
      >
        <Brain className="h-4 w-4" />
        <span>Brainstorming</span>
      </button>
      
      <button
        onClick={() => onModeChange('writing')}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
          ${currentMode === 'writing'
            ? 'bg-purple-500 text-white shadow-md'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
          }
        `}
      >
        <PenTool className="h-4 w-4" />
        <span>Schreiben</span>
      </button>
    </div>
  );
} 