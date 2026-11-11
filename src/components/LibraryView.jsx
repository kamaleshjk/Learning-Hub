import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Wrench,
} from 'lucide-react';
import { getTopicProgress } from '../utils/storage';

const STATUS_META = {
  'not-started': { label: 'Not Started', className: 'status-idle' },
  'in-progress': { label: 'In Progress', className: 'status-progress' },
  mastered: { label: 'Mastered', className: 'status-mastered' },
};

export default function LibraryView({
  topics,
  allProgress,
  onSelectTopic,
  onOpenAddModal,
  onRemoveImported,
}) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const categories = useMemo(() => {
    const set = new Set(topics.map((t) => t.meta.category).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [topics]);

  const stats = useMemo(() => {
    let mastered = 0;
    let inProgress = 0;
    let labsCompleted = 0;
    let totalLabSteps = 0;

    for (const t of topics) {
      const p = getTopicProgress(allProgress, t.id);
      if (p.status === 'mastered') mastered++;
      else if (p.status === 'in-progress') inProgress++;
      const doneCount = Object.values(p.checkedSteps || {}).filter(Boolean).length;
      labsCompleted += Math.min(doneCount, t.totalLabSteps);
      totalLabSteps += t.totalLabSteps;
    }

    return {
      total: topics.length,
      mastered,
      inProgress,
      labsCompleted,
      totalLabSteps,
    };
  }, [topics, allProgress]);

  const filteredTopics = useMemo(() => {
    const q = query.trim().toLowerCase();
    return topics.filter((t) => {
      const p = getTopicProgress(allProgress, t.id);
      if (categoryFilter !== 'All' && t.meta.category !== categoryFilter) {
        return false;
      }
      if (statusFilter !== 'All' && p.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      const hay = [
        t.meta.title,
        t.meta.summary,
        t.meta.category,
        ...(t.meta.tags || []),
        t.body.slice(0, 2000),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [topics, allProgress, query, categoryFilter, statusFilter]);

  return (
    <div className="library-page">
      <section className="hero-banner">
        <div className="hero-text">
          <div className="hero-kicker">
            <Sparkles size={14} /> Personal Knowledge &amp; Practice Studio
          </div>
          <h1>Learn Deeply. Practice Immediately.</h1>
          <p>
            Drop study resources into Antigravity IDE to generate one rich,
            practical guide per topic — complete with diagrams, hands-on labs,
            flashcards, and quizzes.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={onOpenAddModal}
        >
          <Plus size={18} /> Add Study Topic
        </button>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-indigo">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Study Topics</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-emerald">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="stat-value">{stats.mastered}</div>
            <div className="stat-label">Mastered</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-amber">
            <Layers size={20} />
          </div>
          <div>
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-cyan">
            <Wrench size={20} />
          </div>
          <div>
            <div className="stat-value">
              {stats.labsCompleted}
              <span className="stat-sub">/{stats.totalLabSteps}</span>
            </div>
            <div className="stat-label">Lab Steps Done</div>
          </div>
        </div>
      </section>

      <section className="filters-bar">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics, tags, concepts, commands..."
          />
        </div>

        <div className="filter-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`filter-pill ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <select
          className="status-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by study status"
        >
          <option value="All">All Statuses</option>
          <option value="not-started">Not Started</option>
          <option value="in-progress">In Progress</option>
          <option value="mastered">Mastered</option>
        </select>
      </section>

      {filteredTopics.length === 0 ? (
        <div className="empty-panel">
          <BookOpen size={36} />
          <h3>No matching topics found</h3>
          <p>
            Try clearing your search filter, or ask Antigravity IDE to generate
            a new topic file inside <code>topics/</code>.
          </p>
        </div>
      ) : (
        <section className="topics-grid">
          {filteredTopics.map((topic) => {
            const p = getTopicProgress(allProgress, topic.id);
            const statusInfo =
              STATUS_META[p.status] || STATUS_META['not-started'];
            const doneSteps = Object.values(p.checkedSteps || {}).filter(
              Boolean
            ).length;
            const labPercent =
              topic.totalLabSteps > 0
                ? Math.min(
                    100,
                    Math.round((doneSteps / topic.totalLabSteps) * 100)
                  )
                : 0;

            return (
              <article
                key={topic.id}
                className="topic-card"
                onClick={() => onSelectTopic(topic.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSelectTopic(topic.id);
                }}
              >
                <div className="topic-card-top">
                  <span className="category-badge">{topic.meta.category}</span>
                  <span className={`status-badge ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <h2 className="topic-card-title">{topic.meta.title}</h2>
                <p className="topic-card-summary">
                  {topic.meta.summary || 'Open topic to begin studying.'}
                </p>

                <div className="topic-tags">
                  {(topic.meta.tags || []).slice(0, 4).map((tag) => (
                    <span key={tag} className="tag-chip">
                      <Tag size={11} /> {tag}
                    </span>
                  ))}
                </div>

                <div className="topic-card-meta">
                  <span>
                    <Clock size={13} /> {topic.meta.estimatedTime}
                  </span>
                  <span>{topic.meta.difficulty}</span>
                  {p.quizResult && (
                    <span className="quiz-mini-score">
                      Quiz {p.quizResult.percent}%
                    </span>
                  )}
                </div>

                {topic.totalLabSteps > 0 && (
                  <div className="lab-progress-wrap">
                    <div className="lab-progress-head">
                      <span>Labs Progress</span>
                      <span>
                        {Math.min(doneSteps, topic.totalLabSteps)}/
                        {topic.totalLabSteps} steps
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${labPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {topic.source === 'imported' && (
                  <button
                    type="button"
                    className="remove-imported-btn"
                    title="Remove browser-imported topic"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImported(topic.fileName);
                    }}
                  >
                    <Trash2 size={13} /> Remove imported
                  </button>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
