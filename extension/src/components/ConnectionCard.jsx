import React, { useState, useEffect } from 'react';
import { Github, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, Key, FolderCheck } from 'lucide-react';
import storageService from '../services/storageService';
import apiService from '../services/apiService';

export default function ConnectionCard({ isConnected, setIsConnected, selectedRepo, setSelectedRepo }) {
  const [user, setUser] = useState(null);
  const [repoInfo, setRepoInfo] = useState(null);
  const [tokenInput, setTokenInput] = useState('');
  const [showTokenField, setShowTokenField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    loadAuthStatus();

    // Listener for postMessage from OAuth callback window
    const handleAuthMessage = async (event) => {
      if (event.data && event.data.type === 'CODE2GIT_GITHUB_AUTH_SUCCESS') {
        const { accessToken, username, repository } = event.data;
        if (accessToken) {
          await storageService.set('github_token', accessToken);
          await storageService.set('github_user', { login: username });
          if (repository) {
            await storageService.set('selected_repo', repository.fullName);
            setSelectedRepo(repository.fullName);
            setRepoInfo(repository);
          }
          setIsConnected(true);
          setUser({ login: username });
        }
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  const loadAuthStatus = async () => {
    setLoading(true);
    try {
      const token = await storageService.getGithubToken();
      const savedUser = await storageService.getGithubUser();
      const savedRepo = await storageService.getSelectedRepo();

      if (token) {
        setIsConnected(true);
        setUser(savedUser || { login: 'Connected User' });

        // Ensure DSA-Solutions repository exists & get exact metadata
        try {
          const repoSetup = await apiService.setupGithubRepo(token);
          if (repoSetup && repoSetup.repository) {
            setUser({ login: repoSetup.username });
            setRepoInfo(repoSetup.repository);
            setSelectedRepo(repoSetup.repository.fullName);
            await storageService.set('selected_repo', repoSetup.repository.fullName);
            await storageService.set('github_user', { login: repoSetup.username });
          }
        } catch (e) {
          console.warn('Repository auto-setup check note:', e.message);
          setRepoInfo({ fullName: savedRepo || 'DSA-Solutions', url: '#' });
        }
      } else {
        setIsConnected(false);
        setUser(null);
        setRepoInfo(null);
      }
    } catch (err) {
      console.error('Failed loading auth status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectOAuth = async () => {
    setStatusMsg('Connecting GitHub...');
    const backendUrl = await storageService.getBackendUrl();
    window.open(`${backendUrl}/api/github/auth`, '_blank', 'width=600,height=700');
  };

  const handleManualTokenSave = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setLoading(true);
    setStatusMsg('Checking & creating DSA-Solutions repository...');
    try {
      const token = tokenInput.trim();
      await storageService.set('github_token', token);

      // Trigger automatic repository creation / check
      const repoSetup = await apiService.setupGithubRepo(token);
      
      setUser({ login: repoSetup.username });
      setRepoInfo(repoSetup.repository);
      setSelectedRepo(repoSetup.repository.fullName);
      await storageService.set('selected_repo', repoSetup.repository.fullName);
      await storageService.set('github_user', { login: repoSetup.username });

      setIsConnected(true);
      setShowTokenField(false);
      setStatusMsg('');
    } catch (err) {
      alert('Failed setting up repository: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await storageService.set('github_token', null);
    await storageService.set('github_user', null);
    setIsConnected(false);
    setUser(null);
    setRepoInfo(null);
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
            <CheckCircle2 className="w-3.5 h-3.5" /> Connected ✓
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
              <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold uppercase text-xs">
                {user?.login?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="font-semibold text-slate-100">Welcome, {user?.login}</p>
                <p className="text-slate-400 text-[10px]">GitHub account linked</p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-[11px] text-red-400 hover:text-red-300 hover:underline"
            >
              Disconnect
            </button>
          </div>

          {/* DSA Repository status card */}
          <div className="bg-slate-900/90 border border-sky-500/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">DSA Repository</span>
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <FolderCheck className="w-3.5 h-3.5" /> Repository Ready ✓
              </span>
            </div>

            <div className="text-xs font-mono font-bold text-sky-400">
              {repoInfo?.fullName || `${user?.login || 'User'}/DSA-Solutions`}
            </div>

            <div className="pt-1 flex items-center justify-between border-t border-slate-800">
              <span className="text-[10px] text-slate-400">Public DSA repository</span>
              {repoInfo?.url && (
                <a
                  href={repoInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 hover:underline font-sans font-medium"
                >
                  [Open Repository] <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Automatically save your accepted LeetCode solutions to your own GitHub repository.
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
            Connect GitHub
          </button>

          {statusMsg && (
            <p className="text-[11px] text-sky-400 text-center animate-pulse">{statusMsg}</p>
          )}

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
                <Key className="w-3 h-3" /> Connect & Create Repository
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
