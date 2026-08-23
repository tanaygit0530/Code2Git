import React, { useState, useEffect } from 'react';
import { Save, Server, Sliders, CheckCircle, ShieldCheck } from 'lucide-react';
import storageService from '../services/storageService';
import { DEFAULT_BACKEND_URL } from '../utils/constants';

export default function SettingsModal() {
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND_URL);
  const [targetRepo, setTargetRepo] = useState('DSA-Solutions');
  const [autoPush, setAutoPush] = useState(true);
  const [generateReadme, setGenerateReadme] = useState(true);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const url = await storageService.getBackendUrl();
    const repo = await storageService.getSelectedRepo();
    const prefs = (await storageService.get('user_preferences')) || {};

    setBackendUrl(url);
    setTargetRepo(repo);
    if (prefs.autoPush !== undefined) setAutoPush(prefs.autoPush);
    if (prefs.generateReadme !== undefined) setGenerateReadme(prefs.generateReadme);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await storageService.set('backend_url', backendUrl.trim());
    await storageService.set('selected_repo', targetRepo.trim());
    await storageService.set('user_preferences', { autoPush, generateReadme });

    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-sky-400" /> Extension Preferences
        </h3>
        {savedMessage && (
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Saved!
          </span>
        )}
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <label className="font-semibold text-slate-300 block mb-1 flex items-center gap-1">
            <Server className="w-3.5 h-3.5 text-sky-400" /> Backend API Server URL
          </label>
          <input
            type="text"
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value)}
            placeholder="http://localhost:5000"
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 font-mono outline-none focus:border-sky-500"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Express server URL handling AI generation and GitHub OAuth.
          </p>
        </div>

        <div>
          <label className="font-semibold text-slate-300 block mb-1">Default Repository Name</label>
          <input
            type="text"
            value={targetRepo}
            onChange={(e) => setTargetRepo(e.target.value)}
            placeholder="DSA-Solutions"
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 font-mono outline-none focus:border-sky-500"
          />
        </div>

        <div className="pt-2 border-t border-slate-700/40 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-200">Automatic Push</p>
              <p className="text-[10px] text-slate-400">Push immediately on Accepted submission</p>
            </div>
            <input
              type="checkbox"
              checked={autoPush}
              onChange={(e) => setAutoPush(e.target.checked)}
              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-200">AI README Generation</p>
              <p className="text-[10px] text-slate-400">Generate full Markdown explanation</p>
            </div>
            <input
              type="checkbox"
              checked={generateReadme}
              onChange={(e) => setGenerateReadme(e.target.checked)}
              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50 flex items-start gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p>
            No GitHub secrets or AI API keys are stored in this Chrome extension source. All keys remain secure on the backend server.
          </p>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-medium text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
      >
        <Save className="w-3.5 h-3.5" /> Save Preferences
      </button>
    </form>
  );
}
