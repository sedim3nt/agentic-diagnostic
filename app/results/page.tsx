'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState, useEffect, useRef } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip
} from 'recharts';
import {
  decodeAnswers,
  calculateScores,
  getTier,
  DIMENSION_INTERPRETATIONS,
  COHORT_PERCENTILES,
  type DiagnosticAnswers,
} from '@/lib/diagnostic';
import { saveDiagnosticToAirtable } from '@/lib/airtable';

interface CategoryScore {
  name: string;
  score: number;
  interpretation: string;
}

const DIMENSION_LABELS = {
  fleetDepth: 'Fleet Depth',
  governance: 'Governance',
  autonomy: 'Autonomy',
  composability: 'Composability',
  compression: 'Compression',
} as const;

type DimensionKey = keyof typeof DIMENSION_LABELS;
const DIMENSION_KEYS: DimensionKey[] = ['fleetDepth', 'governance', 'autonomy', 'composability', 'compression'];

function ResultsInner() {
  const searchParams = useSearchParams();
  const [shareMsg, setShareMsg] = useState('');
  const [mounted, setMounted] = useState(false);
  const [radarAnimated, setRadarAnimated] = useState(false);
  const [barsVisible, setBarsVisible] = useState(false);
  const cohortRef = useRef<Record<DimensionKey, number> | null>(null);

  useEffect(() => {
    setMounted(true);
    const t1 = setTimeout(() => setRadarAnimated(true), 200);
    const t2 = setTimeout(() => setBarsVisible(true), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const answers = useMemo(() => {
    const search = searchParams.toString();
    return decodeAnswers(search);
  }, [searchParams]);

  const allAnswered = useMemo(() =>
    (['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10'] as Array<keyof DiagnosticAnswers>)
      .every(k => answers[k] !== undefined),
    [answers]
  );

  const scores = useMemo(() => {
    if (!allAnswered) return null;
    return calculateScores(answers as DiagnosticAnswers);
  }, [answers, allAnswered]);

  const tier = useMemo(() => scores ? getTier(scores.overall) : null, [scores]);

  // Save to Airtable on first load
  const [atSaved, setAtSaved] = useState(false);
  useEffect(() => {
    if (!scores || !allAnswered || atSaved || !tier) return;
    setAtSaved(true);
    saveDiagnosticToAirtable({
      scores: scores as unknown as Record<string, number>,
      tier: tier.name,
      overallScore: scores.overall,
    }).catch(console.error);
  }, [scores, allAnswered, atSaved, tier]);

  // Stable cohort percentiles (computed once)
  const cohortPercentiles = useMemo(() => {
    if (!scores || cohortRef.current) return cohortRef.current;
    const result = {} as Record<DimensionKey, number>;
    DIMENSION_KEYS.forEach(k => {
      result[k] = COHORT_PERCENTILES[k](scores[k]);
    });
    cohortRef.current = result;
    return result;
  }, [scores]);

  const radarData = useMemo(() => {
    if (!scores) return [];
    return DIMENSION_KEYS.map(k => ({
      dimension: DIMENSION_LABELS[k],
      score: scores[k],
      fullMark: 5,
    }));
  }, [scores]);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/results?${searchParams.toString()}`;
  }, [searchParams]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMsg('Link copied to clipboard');
    } catch {
      setShareMsg('Copy: ' + shareUrl);
    }
    setTimeout(() => setShareMsg(''), 3000);
  };

  if (!allAnswered) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>No diagnostic data found.</p>
          <a href="/" style={{ color: 'var(--signal)', textDecoration: 'none', fontFamily: 'var(--font-display)', fontSize: '14px' }}>
            ← Take the Diagnostic
          </a>
        </div>
      </main>
    );
  }

  if (!scores || !tier) return null;

  return (
    <main style={{ minHeight: '100vh', padding: 'clamp(32px, 5vw, 64px) clamp(16px, 5vw, 48px)' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '48px', animation: 'fadeIn 600ms ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <a href="/" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 10px',
              border: '1px solid var(--border-default)',
              borderRadius: '4px',
              background: 'rgba(0,229,204,0.04)',
              color: 'var(--text-tertiary)',
              textDecoration: 'none',
              fontSize: '12px',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              transition: 'all 200ms ease',
            }}>
              ← Retake
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
                Diagnostic Result
              </p>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.6rem, 5vw, 2.8rem)',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                color: 'var(--frost)',
              }}>
                You are a{' '}
                <span className="gradient-text">{tier.name}</span>
              </h1>
              <p style={{ marginTop: '10px', color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
                {tier.description}
              </p>
            </div>

            {/* Overall score */}
            <div style={{
              padding: '20px 28px',
              background: 'rgba(14,26,46,0.6)',
              border: `1px solid var(--border-strong)`,
              borderRadius: '12px',
              textAlign: 'center',
              minWidth: '120px',
              flexShrink: 0,
            }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.8rem',
                lineHeight: 1,
                color: 'var(--signal)',
                textShadow: '0 0 20px rgba(0,229,204,0.5)',
              }}>
                {scores.overall.toFixed(1)}
              </div>
              <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: '6px' }}>
                out of 5.0
              </div>
              <div style={{
                marginTop: '10px',
                padding: '4px 10px',
                background: 'rgba(0,229,204,0.1)',
                border: '1px solid rgba(0,229,204,0.3)',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'var(--font-display)',
                color: 'var(--signal)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                {tier.name}
              </div>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: '24px',
          marginBottom: '32px',
          animation: 'fadeIn 600ms ease 200ms backwards',
        }}>
          {/* Radar chart */}
          <div className="card-glass" style={{ padding: '32px', gridColumn: '1 / 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--signal)', boxShadow: 'var(--signal-glow)' }} />
              <span className="font-display" style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                Composition Map
              </span>
            </div>
            <div style={{ height: '280px' }}>
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                    <PolarGrid
                      stroke="rgba(0,229,204,0.1)"
                      strokeDasharray="4 4"
                    />
                    <PolarAngleAxis
                      dataKey="dimension"
                      tick={{
                        fill: 'rgba(226,244,241,0.55)',
                        fontSize: 11,
                        fontFamily: 'Rajdhani, sans-serif',
                        fontWeight: 600,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(14,26,46,0.95)',
                        border: '1px solid rgba(0,229,204,0.2)',
                        borderRadius: '8px',
                        color: '#E2F4F1',
                        fontSize: '13px',
                        fontFamily: 'Rajdhani, sans-serif',
                      }}
                      formatter={(val) => [typeof val === 'number' ? val.toFixed(1) : val, 'Score']}
                    />
                    <Radar
                      dataKey="score"
                      stroke="#00E5CC"
                      strokeWidth={2}
                      fill="rgba(0,229,204,0.12)"
                      fillOpacity={1}
                      dot={{ fill: '#00E5CC', r: 4, strokeWidth: 0 }}
                      animationBegin={0}
                      animationDuration={radarAnimated ? 1200 : 0}
                      isAnimationActive={mounted}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Tier reference */}
          <div className="card-glass" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--signal)', boxShadow: 'var(--signal-glow)' }} />
              <span className="font-display" style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                Operator Tiers
              </span>
            </div>
            {[
              { name: 'Frontier', range: '4.6–5.0', desc: "Inventing the patterns", color: '#7CF5E8' },
              { name: 'Composer', range: '4.0–4.5', desc: "Working composition", color: '#00E5CC' },
              { name: 'Operator', range: '3.0–3.9', desc: "In production", color: '#00C4AD' },
              { name: 'Experimenter', range: '2.0–2.9', desc: "Building with agents", color: '#5FB8D4' },
              { name: 'Observer', range: '1.0–1.9', desc: "Watching the frontier", color: '#4A9EBF' },
            ].map(t => (
              <div key={t.name} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px',
                borderRadius: '6px',
                marginBottom: '6px',
                background: t.name === tier.name ? 'rgba(0,229,204,0.08)' : 'transparent',
                border: t.name === tier.name ? '1px solid rgba(0,229,204,0.2)' : '1px solid transparent',
                transition: 'all 200ms ease',
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.color, flexShrink: 0, boxShadow: t.name === tier.name ? '0 0 8px rgba(0,229,204,0.5)' : 'none' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', color: t.name === tier.name ? 'var(--frost)' : 'var(--text-secondary)' }}>
                      {t.name}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{t.range}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dimension breakdown */}
        <div className="card-glass" style={{ padding: '28px', marginBottom: '24px', animation: 'fadeIn 600ms ease 400ms backwards' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--signal)', boxShadow: 'var(--signal-glow)' }} />
            <span className="font-display" style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Dimension Breakdown
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {DIMENSION_KEYS.map((key) => {
              const score = scores[key];
              const pct = ((score - 1) / 4) * 100;
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="font-display" style={{ fontSize: '12px', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                      {DIMENSION_LABELS[key]}
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--signal)', fontVariantNumeric: 'tabular-nums' }}>
                      {score.toFixed(1)}
                    </span>
                  </div>
                  <div className="dimension-bar-track">
                    <div
                      className="dimension-bar-fill"
                      style={{ width: barsVisible ? `${pct}%` : '0%' }}
                    />
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '6px', lineHeight: 1.5 }}>
                    {DIMENSION_INTERPRETATIONS[key](score)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cohort comparison */}
        {cohortPercentiles && (
          <div className="card-glass" style={{ padding: '28px', marginBottom: '24px', animation: 'fadeIn 600ms ease 600ms backwards' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--signal)', boxShadow: 'var(--signal-glow)' }} />
              <span className="font-display" style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                Compared to the Cohort
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>CMPRSSN Field Study · Q2 2026 · n=847</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
              {DIMENSION_KEYS.map(key => (
                <div key={key} style={{
                  padding: '16px',
                  background: 'rgba(0,229,204,0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.6rem',
                    color: 'var(--signal)',
                    lineHeight: 1,
                    marginBottom: '6px',
                    textShadow: '0 0 12px rgba(0,229,204,0.4)',
                  }}>
                    {cohortPercentiles[key]}%
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>
                    {DIMENSION_LABELS[key]}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    higher than cohort
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Analysis */}
        <AnalysisSection scores={scores} />

        {/* CTAs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
          animation: 'fadeIn 600ms ease 800ms backwards',
        }}>
          <a
            href="https://app.reclaim.ai/m/high/yalor-and-mikyo-hour"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', flexDirection: 'column', gap: '6px',
              padding: '20px 24px',
              background: 'linear-gradient(135deg, rgba(0,229,204,0.1) 0%, rgba(74,158,191,0.06) 100%)',
              border: '1px solid rgba(0,229,204,0.3)',
              borderRadius: '10px',
              textDecoration: 'none',
              transition: 'all 200ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,229,204,0.6)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,229,204,0.3)')}
          >
            <span className="font-display" style={{ fontSize: '13px', color: 'var(--signal)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Join the Research →
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
              Book time with the CMPRSSN team to discuss your composition
            </span>
          </a>

          <a
            href="https://cmprssn.notion.site/69ddfe91f1048357a921018c0b879ac0"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', flexDirection: 'column', gap: '6px',
              padding: '20px 24px',
              background: 'rgba(14,26,46,0.5)',
              border: '1px solid var(--border-default)',
              borderRadius: '10px',
              textDecoration: 'none',
              transition: 'all 200ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
          >
            <span className="font-display" style={{ fontSize: '13px', color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Take the Full Survey →
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
              Deeper diagnostic with the complete CMPRSSN field study instrument
            </span>
          </a>

          <div
            onClick={handleShare}
            style={{
              display: 'flex', flexDirection: 'column', gap: '6px',
              padding: '20px 24px',
              background: 'rgba(14,26,46,0.5)',
              border: '1px solid var(--border-default)',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
          >
            <span className="font-display" style={{ fontSize: '13px', color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Share Results →
            </span>
            <span style={{ fontSize: '13px', color: shareMsg ? 'var(--signal)' : 'var(--text-tertiary)', lineHeight: 1.5, transition: 'color 200ms ease' }}>
              {shareMsg || 'Copy a link encoding your complete diagnostic'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            Built by Sedim3nt · Part of the CMPRSSN Q2 2026 Field Study
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) {
          div[style*="grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

function AnalysisSection({ scores }: { scores: { fleetDepth: number; governance: number; autonomy: number; composability: number; compression: number; overall: number } }) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const categories: CategoryScore[] = DIMENSION_KEYS.map(key => ({
        name: DIMENSION_LABELS[key],
        score: scores[key],
        interpretation: DIMENSION_INTERPRETATIONS[key](scores[key]),
      }));

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores: { overall: scores.overall }, categories }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Analysis failed');
      }

      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-glass" style={{
      padding: '28px',
      marginBottom: '24px',
      animation: 'fadeIn 600ms ease 700ms backwards',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--signal)', boxShadow: 'var(--signal-glow)' }} />
        <span className="font-display" style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
          The Compression Analyst
        </span>
      </div>

      {!analysis && !loading && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
            Get a personalized AI interpretation of your results — including cross-dimension patterns and a 7-day decompression protocol.
          </p>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              padding: '12px 28px',
              background: 'linear-gradient(135deg, rgba(0,229,204,0.15) 0%, rgba(74,158,191,0.1) 100%)',
              border: '1px solid var(--signal)',
              borderRadius: '6px',
              color: 'var(--signal)',
              fontFamily: 'var(--font-display)',
              fontSize: '13px',
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
            Analyze My Results
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{
            width: '40px', height: '40px', margin: '0 auto 16px',
            border: '2px solid rgba(0,229,204,0.2)',
            borderTop: '2px solid var(--signal)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <p className="font-display" style={{ fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            The Compression Analyst is reading your composition...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ color: '#ff6b6b', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
          <button
            onClick={handleAnalyze}
            style={{
              padding: '10px 24px',
              background: 'none',
              border: '1px solid var(--border-default)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-display)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {analysis && (
        <div>
          <div style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: 1.75,
            whiteSpace: 'pre-wrap',
          }}>
            {analysis}
          </div>
          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              AI-generated analysis. Not a clinical assessment.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="font-display" style={{ fontSize: '14px', color: 'var(--signal)', letterSpacing: '0.06em' }}>
          Loading...
        </div>
      </div>
    }>
      <ResultsInner />
    </Suspense>
  );
}
