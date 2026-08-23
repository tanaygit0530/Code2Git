import React from 'react';
import { ExternalLink, Code, Layers, FileText } from 'lucide-react';

export default function ProblemCard({ problem, submission }) {
  if (!problem) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 text-center">
        <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
        <p className="text-xs text-slate-300 font-medium">No Active LeetCode Problem Detected</p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Open a problem on <span className="text-sky-400">leetcode.com/problems/*</span> to begin.
        </p>
      </div>
    );
  }

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

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Current Problem</span>
        {problem.url && (
          <a
            href={problem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 hover:underline"
          >
            LeetCode <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <h2 className="text-sm font-bold text-slate-100 mb-3 line-clamp-1">
        {problem.title || 'Two Sum'}
      </h2>

      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${getDifficultyBadge(problem.difficulty)}`}>
          {problem.difficulty || 'Easy'}
        </span>

        {submission?.language && (
          <span className="bg-slate-900 text-sky-400 border border-slate-700 px-2 py-0.5 rounded-full text-[11px] font-mono flex items-center gap-1">
            <Code className="w-3 h-3" /> {submission.language.toUpperCase()}
          </span>
        )}

        {problem.topics && problem.topics.length > 0 && (
          <span className="bg-slate-900 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">
            <Layers className="w-3 h-3 text-indigo-400" /> {problem.topics[0]}
          </span>
        )}
      </div>
    </div>
  );
}
