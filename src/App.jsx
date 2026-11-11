import React, { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, Moon, Plus, Sun } from 'lucide-react';
import { loadAllTopics } from './utils/topicLoader';
import {
  getTopicProgress,
  loadAllProgress,
  loadTheme,
  removeImportedTopic,
  saveImportedTopic,
  saveTheme,
  saveTopicProgress,
} from './utils/storage';
import LibraryView from './components/LibraryView';
import TopicWorkspace from './components/TopicWorkspace';
import AddTopicModal from './components/AddTopicModal';

function getInitialTopicId() {
  const hash = window.location.hash;
  const match = hash.match(/topic=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function App() {
  const [topics, setTopics] = useState(() => loadAllTopics());
  const [selectedId, setSelectedId] = useState(getInitialTopicId);
  const [allProgress, setAllProgress] = useState(() => loadAllProgress());
  const [theme, setTheme] = useState(() => loadTheme());
  const [addModalOpen, setAddModalOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onHashChange = () => {
      setSelectedId(getInitialTopicId());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const selectTopic = (id) => {
    setSelectedId(id);
    if (id) {
      window.location.hash = `topic=${encodeURIComponent(id)}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      history.replaceState(null, '', window.location.pathname);
    }
  };

  const activeTopic = useMemo(
    () => topics.find((t) => t.id === selectedId) || null,
    [topics, selectedId]
  );

  const handleUpdateProgress = (topicId, patch) => {
    const updated = saveTopicProgress(topicId, patch);
    setAllProgress(updated);
  };

  const handleImportFile = (fileName, rawMarkdown) => {
    saveImportedTopic(fileName, rawMarkdown);
    const refreshed = loadAllTopics();
    setTopics(refreshed);
  };

  const handleRemoveImported = (fileName) => {
    removeImportedTopic(fileName);
    setTopics(loadAllTopics());
  };

  return (
    <div className="app-shell">
      <header className="top-navbar">
        <button
          type="button"
          className="brand-btn"
          onClick={() => selectTopic(null)}
        >
          <span className="brand-logo">
            <BookOpenCheck size={20} />
          </span>
          <span className="brand-text">
            <strong>StudyForge</strong>
            <span>Personal Learning Studio</span>
          </span>
        </button>

        <div className="navbar-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setAddModalOpen(true)}
          >
            <Plus size={16} /> Add Topic
          </button>

          <button
            type="button"
            className="icon-btn"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            aria-label="Toggle color theme"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <main className="app-container">
        {activeTopic ? (
          <TopicWorkspace
            topic={activeTopic}
            progress={getTopicProgress(allProgress, activeTopic.id)}
            theme={theme}
            onBack={() => selectTopic(null)}
            onUpdateProgress={(patch) =>
              handleUpdateProgress(activeTopic.id, patch)
            }
          />
        ) : (
          <LibraryView
            topics={topics}
            allProgress={allProgress}
            onSelectTopic={selectTopic}
            onOpenAddModal={() => setAddModalOpen(true)}
            onRemoveImported={handleRemoveImported}
          />
        )}
      </main>

      <AddTopicModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onImportFile={handleImportFile}
      />
    </div>
  );
}
