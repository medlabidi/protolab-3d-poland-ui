// api/_lib/thingiverse.ts — Thingiverse 3D model search helper

const THINGIVERSE_CONFIG = {
  accessToken: process.env.THINGIVERSE_ACCESS_TOKEN || '',
  baseUrl: 'https://api.thingiverse.com',
  maxResults: 5,
};

export interface ThingiverseResult {
  id: number;
  name: string;
  thumbnail: string;
  url: string;
  description: string;
  creator_name: string;
  like_count: number;
}

/**
 * Search Thingiverse for 3D models matching a query
 */
export async function searchThingiverse(query: string): Promise<ThingiverseResult[]> {
  if (!THINGIVERSE_CONFIG.accessToken) {
    console.warn('[THINGIVERSE] No access token configured, skipping search');
    return [];
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `${THINGIVERSE_CONFIG.baseUrl}/search/${encodedQuery}?access_token=${THINGIVERSE_CONFIG.accessToken}&per_page=${THINGIVERSE_CONFIG.maxResults}&sort=relevant`;

    console.log('[THINGIVERSE] Searching:', query);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[THINGIVERSE] Search error:', response.status, errorText);
      return [];
    }

    const data = await response.json() as any;
    const hits = data.hits || data || [];

    const results: ThingiverseResult[] = hits.slice(0, THINGIVERSE_CONFIG.maxResults).map((thing: any) => ({
      id: thing.id,
      name: thing.name || 'Untitled',
      thumbnail: thing.thumbnail || thing.preview_image || '',
      url: thing.public_url || `https://www.thingiverse.com/thing:${thing.id}`,
      description: (thing.description || '').substring(0, 200),
      creator_name: thing.creator?.name || thing.creator?.first_name || 'Unknown',
      like_count: thing.like_count || 0,
    }));

    console.log('[THINGIVERSE] Found', results.length, 'results for:', query);
    return results;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('[THINGIVERSE] Search timed out for:', query);
    } else {
      console.error('[THINGIVERSE] Search failed:', error);
    }
    return [];
  }
}

/**
 * Format Thingiverse results as attachment objects for conversation_messages.
 * Always preview_only — AI can never give free downloads.
 */
export function formatThingiverseAsAttachments(results: ThingiverseResult[]): any[] {
  return results.map(result => ({
    name: result.name,
    url: result.thumbnail,
    type: 'image/jpeg',
    source: 'thingiverse',
    thingiverse_url: result.url,
    thingiverse_id: result.id,
    description: result.description,
    creator: result.creator_name,
    like_count: result.like_count,
    access_type: 'preview_only',
    download_allowed: false,
  }));
}
