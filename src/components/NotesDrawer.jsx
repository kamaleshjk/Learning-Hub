import React, { useState } from 'react';
import { Copy, Download, StickyNote, X } from 'lucide-react';

export default function NotesDrawer({
  isOpen,
  onClose,
  topicTitle,
  topicSlug,
  notes,
  onChangeNotes,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(notes || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    const content = `# My Notes: ${topicTitle}\n\n${notes || ''}`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topicSlug}-notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = (notes || '').trim()
    ? (notes || '').trim().split(/\s+/).length
    : 0;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="notes-drawer"
        onClick={(e) => e.stopPropagation()}
        aria-label="Personal topic notes"
      >
        <div className="notes-drawer-header">
          <div className="notes-title-row">
            <StickyNote size={18} />
            <div>
              <h3>Personal Study Notes</h3>
              <span className="muted-text">{topicTitle}</span>
            </div>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close notes"
          >
            <X size={18} />
          </button>
        </div>

        <textarea
          className="notes-textarea"
          value={notes}
          onChange={(e) => onChangeNotes(e.target.value)}
          placeholder="Jot down your takeaways, CLI commands you tested, architecture questions, or interview reminders... (Auto-saved locally)"
        />

        <div className="notes-drawer-footer">
          <span className="muted-text">{wordCount} words · Auto-saved</span>
          <div className="notes-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleCopy}
              disabled={!notes}
            >
              <Copy size={14} /> {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDownload}
              disabled={!notes}
            >
              <Download size={14} /> Export .md
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
