import { saveDiagnosticToAirtable } from '@/lib/airtable';

const RATE_LIMIT_WINDOW = 60_000;
const MAX_REQUESTS = 30;
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
    const { email, scores, tier, overallScore, shareId } = await req.json();

    if (!scores || typeof tier !== 'string' || typeof overallScore !== 'number') {
      return Response.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const result = await saveDiagnosticToAirtable({
      email,
      scores,
      tier,
      overallScore,
      shareId,
    });

    if (!result) {
      // Lead persistence failed server-side, but don't break the user flow.
      return Response.json({ ok: false }, { status: 502 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Lead capture error:', error);
    return Response.json({ error: 'Lead capture failed.' }, { status: 500 });
  }
}
