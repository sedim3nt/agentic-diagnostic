export type Answer = 1 | 2 | 3 | 4 | 5;

export interface DiagnosticAnswers {
  q1: Answer;
  q2: Answer;
  q3: Answer;
  q4: Answer;
  q5: Answer;
  q6: Answer;
  q7: Answer;
  q8: Answer;
  q9: Answer;
  q10: Answer;
}

export interface DiagnosticScores {
  fleetDepth: number;
  governance: number;
  autonomy: number;
  composability: number;
  compression: number;
  overall: number;
}

export interface Tier {
  name: string;
  range: string;
  description: string;
  color: string;
}

export const TIERS: Tier[] = [
  {
    name: "Observer",
    range: "1.0–1.9",
    description: "You're watching the frontier from a distance",
    color: "#4A9EBF",
  },
  {
    name: "Experimenter",
    range: "2.0–2.9",
    description: "You've started building with agents",
    color: "#5FB8D4",
  },
  {
    name: "Operator",
    range: "3.0–3.9",
    description: "You're running agents in production",
    color: "#00C4AD",
  },
  {
    name: "Composer",
    range: "4.0–4.5",
    description: "You've built a working human-agent composition",
    color: "#00E5CC",
  },
  {
    name: "Frontier",
    range: "4.6–5.0",
    description: "You're inventing the patterns others will follow",
    color: "#7CF5E8",
  },
];

export function getTier(overall: number): Tier {
  if (overall >= 4.6) return TIERS[4];
  if (overall >= 4.0) return TIERS[3];
  if (overall >= 3.0) return TIERS[2];
  if (overall >= 2.0) return TIERS[1];
  return TIERS[0];
}

export function calculateScores(answers: DiagnosticAnswers): DiagnosticScores {
  const fleetDepth = (answers.q1 + answers.q2) / 2;
  const governance = (answers.q3 + answers.q4) / 2;
  const autonomy = (answers.q5 + answers.q6) / 2;
  const composability = (answers.q7 + answers.q8) / 2;
  const compression = (answers.q9 + answers.q10) / 2;
  const overall = (fleetDepth + governance + autonomy + composability + compression) / 5;

  return { fleetDepth, governance, autonomy, composability, compression, overall };
}

export const DIMENSION_INTERPRETATIONS: Record<
  keyof Omit<DiagnosticScores, 'overall'>,
  (score: number) => string
> = {
  fleetDepth: (s) => {
    if (s <= 1.5) return "Single agent or exploration phase — your fleet hasn't formed yet.";
    if (s <= 2.5) return "Early fleet stage — a few agents, beginning to specialize.";
    if (s <= 3.5) return "Growing fleet with meaningful specialization across domains.";
    if (s <= 4.5) return "Mature fleet — agents are purpose-built for distinct roles.";
    return "Full swarm with deep specialization — each agent owns its domain completely.";
  },
  governance: (s) => {
    if (s <= 1.5) return "Governance is informal or absent — risk exposure is high at scale.";
    if (s <= 2.5) return "Early guardrails exist but rely on manual judgment.";
    if (s <= 3.5) return "Written policies and logs provide reasonable accountability.";
    if (s <= 4.5) return "Enforceable config and audit trails — governance is operational.";
    return "Programmatic policy with real-time monitoring — governance is a first-class system.";
  },
  autonomy: (s) => {
    if (s <= 1.5) return "Highly supervised — agents barely run without human approval.";
    if (s <= 2.5) return "Partial autonomy with significant human touchpoints.";
    if (s <= 3.5) return "Balanced autonomy — agents run independently but failures escalate.";
    if (s <= 4.5) return "High autonomy with self-healing — you're rarely in the loop.";
    return "Near-full autonomy — agents diagnose, fix, and manage each other.";
  },
  composability: (s) => {
    if (s <= 1.5) return "Agents operate in isolation — no composition yet.";
    if (s <= 2.5) return "Basic coordination via shared files or ad-hoc passing.";
    if (s <= 3.5) return "Structured communication — agents collaborate with defined interfaces.";
    if (s <= 4.5) return "Protocol-native composition — agents use MCP, A2A, or equivalent.";
    return "Full mesh with discovery — your agents find and coordinate with each other dynamically.";
  },
  compression: (s) => {
    if (s <= 1.5) return "Low compression — most output still comes directly from you.";
    if (s <= 2.5) return "Agents handle a fraction of output; you remain primary.";
    if (s <= 3.5) return "Meaningful compression — agents carry significant productive load.";
    if (s <= 4.5) return "High compression — agents generate most output with persistent context.";
    return "Maximum compression — agents maintain full continuity; your attention is reserved for strategy.";
  },
};

