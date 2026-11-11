import { parseTopicMarkdown } from './topicParser';
import { loadImportedTopics } from './storage';

/**
 * Automatically loads every .md file inside /topics at build/HMR time.
 * Adding a single .md file in /topics makes it appear immediately in the app.
 */
const topicModules = import.meta.glob('/topics/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export function loadAllTopics() {
  const topicsById = new Map();

  for (const [path, rawContent] of Object.entries(topicModules)) {
    const fileName = path.split('/').pop() || 'topic.md';
    if (fileName.startsWith('_')) continue; // allow _template.md to stay hidden
    const parsed = parseTopicMarkdown(rawContent, fileName);
    topicsById.set(parsed.id, { ...parsed, source: 'workspace' });
  }

  for (const imported of loadImportedTopics()) {
    const parsed = parseTopicMarkdown(imported.rawMarkdown, imported.fileName);
    if (!topicsById.has(parsed.id)) {
      topicsById.set(parsed.id, { ...parsed, source: 'imported' });
    }
  }

  return Array.from(topicsById.values()).sort((a, b) =>
    a.meta.title.localeCompare(b.meta.title)
  );
}
