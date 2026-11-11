import React, { useEffect, useMemo, useRef } from 'react';
import { Marked } from 'marked';
import hljs from 'highlight.js';
import mermaid from 'mermaid';
import { slugify } from '../utils/topicParser';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const CALLOUT_CONFIG = {
  MENTAL_MODEL: { label: 'Mental Model', variant: 'mental', icon: '🧠' },
  REALWORLD: { label: 'Real-World Insight', variant: 'realworld', icon: '🏭' },
  TIP: { label: 'Practical Tip', variant: 'tip', icon: '💡' },
  IMPORTANT: { label: 'Key Concept', variant: 'important', icon: '📌' },
  WARNING: { label: 'Watch Out', variant: 'warning', icon: '⚠️' },
  CAUTION: { label: 'Critical Pitfall', variant: 'caution', icon: '🚨' },
  NOTE: { label: 'Note', variant: 'note', icon: '📝' },
};

export function makeStepKey(text) {
  return `step_${slugify(text).slice(0, 64)}`;
}

export default function MarkdownRenderer({
  markdown,
  theme = 'dark',
  checkedSteps = {},
  onToggleStep,
}) {
  const containerRef = useRef(null);

  const html = useMemo(() => {
    const seenIds = new Map();
    const renderer = new Marked();

    renderer.use({
      gfm: true,
      breaks: false,
      renderer: {
        heading({ tokens, depth, text }) {
          const inlineHtml = this.parser.parseInline(tokens);
          const baseId = slugify(text);
          const count = seenIds.get(baseId) || 0;
          seenIds.set(baseId, count + 1);
          const id = count === 0 ? baseId : `${baseId}-${count}`;
          return `<h${depth} id="${id}" class="md-heading md-h${depth}">${inlineHtml}<a class="heading-anchor" href="#${id}" aria-label="Link to section">#</a></h${depth}>\n`;
        },

        code({ text, lang }) {
          const language = (lang || '').trim().toLowerCase();
          if (language === 'mermaid') {
            return `
              <div class="mermaid-card">
                <div class="mermaid-card-bar">
                  <span class="mermaid-badge">Diagram</span>
                </div>
                <div class="mermaid-scroll">
                  <pre class="mermaid">${escapeHtml(text)}</pre>
                </div>
              </div>
            `;
          }

          let highlighted = '';
          const validLang = language && hljs.getLanguage(language) ? language : '';
          try {
            highlighted = validLang
              ? hljs.highlight(text, { language: validLang }).value
              : hljs.highlightAuto(text).value;
          } catch {
            highlighted = escapeHtml(text);
          }

          const displayLang = validLang || language || 'code';
          const encodedRaw = encodeURIComponent(text);

          return `
            <div class="code-card">
              <div class="code-card-bar">
                <span class="code-lang">${escapeHtml(displayLang)}</span>
                <button type="button" class="copy-code-btn" data-code="${encodedRaw}">Copy</button>
              </div>
              <pre><code class="hljs language-${escapeHtml(displayLang)}">${highlighted}</code></pre>
            </div>
          `;
        },

        blockquote({ tokens }) {
          const innerHtml = this.parser.parse(tokens);
          const alertMatch = innerHtml.match(
            /^\s*<p>\s*\[!(MENTAL_MODEL|REALWORLD|TIP|IMPORTANT|WARNING|CAUTION|NOTE)\]\s*(?:<br\s*\/?>|\n)?([\s\S]*)$/i
          );
          if (alertMatch) {
            const key = alertMatch[1].toUpperCase();
            const cfg = CALLOUT_CONFIG[key] || CALLOUT_CONFIG.NOTE;
            const bodyContent = `<p>${alertMatch[2]}`;
            return `
              <div class="callout callout-${cfg.variant}">
                <div class="callout-title">
                  <span class="callout-icon">${cfg.icon}</span>
                  <span>${cfg.label}</span>
                </div>
                <div class="callout-body">${bodyContent}</div>
              </div>
            `;
          }
          return `<blockquote>${innerHtml}</blockquote>\n`;
        },

        listitem(item) {
          let itemBody = '';
          if (item.tokens) {
            itemBody = this.parser.parse(item.tokens, !!item.loose);
          } else {
            itemBody = item.text || '';
          }

          if (item.task) {
            const stepKey = makeStepKey(item.text || '');
            const isChecked = !!checkedSteps[stepKey];
            const cleanBody = itemBody.replace(/^<p>([\s\S]*)<\/p>\s*$/, '$1');
            return `
              <li class="task-list-item ${isChecked ? 'is-checked' : ''}">
                <label class="task-label">
                  <input type="checkbox" class="task-checkbox" data-step-key="${stepKey}" ${
              isChecked ? 'checked' : ''
            } />
                  <span class="task-text">${cleanBody}</span>
                </label>
              </li>
            `;
          }
          return `<li>${itemBody}</li>\n`;
        },
      },
    });

    return renderer.parse(markdown || '');
  }, [markdown, checkedSteps]);

  // Render Mermaid diagrams after HTML mounts or theme changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const mermaidNodes = el.querySelectorAll('pre.mermaid');
    if (mermaidNodes.length === 0) return;

    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, system-ui, sans-serif',
    });

    let cancelled = false;
    (async () => {
      try {
        // Reset processed attributes if re-rendering on theme change
        mermaidNodes.forEach((node) => {
          node.removeAttribute('data-processed');
        });
        if (!cancelled) {
          await mermaid.run({ nodes: mermaidNodes });
        }
      } catch (err) {
        console.warn('Mermaid render error:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [html, theme]);

  // Handle interactive copy buttons & lab checkboxes via event delegation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleClick = async (e) => {
      const copyBtn = e.target.closest('.copy-code-btn');
      if (copyBtn) {
        const raw = decodeURIComponent(copyBtn.getAttribute('data-code') || '');
        try {
          await navigator.clipboard.writeText(raw);
          copyBtn.textContent = 'Copied!';
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.textContent = 'Copy';
            copyBtn.classList.remove('copied');
          }, 1600);
        } catch {
          copyBtn.textContent = 'Failed';
        }
      }
    };

    const handleChange = (e) => {
      const checkbox = e.target.closest('.task-checkbox');
      if (checkbox && onToggleStep) {
        const stepKey = checkbox.getAttribute('data-step-key');
        if (stepKey) {
          onToggleStep(stepKey, checkbox.checked);
        }
      }
    };

    el.addEventListener('click', handleClick);
    el.addEventListener('change', handleChange);
    return () => {
      el.removeEventListener('click', handleClick);
      el.removeEventListener('change', handleChange);
    };
  }, [onToggleStep]);

  return (
    <div
      ref={containerRef}
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
