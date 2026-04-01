'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { QUESTIONS, type Answer, type DiagnosticAnswers, encodeAnswers } from '@/lib/diagnostic';

type Phase = 'landing' | 'quiz' | 'analyzing';

export default function Home() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('landing');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Partial<DiagnosticAnswers>>({});
  const [selected, setSelected] = useState<Answer | null>(null);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [animating, setAnimating] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const [dotCount, setDotCount] = useState(0);

  // Analyzing dot animation
  useEffect(() => {
    if (phase !== 'analyzing') return;
    const interval = setInterval(() => {
      setDotCount(d => (d + 1) % 4);
    }, 400);
    return () => clearInterval(interval);
  }, [phase]);

  // Navigate to results after analyzing
  useEffect(() => {
    if (phase !== 'analyzing') return;
    const timer = setTimeout(() => {
      router.push(`/results?${encodeAnswers(answers as DiagnosticAnswers)}`);
    }, 2200);
    return () => clearTimeout(timer);
  }, [phase, answers, router]);

  const questionKey = `q${current + 1}` as keyof DiagnosticAnswers;
  const currentAnswer = answers[questionKey];

  const handleStart = () => {
    setScanActive(true);
    setTimeout(() => {
      setPhase('quiz');
      setScanActive(false);
    }, 600);
  };

  const handleSelect = useCallback((val: Answer) => {
    if (animating) return;
    setSelected(val);

    // Brief pause then advance
    setTimeout(() => {
      const newAnswers = { ...answers, [questionKey]: val };
      setAnswers(newAnswers);

      if (current < QUESTIONS.length - 1) {
        setAnimating(true);
        setDirection('forward');
        setTimeout(() => {
          setCurrent(c => c + 1);
          setSelected(null);
          setAnimating(false);
        }, 300);
      } else {
        // Done
        setPhase('analyzing');
        setScanActive(true);
      }
    }, 350);
  }, [animating, answers, current, questionKey]);

  const handleBack = () => {
    if (current === 0 || animating) return;
    setAnimating(true);
    setDirection('back');
    setTimeout(() => {
      setCurrent(c => c - 1);
      const prevKey = `q${current}` as keyof DiagnosticAnswers;
      setSelected(answers[prevKey] || null);
      setAnimating(false);
    }, 300);
  };

  const progress = phase === 'quiz' ? ((current) / QUESTIONS.length) * 100 : phase === 'analyzing' ? 100 : 0;
  const q = QUESTIONS[current];

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative' }}>
      {scanActive && <div className="scan-line" />}

      {/* Landing */}
      {phase === 'landing' && (
        <div style={{ maxWidth: '600px', width: '100%', textAlign: 'center', animation: 'fadeIn 600ms ease' }}>
          {/* Logo mark */}
          <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              padding: '6px 14px',
              border: '1px solid rgba(0, 229, 204, 0.2)',
              borderRadius: '4px',
              background: 'rgba(0, 229, 204, 0.06)'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--signal)', boxShadow: 'var(--signal-glow)', display: 'inline-block' }} />
              <span className="font-display" style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--signal)', textTransform: 'uppercase' }}>CMPRSSN Research</span>
            </div>
          </div>

          <h1 className="font-display" style={{
            fontSize: 'clamp(1.8rem, 5vw, 3rem)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            marginBottom: '20px',
            color: 'var(--frost)'
          }}>
            Agentic Composition{' '}
            <span className="gradient-text">Diagnostic</span>
          </h1>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '12px' }}>
            CMPRSSN is mapping how operators couple with AI agents across the frontier.
            Answer 10 questions and receive a scored diagnostic showing where your composition sits relative to other operators.
          </p>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginBottom: '48px', lineHeight: 1.6 }}>
            5 dimensions · 2 minutes · No signup required
          </p>

          <button
            onClick={handleStart}
            style={{
              padding: '14px 32px',
              background: 'linear-gradient(135deg, rgba(0,229,204,0.15) 0%, rgba(74,158,191,0.1) 100%)',
              border: '1px solid var(--signal)',
              borderRadius: '6px',
              color: 'var(--signal)',
              fontFamily: 'var(--font-display)',
              fontSize: '0.875rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              boxShadow: 'var(--signal-glow)',
            }}
            onMouseEnter={e => {
              (e.target as HTMLButtonElement).style.background = 'rgba(0,229,204,0.2)';
              (e.target as HTMLButtonElement).style.boxShadow = '0 0 30px rgba(0,229,204,0.5)';
            }}
            onMouseLeave={e => {
              (e.target as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(0,229,204,0.15) 0%, rgba(74,158,191,0.1) 100%)';
              (e.target as HTMLButtonElement).style.boxShadow = 'var(--signal-glow)';
            }}
          >
            Initialize Diagnostic
          </button>

          <div style={{ marginTop: '64px', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Built by Sedim3nt · Part of the CMPRSSN Q2 2026 Field Study
            </p>
          </div>
        </div>
      )}

      {/* Quiz */}
      {phase === 'quiz' && (
        <div style={{ maxWidth: '640px', width: '100%' }}>
          {/* Progress bar */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span className="font-display" style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'var(--signal)', textTransform: 'uppercase' }}>
                {q.dimension}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                {current + 1} / {QUESTIONS.length}
              </span>
            </div>
            <div style={{ height: '2px', background: 'rgba(0,229,204,0.1)', borderRadius: '1px', overflow: 'hidden' }}>
              <div className="progress-fill" style={{ width: `${((current + 1) / QUESTIONS.length) * 100}%` }} />
            </div>
          </div>

          {/* Question */}
          <div style={{
            opacity: animating ? 0 : 1,
            transform: animating
              ? direction === 'forward' ? 'translateX(-20px)' : 'translateX(20px)'
              : 'translateX(0)',
            transition: 'opacity 250ms ease, transform 250ms ease',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
              lineHeight: 1.35,
              letterSpacing: '-0.01em',
              color: 'var(--frost)',
              marginBottom: '32px',
            }}>
              {q.question}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {q.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`answer-btn${selected === opt.value || currentAnswer === opt.value ? ' selected' : ''}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <span style={{ flex: 1 }}>{opt.label}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>{opt.sublabel}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
            <button
              onClick={handleBack}
              disabled={current === 0}
              style={{
                background: 'none',
                border: '1px solid var(--border-default)',
                borderRadius: '6px',
                padding: '8px 16px',
                color: current === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                cursor: current === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 200ms ease',
              }}
            >
              ← Back
            </button>
            <div style={{ display: 'flex', gap: '6px' }}>
              {QUESTIONS.map((_, i) => (
                <div key={i} style={{
                  width: i === current ? '20px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: i < current
                    ? 'var(--signal)'
                    : i === current
                    ? 'linear-gradient(90deg, var(--signal), var(--steel))'
                    : 'var(--border-default)',
                  transition: 'all 300ms ease',
                  boxShadow: i <= current ? '0 0 6px rgba(0,229,204,0.3)' : 'none',
                }} />
              ))}
            </div>
            <div style={{ width: '80px' }} />
          </div>
        </div>
      )}

      {/* Analyzing */}
      {phase === 'analyzing' && (
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          {/* Animated radar skeleton */}
          <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 40px' }}>
            <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Concentric rings */}
              {[80, 60, 40, 20].map((r, i) => (
                <circle
                  key={r}
                  cx="100" cy="100" r={r}
                  fill="none"
                  stroke="rgba(0,229,204,0.1)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  style={{ animation: `pulse-signal ${2 + i * 0.3}s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}
                />
              ))}
              {/* Axes */}
              {[0, 72, 144, 216, 288].map((angle, i) => {
                const rad = (angle - 90) * Math.PI / 180;
                return (
                  <line
                    key={angle}
                    x1="100" y1="100"
                    x2={100 + 80 * Math.cos(rad)}
                    y2={100 + 80 * Math.sin(rad)}
                    stroke="rgba(0,229,204,0.2)"
                    strokeWidth="1"
                    style={{ animation: `pulse-signal 1.5s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }}
                  />
                );
              })}
              {/* Scanning dot */}
              <circle cx="100" cy="100" r="4" fill="var(--signal)" style={{ animation: 'pulse-signal 1s ease-in-out infinite' }} />
            </svg>
          </div>

          <div className="font-display" style={{
            fontSize: '1.1rem',
            color: 'var(--signal)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}>
            Analyzing Composition{'.'.repeat(dotCount)}
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
            Scoring 5 dimensions against the operator cohort
          </p>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
