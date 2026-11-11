import React, { useState } from 'react';
import { Award, CheckCircle2, HelpCircle, RotateCcw, XCircle } from 'lucide-react';

export default function QuizView({ quiz = [], savedResult, onSaveResult }) {
  const [answers, setAnswers] = useState(() => savedResult?.answers || {});
  const [submitted, setSubmitted] = useState(() => Boolean(savedResult));

  if (!quiz.length) {
    return (
      <div className="empty-panel">
        <HelpCircle size={32} />
        <h3>No Quiz Questions Yet</h3>
        <p>
          Add a <code>quiz:</code> list to this topic&apos;s YAML frontmatter to
          test your practical understanding.
        </p>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const score = quiz.reduce(
    (acc, q, idx) => (answers[idx] === q.answer ? acc + 1 : acc),
    0
  );
  const percent = Math.round((score / quiz.length) * 100);

  const handleSelect = (qIdx, optIdx) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (onSaveResult) {
      onSaveResult({
        score,
        total: quiz.length,
        percent,
        answers,
        completedAt: new Date().toISOString(),
      });
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setSubmitted(false);
    if (onSaveResult) {
      onSaveResult(null);
    }
  };

  return (
    <div className="quiz-container">
      <div className="quiz-header-bar">
        <div>
          <h3>Self-Check Knowledge Quiz</h3>
          <p className="muted-text">
            {submitted
              ? `You scored ${score} out of ${quiz.length} (${percent}%)`
              : `Answer all ${quiz.length} questions and submit to check explanations.`}
          </p>
        </div>
        {submitted && (
          <div className="quiz-score-badge">
            <Award size={18} />
            <span>{percent}%</span>
          </div>
        )}
      </div>

      <div className="quiz-list">
        {quiz.map((q, qIdx) => {
          const picked = answers[qIdx];
          const isCorrect = picked === q.answer;
          return (
            <div
              key={qIdx}
              className={`quiz-card ${
                submitted ? (isCorrect ? 'is-correct' : 'is-wrong') : ''
              }`}
            >
              <div className="quiz-question">
                <span className="quiz-q-num">Q{qIdx + 1}.</span>
                <span>{q.question}</span>
              </div>

              <div className="quiz-options">
                {q.options.map((opt, optIdx) => {
                  const selected = picked === optIdx;
                  const isRightAnswer = q.answer === optIdx;
                  let stateClass = '';
                  if (submitted) {
                    if (isRightAnswer) stateClass = 'opt-correct';
                    else if (selected && !isRightAnswer) stateClass = 'opt-wrong';
                  } else if (selected) {
                    stateClass = 'opt-selected';
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      className={`quiz-option ${stateClass}`}
                      onClick={() => handleSelect(qIdx, optIdx)}
                      disabled={submitted}
                    >
                      <span className="opt-letter">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="opt-text">{opt}</span>
                      {submitted && isRightAnswer && (
                        <CheckCircle2 size={16} className="opt-icon" />
                      )}
                      {submitted && selected && !isRightAnswer && (
                        <XCircle size={16} className="opt-icon" />
                      )}
                    </button>
                  );
                })}
              </div>

              {submitted && q.explanation && (
                <div className="quiz-explanation">
                  <strong>Why:</strong> {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="quiz-footer">
        {!submitted ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={answeredCount < quiz.length}
            onClick={handleSubmit}
          >
            Submit Quiz ({answeredCount}/{quiz.length} answered)
          </button>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={handleRetake}>
            <RotateCcw size={16} /> Retake Quiz
          </button>
        )}
      </div>
    </div>
  );
}
