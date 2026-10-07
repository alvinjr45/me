export const youtubeChannelUrl = 'https://www.youtube.com/@ajt3-tech/';

export async function loadYouTubeChannel(pageToken = '', signal) {
  const baseUrl = process.env.REACT_APP_SUPABASE_URL;
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey) throw new Error('The channel feed is not connected yet. You can still visit the channel on YouTube.');
  const response = await fetch(`${baseUrl}/functions/v1/youtube-channel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ pageToken }), signal
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Videos are temporarily unavailable. Please try again.');
  if (!data.channel || !Array.isArray(data.videos)) throw new Error('The channel returned an invalid response.');
  return data;
}
