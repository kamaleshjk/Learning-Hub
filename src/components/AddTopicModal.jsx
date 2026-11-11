import React, { useRef, useState } from 'react';
import { Check, Copy, FilePlus2, FolderOpen, Sparkles, X } from 'lucide-react';

const PROMPT_TEMPLATE = `I collected these study resources for [TOPIC NAME].
Please use the add-study-topic skill and create ONE practical, deeply explainable topic file inside topics/[topic-slug].md with mental models, Mermaid architecture diagrams, hands-on lab checklists, flashcards, and a self-check quiz.

Resources:
[Paste your links, notes, or file paths here]`;

export default function AddTopicModal({ isOpen, onClose, onImportFile }) {
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(PROMPT_TEMPLATE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onImportFile(file.name, text);
    e.target.value = '';
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="modal-title-row">
            <Sparkles size={20} className="accent-icon" />
            <h2>Add a New Study Topic</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="workflow-steps">
            <div className="workflow-step">
              <span className="step-badge">1</span>
              <div>
                <h4>Collect Your Resources</h4>
                <p>
                  Gather docs, PDFs, YouTube transcripts, blog posts, or rough
                  notes for anything you want to master (e.g. AWS IoT Core,
                  Kubernetes Networking, Rust Async).
                </p>
              </div>
            </div>

            <div className="workflow-step">
              <span className="step-badge">2</span>
              <div>
                <h4>Give Them to Antigravity IDE</h4>
                <p>
                  Open this project in Antigravity IDE and paste your resources
                  with a prompt like this. The built-in{' '}
                  <code>add-study-topic</code> skill &amp; <code>GEMINI.md</code>{' '}
                  automatically format everything into{' '}
                  <strong>one file</strong> inside <code>topics/</code>.
                </p>
              </div>
            </div>

            <div className="prompt-box">
              <div className="prompt-box-bar">
                <span>Prompt for Antigravity IDE</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleCopyPrompt}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy Prompt'}
                </button>
              </div>
              <pre>{PROMPT_TEMPLATE}</pre>
            </div>

            <div className="workflow-step">
              <span className="step-badge">3</span>
              <div>
                <h4>Appears Automatically in Your App</h4>
                <p>
                  As soon as Antigravity saves{' '}
                  <code>topics/your-topic.md</code>, this webpage automatically
                  discovers and renders it with diagrams, labs, flashcards, and
                  quizzes.
                </p>
              </div>
            </div>
          </div>

          <div className="modal-divider">
            <span>or quick-import a standalone .md file in browser</span>
          </div>

          <div className="import-row">
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown,text/markdown"
              hidden
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <FilePlus2 size={16} /> Import .md File (Browser Local)
            </button>
            <span className="muted-text">
              <FolderOpen size={14} style={{ verticalAlign: 'middle' }} />{' '}
              Recommended: save directly to <code>topics/</code>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
