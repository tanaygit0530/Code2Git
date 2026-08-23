import React from 'react';
import { CheckCircle2, Loader2, AlertCircle, Sparkles, FolderCheck, Code2, CopyCheck } from 'lucide-react';
import { STATUS } from '../utils/constants.js';

export default function StatusTracker({ state }) {
  const { status, error, result } = state || { status: STATUS.IDLE };

  const getSteps = () => {
    const isError = status === STATUS.FAILED;
    const isDuplicate = status === STATUS.DUPLICATE;

    return [
      {
        id: 'detected',
        label: 'Submission detected',
        active: [STATUS.SUBMISSION_DETECTED, STATUS.CHECKING_SUBMISSION, STATUS.ACCEPTED, STATUS.CAPTURING_CODE, STATUS.GENERATING_README, STATUS.README_GENERATED, STATUS.PUSHING_TO_GITHUB, STATUS.SUCCESS, STATUS.DUPLICATE].includes(status),
        completed: [STATUS.ACCEPTED, STATUS.CAPTURING_CODE, STATUS.GENERATING_README, STATUS.README_GENERATED, STATUS.PUSHING_TO_GITHUB, STATUS.SUCCESS, STATUS.DUPLICATE].includes(status),
      },
      {
        id: 'accepted',
        label: 'Accepted status verified',
        active: [STATUS.ACCEPTED, STATUS.CAPTURING_CODE, STATUS.GENERATING_README, STATUS.README_GENERATED, STATUS.PUSHING_TO_GITHUB, STATUS.SUCCESS, STATUS.DUPLICATE].includes(status),
        completed: [STATUS.CAPTURING_CODE, STATUS.GENERATING_README, STATUS.README_GENERATED, STATUS.PUSHING_TO_GITHUB, STATUS.SUCCESS, STATUS.DUPLICATE].includes(status),
      },
      {
        id: 'captured',
        label: 'Code & metadata captured',
        active: [STATUS.CAPTURING_CODE, STATUS.GENERATING_README, STATUS.README_GENERATED, STATUS.PUSHING_TO_GITHUB, STATUS.SUCCESS, STATUS.DUPLICATE].includes(status),
        completed: [STATUS.GENERATING_README, STATUS.README_GENERATED, STATUS.PUSHING_TO_GITHUB, STATUS.SUCCESS, STATUS.DUPLICATE].includes(status),
      },
      {
        id: 'readme',
        label: 'AI README generated',
        active: [STATUS.GENERATING_README, STATUS.README_GENERATED, STATUS.PUSHING_TO_GITHUB, STATUS.SUCCESS].includes(status),
        completed: [STATUS.README_GENERATED, STATUS.PUSHING_TO_GITHUB, STATUS.SUCCESS].includes(status),
      },
      {
        id: 'pushed',
        label: 'Pushed to GitHub repository',
        active: [STATUS.PUSHING_TO_GITHUB, STATUS.SUCCESS].includes(status),
        completed: status === STATUS.SUCCESS,
      },
    ];
  };

  const renderCurrentStatusHeader = () => {
    switch (status) {
      case STATUS.IDLE:
        return (
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse"></span>
            <span>Waiting for LeetCode submission...</span>
          </div>
        );
      case STATUS.SUBMISSION_DETECTED:
      case STATUS.CHECKING_SUBMISSION:
        return (
          <div className="flex items-center gap-2 text-sky-400 text-xs font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Evaluating submission result...</span>
          </div>
        );
      case STATUS.ACCEPTED:
      case STATUS.CAPTURING_CODE:
        return (
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Accepted ✓ Capturing code details...</span>
          </div>
        );
      case STATUS.GENERATING_README:
      case STATUS.README_GENERATED:
        return (
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-medium">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>AI generating README.md...</span>
          </div>
        );
      case STATUS.PUSHING_TO_GITHUB:
        return (
          <div className="flex items-center gap-2 text-sky-400 text-xs font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Pushing solution & README to GitHub...</span>
          </div>
        );
      case STATUS.SUCCESS:
        return (
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
            <FolderCheck className="w-4 h-4" />
            <span>GitHub updated successfully! ✓</span>
          </div>
        );
      case STATUS.DUPLICATE:
        return (
          <div className="flex items-center gap-2 text-sky-400 text-xs font-medium">
            <CopyCheck className="w-4 h-4" />
            <span>Already saved to GitHub ✓</span>
          </div>
        );
      case STATUS.NOT_ACCEPTED:
        return (
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Submission not accepted. Nothing was pushed.</span>
          </div>
        );
      case STATUS.FAILED:
        return (
          <div className="flex items-center gap-2 text-rose-400 text-xs font-medium">
            <AlertCircle className="w-4 h-4" />
            <span>Sync failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Automation Pipeline</span>
        {renderCurrentStatusHeader()}
      </div>

      {/* Visual step pipeline */}
      <div className="space-y-2 py-1">
        {getSteps().map((step) => (
          <div key={step.id} className="flex items-center gap-2 text-xs">
            {step.completed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : step.active ? (
              <Loader2 className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
            )}
            <span className={step.completed ? 'text-slate-200' : step.active ? 'text-sky-300 font-medium' : 'text-slate-500'}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs p-2.5 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-slate-900/80 border border-slate-700/60 p-3 rounded-lg text-xs space-y-1.5 font-mono">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>Folder:</span>
            <span className="text-sky-400 font-semibold">{result.folderPath}</span>
          </div>
          {result.commitUrl && (
            <div className="text-right pt-1">
              <a
                href={result.commitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-sky-400 hover:underline font-sans inline-flex items-center gap-1"
              >
                View Commit on GitHub →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