export const COHORT_PERCENTILES: Record<keyof Omit<DiagnosticScores, 'overall'>, (score: number) => number> = {
  fleetDepth: (s) => Math.min(97, Math.round(((s - 1) / 4) * 85 + 10 + Math.random() * 8)),
  governance: (s) => Math.min(97, Math.round(((s - 1) / 4) * 80 + 12 + Math.random() * 10)),
  autonomy: (s) => Math.min(97, Math.round(((s - 1) / 4) * 82 + 8 + Math.random() * 8)),
  composability: (s) => Math.min(97, Math.round(((s - 1) / 4) * 78 + 15 + Math.random() * 10)),
  compression: (s) => Math.min(97, Math.round(((s - 1) / 4) * 83 + 10 + Math.random() * 8)),
};

export const QUESTIONS = [
  {
    id: 1,
    dimension: "Fleet Depth",
    question: "How many AI agents do you operate in production?",
    options: [
      { value: 1 as Answer, label: "1 — Exploring", sublabel: "Just getting started" },
      { value: 2 as Answer, label: "2–3 — Building", sublabel: "A small cohort" },
      { value: 3 as Answer, label: "4–6 — Scaling", sublabel: "A working team" },
      { value: 4 as Answer, label: "7–12 — Fleet", sublabel: "Coordinated operations" },
      { value: 5 as Answer, label: "13+ — Swarm", sublabel: "Full distributed network" },
    ],
  },
  {
    id: 2,
    dimension: "Fleet Depth",
    question: "How specialized are your agents?",
    options: [
      { value: 1 as Answer, label: "All general-purpose", sublabel: "One agent, many tasks" },
      { value: 2 as Answer, label: "Mostly general with some specialization", sublabel: "Beginning to differentiate" },
      { value: 3 as Answer, label: "Mix of general and specialized", sublabel: "Balanced portfolio" },
      { value: 4 as Answer, label: "Mostly specialized", sublabel: "Purpose-built fleet" },
      { value: 5 as Answer, label: "Each agent has a single domain", sublabel: "Deep single-domain experts" },
    ],
  },
  {
    id: 3,
    dimension: "Governance",
    question: "How do you define what agents can and cannot do?",
    options: [
      { value: 1 as Answer, label: "No explicit boundaries", sublabel: "Trust and hope" },
      { value: 2 as Answer, label: "Verbal or mental rules", sublabel: "In my head only" },
      { value: 3 as Answer, label: "Written guidelines (docs or markdown)", sublabel: "Documented but not enforced" },
      { value: 4 as Answer, label: "Config files with enforcement", sublabel: "Machine-readable policy" },
      { value: 5 as Answer, label: "Programmatic policy with kill switches", sublabel: "Full policy-as-code" },
    ],
  },
  {
    id: 4,
    dimension: "Governance",
    question: "How do you audit what your agents actually did?",
    options: [
      { value: 1 as Answer, label: "I don't", sublabel: "No audit trail" },
      { value: 2 as Answer, label: "I review outputs manually", sublabel: "Spot checking" },
      { value: 3 as Answer, label: "Git history or logs", sublabel: "Passive record" },
      { value: 4 as Answer, label: "Structured audit trail", sublabel: "Active accountability" },
      { value: 5 as Answer, label: "Real-time monitoring with alerts", sublabel: "Live observability" },
    ],
  },
  {
    id: 5,
    dimension: "Autonomy Boundary",
    question: "What percentage of agent work runs without human approval?",
    options: [
      { value: 1 as Answer, label: "Less than 10% — Highly supervised", sublabel: "Almost everything needs approval" },
      { value: 2 as Answer, label: "10–30%", sublabel: "Mostly supervised" },
      { value: 3 as Answer, label: "30–60%", sublabel: "Balanced autonomy" },
      { value: 4 as Answer, label: "60–90%", sublabel: "Mostly autonomous" },
      { value: 5 as Answer, label: "90%+ — Mostly autonomous", sublabel: "You're rarely in the loop" },
    ],
  },
  {
    id: 6,
    dimension: "Autonomy Boundary",
    question: "How do you handle agent failures?",
    options: [
      { value: 1 as Answer, label: "Manual intervention every time", sublabel: "I fix everything myself" },
      { value: 2 as Answer, label: "Retry logic", sublabel: "Automated retry, then manual" },
      { value: 3 as Answer, label: "Fallback chains", sublabel: "Graceful degradation paths" },
      { value: 4 as Answer, label: "Self-healing with escalation", sublabel: "Agents attempt recovery first" },
      { value: 5 as Answer, label: "Agents diagnose and fix each other", sublabel: "Mutual recovery system" },
    ],
  },
  {
    id: 7,
    dimension: "Composability",
    question: "How do your agents communicate with each other?",
    options: [
      { value: 1 as Answer, label: "They don't", sublabel: "Fully isolated agents" },
      { value: 2 as Answer, label: "Shared files", sublabel: "Filesystem as message bus" },
      { value: 3 as Answer, label: "Message passing", sublabel: "Structured inter-agent comms" },
      { value: 4 as Answer, label: "Structured protocols (MCP, A2A)", sublabel: "Standard agent interfaces" },
      { value: 5 as Answer, label: "Full mesh with discovery", sublabel: "Dynamic agent routing" },
    ],
  },
  {
    id: 8,
    dimension: "Composability",
    question: "How portable is your agent setup?",
    options: [
      { value: 1 as Answer, label: "Completely custom, can't replicate", sublabel: "Bespoke and fragile" },
      { value: 2 as Answer, label: "Partially documented", sublabel: "Could rebuild with effort" },
      { value: 3 as Answer, label: "Fully documented, could rebuild", sublabel: "Reproducible manually" },
      { value: 4 as Answer, label: "Config-as-code, deployable", sublabel: "One-command setup" },
      { value: 5 as Answer, label: "Infrastructure-as-code with CI/CD", sublabel: "Fully automated deployment" },
    ],
  },
  {
    id: 9,
    dimension: "Compression Ratio",
    question: "How much of your daily productive output comes from agents vs. you directly?",
    options: [
      { value: 1 as Answer, label: "Less than 10% from agents", sublabel: "Primarily your output" },
      { value: 2 as Answer, label: "10–30% from agents", sublabel: "Agents as tools" },
      { value: 3 as Answer, label: "30–60% from agents", sublabel: "Meaningful leverage" },
      { value: 4 as Answer, label: "60–80% from agents", sublabel: "Agents carry most load" },
      { value: 5 as Answer, label: "80%+ from agents", sublabel: "You direct, agents execute" },
    ],
  },
  {
    id: 10,
    dimension: "Compression Ratio",
    question: "How often do you need to re-explain context to your agents?",
    options: [
      { value: 1 as Answer, label: "Every conversation", sublabel: "Zero persistence" },
      { value: 2 as Answer, label: "Most conversations", sublabel: "Minimal memory" },
      { value: 3 as Answer, label: "Sometimes", sublabel: "Partial persistence" },
      { value: 4 as Answer, label: "Rarely — persistent memory works", sublabel: "Good continuity" },
      { value: 5 as Answer, label: "Never — agents maintain full continuity", sublabel: "Total context persistence" },
    ],
  },
];

export function encodeAnswers(answers: Partial<DiagnosticAnswers>): string {
  const params = new URLSearchParams();
  Object.entries(answers).forEach(([key, val]) => {
    if (val !== undefined) params.set(key, String(val));
  });
  return params.toString();
}

export function decodeAnswers(search: string): Partial<DiagnosticAnswers> {
  const params = new URLSearchParams(search);
  const answers: Partial<DiagnosticAnswers> = {};
  (['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10'] as Array<keyof DiagnosticAnswers>).forEach(key => {
    const val = params.get(key);
    if (val) {
      const num = parseInt(val) as Answer;
      if (num >= 1 && num <= 5) answers[key] = num;
    }
  });
  return answers;
}
