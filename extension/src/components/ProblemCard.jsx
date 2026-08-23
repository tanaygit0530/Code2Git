import React from 'react';
import { ExternalLink, Code, Layers, FileText, Send, CheckCircle2 } from 'lucide-react';
import { MESSAGE_TYPES } from '../utils/constants';

export default function ProblemCard({ problem, submission, onManualSync }) {
  const handleSyncClick = () => {
    if (onManualSync) {
      onManualSync();
    } else if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: MESSAGE_TYPES.TRIGGER_PUSH });
    }
  };

  const getDifficultyBadge = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'hard':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  if (!problem) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 text-center space-y-3">
        <FileText className="w-7 h-7 text-slate-500 mx-auto opacity-50" />
        <div>
          <p className="text-xs text-slate-300 font-medium">Detecting Active LeetCode Problem...</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Open a problem on <span className="text-sky-400">leetcode.com/problems/*</span>
          </p>
        </div>
        <button
          onClick={handleSyncClick}
          className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-medium text-xs py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Send className="w-3.5 h-3.5" /> 🚀 Sync Active Solution to GitHub
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Current Problem</span>
        {problem.url && (
          <a
            href={problem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 hover:underline font-sans font-medium"
          >
            LeetCode <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <h2 className="text-sm font-bold text-slate-100 line-clamp-1">
        {problem.title || 'LeetCode Problem'}
      </h2>

      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${getDifficultyBadge(problem.difficulty)}`}>
          {problem.difficulty || 'Easy'}
        </span>

        <span className="bg-slate-900 text-sky-400 border border-slate-700 px-2 py-0.5 rounded-full text-[11px] font-mono flex items-center gap-1">
          <Code className="w-3 h-3" /> {submission?.language?.toUpperCase() || 'JAVA'}
        </span>

        {problem.topics && problem.topics.length > 0 && (
          <span className="bg-slate-900 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">
            <Layers className="w-3 h-3 text-indigo-400" /> {problem.topics[0]}
          </span>
        )}
      </div>

      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50 flex items-center gap-2 text-[11px] text-emerald-400">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>Automatic detection active. Or click button below to push instantly:</span>
      </div>

      <button
        onClick={handleSyncClick}
        className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-medium text-xs py-2.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/20 active:scale-[0.98]"
      >
        <Send className="w-3.5 h-3.5" /> 🚀 Push Solution & AI README to GitHub
      </button>
    </div>
  );
}
