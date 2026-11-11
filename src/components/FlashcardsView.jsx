import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
  Sparkles,
} from 'lucide-react';

export default function FlashcardsView({
  flashcards = [],
  knownIndices = [],
  onUpdateKnown,
}) {
  const [order, setOrder] = useState(() => flashcards.map((_, i) => i));
  const [cursor, setCursor] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setOrder(flashcards.map((_, i) => i));
    setCursor(0);
    setFlipped(false);
  }, [flashcards]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (
        e.target.tagName === 'TEXTAREA' ||
        e.target.tagName === 'INPUT'
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.code === 'ArrowRight') {
        setFlipped(false);
        setCursor((c) => Math.min(order.length - 1, c + 1));
      } else if (e.code === 'ArrowLeft') {
        setFlipped(false);
        setCursor((c) => Math.max(0, c - 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [order.length]);

  if (!flashcards.length) {
    return (
      <div className="empty-panel">
        <Sparkles size={32} />
        <h3>No Flashcards Yet</h3>
        <p>
          Add a <code>flashcards:</code> list to this topic&apos;s YAML
          frontmatter to practice active recall here.
        </p>
      </div>
    );
  }

  const realIdx = order[cursor] ?? 0;
  const card = flashcards[realIdx];
  const isKnown = knownIndices.includes(realIdx);

  const handleShuffle = () => {
    const copy = [...order];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    setOrder(copy);
    setCursor(0);
    setFlipped(false);
  };

  const toggleKnown = () => {
    if (!onUpdateKnown) return;
    const next = isKnown
      ? knownIndices.filter((idx) => idx !== realIdx)
      : [...knownIndices, realIdx];
    onUpdateKnown(next);
  };

  return (
    <div className="flashcards-container">
      <div className="flashcards-toolbar">
        <div className="flashcards-stats">
          <span className="pill pill-accent">
            Card {cursor + 1} / {order.length}
          </span>
          <span className="pill pill-success">
            Mastered {knownIndices.length} / {flashcards.length}
          </span>
        </div>
        <div className="flashcards-actions">
          <button type="button" className="btn btn-ghost" onClick={handleShuffle}>
            <Shuffle size={15} /> Shuffle
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => onUpdateKnown && onUpdateKnown([])}
            disabled={knownIndices.length === 0}
          >
            <RotateCcw size={15} /> Reset Mastery
          </button>
        </div>
      </div>

      <div
        className={`flashcard-stage ${flipped ? 'is-flipped' : ''}`}
        onClick={() => setFlipped((f) => !f)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') setFlipped((f) => !f);
        }}
      >
        <div className="flashcard-inner">
          <div className="flashcard-face flashcard-front">
            <div className="flashcard-label">
              <span>Question / Prompt</span>
              {isKnown && (
                <span className="known-tag">
                  <CheckCircle2 size={14} /> Known
                </span>
              )}
            </div>
            <div className="flashcard-content">{card.front}</div>
            <div className="flashcard-hint">Click or press Space to flip</div>
          </div>

          <div className="flashcard-face flashcard-back">
            <div className="flashcard-label">
              <span>Answer / Explanation</span>
              {isKnown && (
                <span className="known-tag">
                  <CheckCircle2 size={14} /> Known
                </span>
              )}
            </div>
            <div className="flashcard-content">{card.back}</div>
            <div className="flashcard-hint">Click or press Space to flip back</div>
          </div>
        </div>
      </div>

      <div className="flashcards-controls">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={cursor === 0}
          onClick={() => {
            setFlipped(false);
            setCursor((c) => Math.max(0, c - 1));
          }}
        >
          <ChevronLeft size={16} /> Previous
        </button>

        <button
          type="button"
          className={`btn ${isKnown ? 'btn-success' : 'btn-primary'}`}
          onClick={toggleKnown}
        >
          <CheckCircle2 size={16} />
          {isKnown ? 'Mastered (Undo)' : 'Got It!'}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          disabled={cursor >= order.length - 1}
          onClick={() => {
            setFlipped(false);
            setCursor((c) => Math.min(order.length - 1, c + 1));
          }}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
