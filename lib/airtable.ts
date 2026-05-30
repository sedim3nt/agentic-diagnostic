// NOTE: This module is server-only. It is imported exclusively by the
// app/api/lead Route Handler and must never be imported from a Client
// Component, or the Airtable PAT would be exposed in the browser bundle.
const AIRTABLE_BASE = process.env.AIRTABLE_BASE_ID || 'app5N0hqqzLb6iDoG';
const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE_NAME || 'Diagnostics';
const AIRTABLE_PAT = process.env.AIRTABLE_PAT || '';

export async function saveDiagnosticToAirtable(data: {
  email?: string;
  scores: Record<string, number>;
  tier: string;
  overallScore: number;
  shareId?: string;
}) {
  if (!AIRTABLE_PAT) {
    console.error('Airtable not configured: AIRTABLE_PAT is missing');
    return null;
  }

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${AIRTABLE_PAT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            email: data.email || '',
            fleet_depth: data.scores.fleetDepth,
            governance: data.scores.governance,
            autonomy: data.scores.autonomy,
            composability: data.scores.composability,
            compression: data.scores.compression,
            overall_score: data.overallScore,
            tier: data.tier,
            share_id: data.shareId || '',
            submitted_at: new Date().toISOString(),
          },
        }),
      }
    );
    if (!res.ok) {
      console.error('Airtable diagnostic error:', await res.json());
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error('Airtable fetch failed:', e);
    return null;
  }
}
