import React from 'react';
import { GitBranch, History, Settings, Code2 } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, isConnected }) {
  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 p-4 sticky top-0 z-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-sky-500 to-indigo-500 p-2 rounded-lg text-white shadow-md shadow-sky-500/20">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Code2Git AI
              <span className="text-[10px] uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded font-mono">
                v1.0
              </span>
            </h1>
            <p className="text-xs text-slate-400">LeetCode → GitHub AI Sync</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`p-2 rounded-lg transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-slate-800 text-sky-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title="Dashboard"
          >
            <GitBranch className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`p-2 rounded-lg transition-colors ${
              activeTab === 'history'
                ? 'bg-slate-800 text-sky-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title="History"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`p-2 rounded-lg transition-colors ${
              activeTab === 'settings'
                ? 'bg-slate-800 text-sky-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
