const cache = new Map<string, { expires: number; data: unknown }>();
const pending = new Map<string, Promise<unknown>>();
const ttl = 10 * 60 * 1000;

async function youtube(resource: string, params: Record<string, string>) {
  const key = Deno.env.get('YOUTUBE_API_KEY');
  if (!key) throw new Error('not-configured');
  const url = new URL(`https://www.googleapis.com/youtube/v3/${resource}`);
  url.search = new URLSearchParams({ ...params, key }).toString();
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('youtube-unavailable');
  return response.json();
}

function thumbnail(images: Record<string, { url: string }> = {}) {
  return images.high?.url || images.medium?.url || images.default?.url || '';
}

async function loadPage(pageToken: string) {
  let channel = cache.get('channel');
  if (!channel || channel.expires <= Date.now()) {
    const result = await youtube('channels', { part: 'snippet,contentDetails,statistics', forHandle: '@ajt3-tech' });
    const item = result.items?.[0];
    if (!item?.contentDetails?.relatedPlaylists?.uploads) throw new Error('channel-unavailable');
    channel = { expires: Date.now() + ttl, data: item };
    cache.set('channel', channel);
  }
  const item = channel.data as any;
  const uploads = await youtube('playlistItems', {
    part: 'snippet,contentDetails', playlistId: item.contentDetails.relatedPlaylists.uploads,
    maxResults: '24', ...(pageToken ? { pageToken } : {})
  });
  const ids = (uploads.items || []).map((video: any) => video.contentDetails?.videoId).filter(Boolean);
  const details = ids.length ? await youtube('videos', {
    part: 'snippet,contentDetails,statistics,status', id: ids.join(',')
  }) : { items: [] };
  const byId = new Map((details.items || []).map((video: any) => [video.id, video]));
  const videos = ids.map((id: string) => byId.get(id) as any).filter((video: any) => video?.status?.privacyStatus === 'public').map((video: any) => ({
    id: video.id, title: video.snippet.title, description: video.snippet.description,
    thumbnail: thumbnail(video.snippet.thumbnails), publishedAt: video.snippet.publishedAt,
    viewCount: video.statistics?.viewCount, embeddable: video.status.embeddable === true
  }));
  return {
    channel: { title: item.snippet.title, description: item.snippet.description,
      thumbnail: thumbnail(item.snippet.thumbnails), subscriberCount: item.statistics.hiddenSubscriberCount ? null : item.statistics.subscriberCount,
      videoCount: item.statistics.videoCount },
    videos, nextPageToken: uploads.nextPageToken || '', updatedAt: new Date().toISOString()
  };
}

Deno.serve(async (request) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json', 'Cache-Control': 'no-store'
  };
  const respond = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers });
  if (request.method === 'OPTIONS') return respond({});
  if (request.method !== 'POST') return respond({ error: 'Method not allowed.' }, 405);
  let body;
  try { body = await request.json(); } catch { return respond({ error: 'Invalid request.' }, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return respond({ error: 'Invalid request.' }, 400);
  const pageToken = body.pageToken ?? '';
  if (typeof pageToken !== 'string' || pageToken.length > 512 || !/^[A-Za-z0-9_=-]*$/.test(pageToken)) return respond({ error: 'Invalid page token.' }, 400);
  const cacheKey = `page:${pageToken}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return respond(cached.data);
  try {
    if (!pending.has(cacheKey)) {
      pending.set(cacheKey, loadPage(pageToken).then((data) => {
        if (cache.size >= 100) cache.delete(cache.keys().next().value!);
        cache.set(cacheKey, { data, expires: Date.now() + ttl });
        return data;
      }).finally(() => pending.delete(cacheKey)));
    }
    return respond(await pending.get(cacheKey));
  } catch (error) {
    const unconfigured = error instanceof Error && error.message === 'not-configured';
    return respond({ error: unconfigured ? 'The channel feed is not connected yet. Visit the channel on YouTube while setup is completed.' : 'YouTube is temporarily unavailable. Please try again shortly.' }, unconfigured ? 503 : 502);
  }
});
