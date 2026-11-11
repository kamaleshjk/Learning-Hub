import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckSquare,
  Clock,
  ExternalLink,
  FileText,
  HelpCircle,
  Layers,
  StickyNote,
  Tag,
  Wrench,
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import FlashcardsView from './FlashcardsView';
import QuizView from './QuizView';
import NotesDrawer from './NotesDrawer';

export default function TopicWorkspace({
  topic,
  progress,
  theme,
  onBack,
  onUpdateProgress,
}) {
  const [activeTab, setActiveTab] = useState('guide');
  const [notesOpen, setNotesOpen] = useState(false);

  const { meta, body, toc, labSections, totalLabSteps } = topic;
  const checkedSteps = progress.checkedSteps || {};
  const doneLabSteps = useMemo(
    () => Object.values(checkedSteps).filter(Boolean).length,
    [checkedSteps]
  );

  const handleToggleStep = (stepKey, isChecked) => {
    const nextSteps = { ...checkedSteps, [stepKey]: isChecked };
    const nextStatus =
      progress.status === 'not-started' && isChecked
        ? 'in-progress'
        : progress.status;
    onUpdateProgress({ checkedSteps: nextSteps, status: nextStatus });
  };

  const handleStatusChange = (e) => {
    onUpdateProgress({ status: e.target.value });
  };

  const labsCombinedMarkdown = useMemo(() => {
    if (labSections.length === 0) return '';
    return labSections.map((s) => s.markdown).join('\n\n---\n\n');
  }, [labSections]);

  return (
    <div className="workspace-page">
      <div className="workspace-topbar">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Library
        </button>

        <div className="workspace-topbar-actions">
          <select
            className={`status-select status-select-${progress.status}`}
            value={progress.status}
            onChange={handleStatusChange}
            aria-label="Study status"
          >
            <option value="not-started">Not Started</option>
            <option value="in-progress">In Progress</option>
            <option value="mastered">Mastered</option>
          </select>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setNotesOpen(true)}
          >
            <StickyNote size={16} />
            My Notes {progress.notes?.trim() ? '•' : ''}
          </button>
        </div>
      </div>

      <header className="topic-hero">
        <div className="topic-hero-badges">
          <span className="category-badge">{meta.category}</span>
          <span className="pill">{meta.difficulty}</span>
          <span className="pill">
            <Clock size={13} /> {meta.estimatedTime}
          </span>
          <span className="pill muted-pill">
            <FileText size={13} /> topics/{topic.fileName}
          </span>
        </div>

        <h1>{meta.title}</h1>
        {meta.summary && <p className="topic-hero-summary">{meta.summary}</p>}

        <div className="topic-hero-meta-row">
          {meta.tags.length > 0 && (
            <div className="topic-tags">
              {meta.tags.map((t) => (
                <span key={t} className="tag-chip">
                  <Tag size={11} /> {t}
                </span>
              ))}
            </div>
          )}

          {meta.prerequisites.length > 0 && (
            <div className="prereq-row">
              <span className="prereq-label">Prerequisites:</span>
              {meta.prerequisites.map((pre) => (
                <span key={pre} className="prereq-chip">
                  {pre}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <nav className="workspace-tabs" aria-label="Study modes">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'guide' ? 'active' : ''}`}
          onClick={() => setActiveTab('guide')}
        >
          <BookOpen size={16} /> Concept Guide
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'labs' ? 'active' : ''}`}
          onClick={() => setActiveTab('labs')}
        >
          <Wrench size={16} /> Hands-On Labs
          {totalLabSteps > 0 && (
            <span className="tab-count">
              {Math.min(doneLabSteps, totalLabSteps)}/{totalLabSteps}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'flashcards' ? 'active' : ''}`}
          onClick={() => setActiveTab('flashcards')}
        >
          <Layers size={16} /> Flashcards
          {meta.flashcards.length > 0 && (
            <span className="tab-count">{meta.flashcards.length}</span>
          )}
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
          onClick={() => setActiveTab('quiz')}
        >
          <HelpCircle size={16} /> Quiz
          {meta.quiz.length > 0 && (
            <span className="tab-count">
              {progress.quizResult
                ? `${progress.quizResult.percent}%`
                : meta.quiz.length}
            </span>
          )}
        </button>
      </nav>

      {activeTab === 'guide' && (
        <div className="guide-layout">
          <main className="guide-main">
            <MarkdownRenderer
              markdown={body}
              theme={theme}
              checkedSteps={checkedSteps}
              onToggleStep={handleToggleStep}
            />

            {meta.resources.length > 0 && (
              <section className="resources-panel">
                <h3>Collected Study Resources</h3>
                <div className="resources-grid">
                  {meta.resources.map((res, idx) => (
                    <a
                      key={idx}
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="resource-link-card"
                    >
                      <div>
                        <span className="resource-type">
                          {res.type || 'Resource'}
                        </span>
                        <div className="resource-title">{res.title}</div>
                      </div>
                      <ExternalLink size={16} />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </main>

          <aside className="guide-toc">
            <div className="toc-sticky">
              <div className="toc-heading">On This Page</div>
              {toc.length === 0 ? (
                <p className="muted-text">No subsections</p>
              ) : (
                <ul className="toc-list">
                  {toc.map((item) => (
                    <li
                      key={item.id}
                      className={`toc-item toc-level-${item.level}`}
                    >
                      <a href={`#${item.id}`}>{item.text}</a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      )}

      {activeTab === 'labs' && (
        <div className="labs-tab-wrap">
          {totalLabSteps > 0 && (
            <div className="labs-progress-banner">
              <div className="labs-progress-info">
                <CheckSquare size={18} />
                <div>
                  <strong>Practical Lab Progress</strong>
                  <p className="muted-text">
                    Check off each step as you execute it. Your progress is saved
                    automatically.
                  </p>
                </div>
              </div>
              <div className="labs-progress-metric">
                {Math.min(doneLabSteps, totalLabSteps)} / {totalLabSteps} steps
              </div>
            </div>
          )}

          {labsCombinedMarkdown ? (
            <div className="guide-main single-col">
              <MarkdownRenderer
                markdown={labsCombinedMarkdown}
                theme={theme}
                checkedSteps={checkedSteps}
                onToggleStep={handleToggleStep}
              />
            </div>
          ) : (
            <div className="empty-panel">
              <Wrench size={32} />
              <h3>No Dedicated Lab Section Detected</h3>
              <p>
                Include a heading like <code>## Hands-On Lab: ...</code> with
                checkable steps (<code>- [ ] Step 1...</code>) in your topic
                file to practice them here.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'flashcards' && (
        <FlashcardsView
          flashcards={meta.flashcards}
          knownIndices={progress.flashcardKnown || []}
          onUpdateKnown={(next) => onUpdateProgress({ flashcardKnown: next })}
        />
      )}

      {activeTab === 'quiz' && (
        <QuizView
          quiz={meta.quiz}
          savedResult={progress.quizResult}
          onSaveResult={(res) => onUpdateProgress({ quizResult: res })}
        />
      )}

      <NotesDrawer
        isOpen={notesOpen}
        onClose={() => setNotesOpen(false)}
        topicTitle={meta.title}
        topicSlug={meta.slug}
        notes={progress.notes || ''}
        onChangeNotes={(val) => onUpdateProgress({ notes: val })}
      />
    </div>
  );
}
