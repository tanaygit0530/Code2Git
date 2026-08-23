import React, { useState, useEffect } from 'react';
import { History, ExternalLink, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import storageService from '../services/storageService';

export default function HistoryList() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const activities = (await storageService.get('recent_activity')) || [];
    setHistory(activities);
  };

  const handleClearHistory = async () => {
    if (confirm('Clear history records?')) {
      await storageService.set('recent_activity', []);
      setHistory([]);
    }
  };

  if (history.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-6 text-center">
        <History className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-40" />
        <p className="text-xs text-slate-300 font-medium">No Recent Activity</p>
        <p className="text-[11px] text-slate-500 mt-1">
          Accepted solutions pushed to GitHub will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-sky-400" /> Recent Sync History
        </h3>
        <button
          onClick={handleClearHistory}
          className="text-[10px] text-slate-400 hover:text-red-400 flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" /> Clear
        </button>
      </div>

      <div className="space-y-2">
        {history.map((item) => (
          <div key={item.id} className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-xs shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-100">{item.problemTitle}</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Synced
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-2">
              <span>{item.path || 'Category/Problem'}</span>
              <span className="text-[10px] uppercase text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded">
                {item.language}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-700/40">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {item.commitUrl && (
                <a
                  href={item.commitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:underline flex items-center gap-1"
                >
                  GitHub Commit <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
