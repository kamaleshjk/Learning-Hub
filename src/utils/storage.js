const PROGRESS_KEY = 'studyforge_progress_v1';
const THEME_KEY = 'studyforge_theme_v1';
const IMPORTED_KEY = 'studyforge_imported_topics_v1';

export function loadAllProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getTopicProgress(allProgress, topicId) {
  return (
    allProgress[topicId] || {
      status: 'not-started',
      checkedSteps: {},
      quizResult: null,
      flashcardKnown: [],
      notes: '',
      lastStudiedAt: null,
    }
  );
}

export function saveTopicProgress(topicId, patch) {
  const all = loadAllProgress();
  const current = getTopicProgress(all, topicId);
  const updated = {
    ...all,
    [topicId]: {
      ...current,
      ...patch,
      lastStudiedAt: new Date().toISOString(),
    },
  };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
  return updated;
}

export function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // ignore
  }
  return 'dark';
}

export function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
}

export function loadImportedTopics() {
  try {
    const raw = localStorage.getItem(IMPORTED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveImportedTopic(fileName, rawMarkdown) {
  const list = loadImportedTopics().filter((t) => t.fileName !== fileName);
  list.push({ fileName, rawMarkdown, importedAt: new Date().toISOString() });
  localStorage.setItem(IMPORTED_KEY, JSON.stringify(list));
  return list;
}

export function removeImportedTopic(fileName) {
  const list = loadImportedTopics().filter((t) => t.fileName !== fileName);
  localStorage.setItem(IMPORTED_KEY, JSON.stringify(list));
  return list;
}
