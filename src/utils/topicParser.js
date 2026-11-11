import yaml from 'js-yaml';

/**
 * Create a URL-safe slug / heading anchor id.
 */
export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[`*_~()[\]{}]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Parse YAML frontmatter and Markdown body from a raw .md string.
 */
export function parseTopicMarkdown(rawMarkdown, fileName = 'topic.md') {
  const normalized = rawMarkdown.replace(/\r\n/g, '\n');
  const fallbackSlug = fileName.replace(/\.md$/i, '');

  let frontmatter = {};
  let body = normalized;

  if (normalized.startsWith('---\n')) {
    const endIdx = normalized.indexOf('\n---\n', 4);
    if (endIdx !== -1) {
      const yamlBlock = normalized.slice(4, endIdx);
      body = normalized.slice(endIdx + 5).trim();
      try {
        const parsed = yaml.load(yamlBlock);
        if (parsed && typeof parsed === 'object') {
          frontmatter = parsed;
        }
      } catch (err) {
        console.warn(`Failed to parse frontmatter in ${fileName}:`, err);
      }
    }
  }

  const meta = {
    title: frontmatter.title || formatTitleFromSlug(fallbackSlug),
    slug: frontmatter.slug || fallbackSlug,
    category: frontmatter.category || 'General',
    difficulty: frontmatter.difficulty || 'Intermediate',
    estimatedTime: frontmatter.estimatedTime || '30 min',
    summary: frontmatter.summary || '',
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
    prerequisites: Array.isArray(frontmatter.prerequisites) ? frontmatter.prerequisites : [],
    updatedAt: frontmatter.updatedAt || '',
    resources: Array.isArray(frontmatter.resources) ? frontmatter.resources : [],
    flashcards: Array.isArray(frontmatter.flashcards) ? frontmatter.flashcards : [],
    quiz: Array.isArray(frontmatter.quiz) ? frontmatter.quiz : [],
  };

  const { toc, labSections, totalLabSteps } = analyzeMarkdownBody(body);

  return {
    id: meta.slug,
    fileName,
    meta,
    body,
    toc,
    labSections,
    totalLabSteps,
  };
}

function formatTitleFromSlug(slug) {
  return slug
    .split(/[-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Extract Table of Contents headings and Hands-On Lab sections without
 * being fooled by headings inside fenced code blocks.
 */
function analyzeMarkdownBody(body) {
  const lines = body.split('\n');
  const toc = [];
  const seenIds = new Map();
  let inCodeBlock = false;
  let codeFence = '';

  const labSections = [];
  let currentLabSection = null;
  let globalStepIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceMatch = line.match(/^(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeFence = fenceMatch[1][0];
      } else if (line.startsWith(codeFence.repeat(3))) {
        inCodeBlock = false;
        codeFence = '';
      }
      if (currentLabSection) {
        currentLabSection.lines.push(line);
      }
      continue;
    }

    if (!inCodeBlock) {
      const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const rawText = headingMatch[2].trim();
        const baseId = slugify(rawText);
        const count = seenIds.get(baseId) || 0;
        seenIds.set(baseId, count + 1);
        const id = count === 0 ? baseId : `${baseId}-${count}`;

        if (level >= 2) {
          toc.push({ level, text: rawText, id });
        }

        // Detect H2 sections that look like Practical / Hands-On Labs
        if (level === 2) {
          if (currentLabSection) {
            labSections.push({
              title: currentLabSection.title,
              markdown: currentLabSection.lines.join('\n').trim(),
            });
            currentLabSection = null;
          }
          if (/\b(lab|labs|hands-on|practical|workshop|exercise)\b/i.test(rawText)) {
            currentLabSection = {
              title: rawText,
              lines: [line],
            };
            continue;
          }
        }
      }

      const taskMatch = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.+)$/);
      if (taskMatch) {
        globalStepIndex++;
      }
    }

    if (currentLabSection) {
      currentLabSection.lines.push(line);
    }
  }

  if (currentLabSection) {
    labSections.push({
      title: currentLabSection.title,
      markdown: currentLabSection.lines.join('\n').trim(),
    });
  }

  return {
    toc,
    labSections,
    totalLabSteps: globalStepIndex,
  };
}
