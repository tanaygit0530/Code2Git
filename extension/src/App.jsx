import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ConnectionCard from './components/ConnectionCard';
import ProblemCard from './components/ProblemCard';
import StatusTracker from './components/StatusTracker';
import HistoryList from './components/HistoryList';
import SettingsModal from './components/SettingsModal';
import storageService from './services/storageService';
import { MESSAGE_TYPES, STATUS } from './utils/constants';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState('DSA-Solutions');
  const [automationState, setAutomationState] = useState({ status: STATUS.IDLE });

  useEffect(() => {
    // 1. Initial status loading from storage
    storageService.get('current_automation_state').then((savedState) => {
      if (savedState) setAutomationState(savedState);
    });

    // 2. Query background worker for current state
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_STATUS }, (response) => {
        if (response && response.state) {
          setAutomationState(response.state);
        }
      });
    }

    // 3. Listen for status broadcast updates from background worker
    const messageListener = (message) => {
      if (message.type === MESSAGE_TYPES.STATUS_UPDATE && message.state) {
        setAutomationState(message.state);
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(messageListener);
      return () => chrome.runtime.onMessage.removeListener(messageListener);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isConnected}
      />

      <main className="flex-1 p-4 space-y-4 max-w-md mx-auto w-full">
        {activeTab === 'dashboard' && (
          <>
            <ConnectionCard
              isConnected={isConnected}
              setIsConnected={setIsConnected}
              selectedRepo={selectedRepo}
              setSelectedRepo={setSelectedRepo}
            />

            <ProblemCard
              problem={automationState.problem}
              submission={automationState.submission}
            />

            <StatusTracker state={automationState} />
          </>
        )}

        {activeTab === 'history' && <HistoryList />}

        {activeTab === 'settings' && <SettingsModal />}
      </main>

      <footer className="p-3 text-center border-t border-slate-800 text-[10px] text-slate-500">
        Code2Git AI • Automated LeetCode to GitHub Pipeline
      </footer>
    </div>
  );
}
