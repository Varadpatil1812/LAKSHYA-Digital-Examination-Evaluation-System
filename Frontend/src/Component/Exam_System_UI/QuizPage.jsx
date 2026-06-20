import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQuestionsBySubject, submitExamResult } from "../Service/QuizService";
import "./Styles/QuizPage.css";

const TIMER_SECONDS = 15;

const QuizPage = () => {
  const { subject } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [phase, setPhase]               = useState("start"); // "start"|"exam"|"submitting"|"result"
  const [currentIdx, setCurrentIdx]     = useState(0);
  const [answers, setAnswers]           = useState({});
  const [timeLeft, setTimeLeft]         = useState(TIMER_SECONDS);
  const [autoAdvanced, setAutoAdvanced] = useState(false);
  const [score, setScore]               = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const [submitError, setSubmitError]   = useState("");

  // ── single ref for interval — no duplicates
  const timerRef      = useRef(null);
  const currentIdxRef = useRef(0);

  // keep ref in sync
  useEffect(() => {
    currentIdxRef.current = currentIdx;
  }, [currentIdx]);

  // ── fetch questions
  useEffect(() => {
    (async () => {
      try {
        const res = await getQuestionsBySubject(subject);
        setQuestions(res.data);
      } catch (e) {
        setError("Failed to load questions. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [subject]);

  // ── timer — runs once per question
  useEffect(() => {
    if (phase !== "exam") return;
    if (currentIdx >= questions.length) return;

    clearInterval(timerRef.current);
    setTimeLeft(TIMER_SECONDS);
    setAutoAdvanced(false);

    let seconds = TIMER_SECONDS;

    timerRef.current = setInterval(() => {
      seconds -= 1;
      setTimeLeft(seconds);

      if (seconds <= 0) {
        clearInterval(timerRef.current);
        setAutoAdvanced(true);

        setTimeout(() => {
          const next = currentIdxRef.current + 1;
          if (next >= questions.length) {
            setPhase("submitting");
          } else {
            setCurrentIdx(next);
          }
        }, 800);
      }
    }, 1000);

    return () => clearInterval(timerRef.current);

  }, [phase, currentIdx, questions.length]);

  // ── trigger submit when phase = submitting
  useEffect(() => {
    if (phase === "submitting") {
      handleSubmit();
    }
  }, [phase]);

  // ── submit
  const handleSubmit = async () => {
    clearInterval(timerRef.current);
    setSubmitting(true);
    setSubmitError("");

    let count = 0;
    questions.forEach(q => {
      if (answers[q.id] && answers[q.id] === q.correctAnswer) count++;
    });
    setScore(count);

    try {
      await submitExamResult(subject, count, questions.length);
    } catch (e) {
      setSubmitError("Result saved locally but failed to sync with server.");
    } finally {
      setSubmitting(false);
      setPhase("result");
    }
  };

  const handleSelect = (questionId, choice) => {
    setAnswers(prev => ({ ...prev, [questionId]: choice }));
  };

  const handleNext = () => {
    clearInterval(timerRef.current);
    const next = currentIdx + 1;
    if (next >= questions.length) {
      setPhase("submitting");
    } else {
      setCurrentIdx(next);
    }
  };

  // ── timer ring
  const timerPct     = (timeLeft / TIMER_SECONDS) * 100;
  const timerColor   = timeLeft > 8 ? "var(--primary)" : timeLeft > 4 ? "#f5a623" : "#ff4757";
  const circumference = 2 * Math.PI * 22;
  const dashOffset   = circumference * (1 - timerPct / 100);

  // ── loading / error
  if (loading) return (
    <div className="qp-center">
      <div className="qp-spinner" />
      <p className="qp-loading-text">Loading questions…</p>
    </div>
  );

  if (error) return (
    <div className="qp-center">
      <p className="qp-error">{error}</p>
      <button className="qp-btn" onClick={() => navigate("/attempt-exam")}>Back</button>
    </div>
  );

  // ── START SCREEN
  if (phase === "start") return (
    <div className="qp-start-screen">
      <div className="qp-start-card">
        <div className="qp-subject-icon">📋</div>
        <h1 className="qp-title">{subject} Exam</h1>
        <div className="qp-info-grid">
          <div className="qp-info-item">
            <span className="qp-info-label">Questions</span>
            <span className="qp-info-value">{questions.length}</span>
          </div>
          <div className="qp-info-item">
            <span className="qp-info-label">Time / Question</span>
            <span className="qp-info-value">{TIMER_SECONDS}s</span>
          </div>
          <div className="qp-info-item">
            <span className="qp-info-label">Total Time</span>
            <span className="qp-info-value">{questions.length * TIMER_SECONDS}s</span>
          </div>
        </div>
        <ul className="qp-rules">
          <li>⏱ Each question has a <strong>{TIMER_SECONDS}-second</strong> timer</li>
          <li>🔒 Unanswered questions auto-advance when time runs out</li>
          <li>✅ Select an option and click <strong>Next</strong> to proceed</li>
          <li>🚫 You cannot go back to previous questions</li>
        </ul>
        <button className="qp-btn qp-btn-start" onClick={() => setPhase("exam")}>
          Start Exam
        </button>
      </div>
    </div>
  );

  // ── SAVING SCREEN
  if (phase === "submitting" || submitting) return (
    <div className="qp-center">
      <div className="qp-spinner" />
      <p className="qp-loading-text">Saving your result…</p>
    </div>
  );

  // ── RESULT SCREEN
  if (phase === "result") {
    const pct        = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const grade      = pct >= 90 ? "A+" : pct >= 75 ? "A" : pct >= 60 ? "B" : pct >= 45 ? "C" : "F";
    const gradeColor = pct >= 60 ? "var(--primary)" : pct >= 45 ? "#f5a623" : "#ff4757";

    return (
      <div className="qp-result-screen">
        <div className="qp-result-card">
          <h2 className="qp-result-title">Exam Complete!</h2>
          <p className="qp-result-subject">{subject}</p>
          <div className="qp-score-ring-wrap">
            <svg width="140" height="140" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" fill="none" stroke="var(--surface3)" strokeWidth="5" />
              <circle cx="28" cy="28" r="22" fill="none"
                stroke={gradeColor} strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pct / 100)}
                strokeLinecap="round"
                transform="rotate(-90 28 28)"
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div className="qp-score-ring-label">
              <span className="qp-score-pct" style={{ color: gradeColor }}>{pct}%</span>
              <span className="qp-score-grade" style={{ color: gradeColor }}>{grade}</span>
            </div>
          </div>
          <div className="qp-result-stats">
            <div className="qp-stat"><span>Correct</span><strong style={{ color: "var(--primary)" }}>{score}</strong></div>
            <div className="qp-stat"><span>Wrong</span><strong style={{ color: "#ff4757" }}>{questions.length - score}</strong></div>
            <div className="qp-stat"><span>Total</span><strong>{questions.length}</strong></div>
          </div>
          {submitError && <p className="qp-warn">{submitError}</p>}
          <div className="qp-result-actions">
            <button className="qp-btn" onClick={() => navigate("/attempt-exam")}>All Exams</button>
            <button className="qp-btn qp-btn-start" onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  // ── EXAM SCREEN
  const q = questions[currentIdx];
  if (!q) return null;
  const selectedChoice = answers[q.id];
  const isLast = currentIdx + 1 >= questions.length;

  return (
    <div className="qp-exam-screen">
      <div className="qp-exam-header">
        <span className="qp-exam-subject">{subject}</span>
        <span className="qp-exam-progress">
          Question <strong>{currentIdx + 1}</strong> / {questions.length}
        </span>
        <div className="qp-timer-wrap">
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="22" fill="none" stroke="var(--surface3)" strokeWidth="4" />
            <circle cx="28" cy="28" r="22" fill="none"
              stroke={timerColor} strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 28 28)"
              style={{ transition: "stroke-dashoffset 0.9s linear" }}
            />
          </svg>
          <span className="qp-timer-num" style={{ color: timerColor }}>
            {autoAdvanced ? "⏱" : timeLeft}
          </span>
        </div>
      </div>

      <div className="qp-progress-bar">
        <div className="qp-progress-fill"
          style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
      </div>

      {autoAdvanced && (
        <div className="qp-timeup-banner">⏰ Time's up! Moving to next question…</div>
      )}

      <div className="qp-question-card">
        <p className="qp-question-num">Q{currentIdx + 1}.</p>
        <h2 className="qp-question-text">{q.question}</h2>
        <ul className="qp-choices">
          {q.choices.map((choice, i) => (
            <li key={i}>
              <button
                className={`qp-choice-btn ${selectedChoice === choice ? "qp-choice-selected" : ""}`}
                onClick={() => handleSelect(q.id, choice)}
                disabled={autoAdvanced}
              >
                <span className="qp-choice-letter">{String.fromCharCode(65 + i)}</span>
                <span className="qp-choice-text">{choice}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="qp-question-footer">
          <span className="qp-answered-hint">
            {selectedChoice ? "✔ Answer selected" : "No answer selected"}
          </span>
          <button
            className={`qp-btn qp-btn-next ${!selectedChoice ? "qp-btn-next-skip" : ""}`}
            onClick={handleNext}
            disabled={autoAdvanced}
          >
            {isLast ? "Finish Exam" : selectedChoice ? "Next →" : "Skip →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;