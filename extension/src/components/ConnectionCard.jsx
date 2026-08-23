import React, { useState, useEffect } from 'react';
import { Github, CheckCircle2, AlertCircle, RefreshCw, FolderGit2, Key } from 'lucide-react';
import storageService from '../services/storageService';
import apiService from '../services/apiService';

export default function ConnectionCard({ isConnected, setIsConnected, selectedRepo, setSelectedRepo }) {
  const [user, setUser] = useState(null);
  const [tokenInput, setTokenInput] = useState('');
  const [showTokenField, setShowTokenField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [repoInput, setRepoInput] = useState(selectedRepo || 'DSA-Solutions');
  const [userRepos, setUserRepos] = useState([]);

  useEffect(() => {
    loadAuthStatus();
  }, []);

  const loadAuthStatus = async () => {
    setLoading(true);
    try {
      const token = await storageService.getGithubToken();
      const savedUser = await storageService.getGithubUser();
      const repo = await storageService.getSelectedRepo();
      setRepoInput(repo);

      if (token) {
        setIsConnected(true);
        setUser(savedUser || { login: 'Connected User' });
        // Fetch user repos list
        try {
          const repos = await apiService.getGithubRepos(token);
          setUserRepos(repos);
        } catch (e) {
          console.warn('Could not fetch repos list automatically.');
        }
      } else {
        setIsConnected(false);
        setUser(null);
      }
    } catch (err) {
      console.error('Failed loading auth status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectOAuth = async () => {
    const backendUrl = await storageService.getBackendUrl();
    window.open(`${backendUrl}/api/github/auth`, '_blank', 'width=600,height=700');
  };

  const handleManualTokenSave = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setLoading(true);
    try {
      // Save token directly
      await storageService.set('github_token', tokenInput.trim());
      const mockUser = { login: 'GitHub User' };
      await storageService.set('github_user', mockUser);
      setIsConnected(true);
      setUser(mockUser);
      setShowTokenField(false);
    } catch (err) {
      alert('Failed saving token: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRepoChange = async (newRepo) => {
    setRepoInput(newRepo);
    setSelectedRepo(newRepo);
    await storageService.set('selected_repo', newRepo);
  };

  const handleDisconnect = async () => {
    await storageService.set('github_token', null);
    await storageService.set('github_user', null);
    setIsConnected(false);
    setUser(null);
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Github className="w-5 h-5 text-slate-200" />
          <span className="font-semibold text-slate-200 text-sm">GitHub Connection</span>
        </div>
        {isConnected ? (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Connected
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Not Connected
          </span>
        )}
      </div>

      {isConnected ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold uppercase text-[10px]">
                {user?.login?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="font-medium text-slate-200">@{user?.login}</p>
                <p className="text-slate-400 text-[10px]">Ready to sync solutions</p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-[11px] text-red-400 hover:text-red-300 hover:underline"
            >
              Disconnect
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1 flex items-center gap-1">
              <FolderGit2 className="w-3.5 h-3.5 text-sky-400" /> Target Repository
            </label>
            {userRepos.length > 0 ? (
              <select
                value={repoInput}
                onChange={(e) => handleRepoChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-sky-500 outline-none"
              >
                {userRepos.map((r) => (
                  <option key={r.id} value={r.full_name}>
                    {r.full_name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={repoInput}
                onChange={(e) => handleRepoChange(e.target.value)}
                placeholder="e.g. username/DSA-Solutions"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-sky-500 outline-none font-mono"
              />
            )}
            <p className="text-[10px] text-slate-400 mt-1">
              Solutions will be pushed inside <span className="text-sky-400 font-mono">{repoInput || 'DSA-Solutions'}/Category/Problem</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Connect your GitHub account to automatically save accepted LeetCode solutions.
          </p>

          <button
            onClick={handleConnectOAuth}
            disabled={loading}
            className="w-full bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-medium text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Github className="w-4 h-4" />
            )}
            Connect GitHub Account
          </button>

          <div className="text-center">
            <button
              onClick={() => setShowTokenField(!showTokenField)}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline"
            >
              {showTokenField ? 'Hide Access Token option' : 'Or enter Personal Access Token directly'}
            </button>
          </div>

          {showTokenField && (
            <form onSubmit={handleManualTokenSave} className="space-y-2 pt-1">
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2 font-mono outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs py-1.5 rounded-lg flex items-center justify-center gap-1"
              >
                <Key className="w-3 h-3" /> Save Token
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
