import { generateText } from 'ai';
import { defaultModel } from '@/lib/ai-provider';

const RATE_LIMIT_WINDOW = 60_000;
const MAX_REQUESTS = 10;
const requests: number[] = [];

function checkRateLimit(): boolean {
  const now = Date.now();
  while (requests.length > 0 && requests[0] < now - RATE_LIMIT_WINDOW) {
    requests.shift();
  }
  if (requests.length >= MAX_REQUESTS) return false;
  requests.push(now);
  return true;
}

export async function POST(req: Request) {
  if (!checkRateLimit()) {
    return Response.json(
      { error: 'Rate limit exceeded. Please try again in a minute.' },
      { status: 429 }
    );
  }

  try {
    const { scores, categories } = await req.json();

    const { text } = await generateText({
      model: defaultModel,
      maxOutputTokens: 1500,
      prompt: `You are The Compression Analyst for the CMPRSSN diagnostic tool. This tool measures how deeply an operator has integrated AI agents into their workflow across 5 dimensions: Fleet Depth (how many agents and how specialized), Governance (policy and audit), Autonomy Boundary (how independently agents operate), Composability (inter-agent communication and portability), and Compression Ratio (how much productive output comes from agents vs. the human).

Analyze these survey results holistically.

Scores by category: ${JSON.stringify(categories)}
Overall compression score: ${scores.overall}/5.0

Each dimension is scored 1.0–5.0. Higher = more advanced agent integration.

Provide:
1. A 2-paragraph holistic interpretation that identifies PATTERNS across categories (not just restating per-category scores). Look for interesting contrasts and what they reveal. Example: "Your high fleet depth paired with low governance suggests rapid expansion without guardrails — exciting but risky at scale."
2. A personalized 7-day decompression protocol with one specific daily practice per day, each taking 5-15 minutes. Each practice should target a specific gap or imbalance in the scores. Be concrete (not "meditate" but "sit with one specific unresolved thought for 8 minutes without trying to solve it"). Tailor the protocol to strengthen weak dimensions.

Format the 7-day protocol as:
Day 1: [title] — [description]
Day 2: [title] — [description]
...etc.

Be warm but direct. No fluff. Speak like a knowledgeable coach who understands the agentic frontier, not a therapist.`,
    });

    return Response.json({ analysis: text });
  } catch (error) {
    console.error('Analysis error:', error);
    return Response.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}
