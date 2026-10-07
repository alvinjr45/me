const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const ts = require('typescript');

const source = readFileSync(join(__dirname, 'index.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;

function service({ key = 'private-test-key', fail = false } = {}) {
  let handler;
  const calls = [];
  runInNewContext(compiled, {
    Request, Response, URL, URLSearchParams, AbortSignal,
    Deno: { env: { get: () => key }, serve: (callback) => { handler = callback; } },
    fetch: async (url) => {
      calls.push(url);
      if (fail) return new Response('private-test-key', { status: 403 });
      const resource = url.pathname.split('/').pop();
      const responses = {
        channels: { items: [{ snippet: { title: 'AJT3 Tech', description: 'Tech', thumbnails: {} }, contentDetails: { relatedPlaylists: { uploads: 'uploads-id' } }, statistics: { hiddenSubscriberCount: true, subscriberCount: '123', videoCount: '3' } }] },
        playlistItems: { items: [{ contentDetails: { videoId: 'public' } }, { contentDetails: { videoId: 'private' } }, { contentDetails: { videoId: 'deleted' } }], nextPageToken: 'next' },
        videos: { items: [{ id: 'private', status: { privacyStatus: 'private' } }, { id: 'public', snippet: { title: 'Newest', description: '', thumbnails: {}, publishedAt: '2026-10-06T12:00:00Z' }, status: { privacyStatus: 'public', embeddable: false }, statistics: { viewCount: '42' } }] }
      };
      return Response.json(responses[resource]);
    }
  });
  const send = (body = {}, method = 'POST') => handler(new Request('https://example.test', {
    method, ...(method === 'POST' ? { body: JSON.stringify(body) } : {})
  }));
  return { send, calls };
}

test('resolves the uploads feed, omits private/deleted videos and caches repeated pages', async () => {
  const { send, calls } = service();
  const result = await send();
  assert.equal(result.status, 200);
  const body = await result.json();
  assert.equal(body.channel.subscriberCount, null);
  assert.deepEqual(body.videos.map((video) => video.id), ['public']);
  assert.equal(body.videos[0].embeddable, false);
  assert.equal(body.nextPageToken, 'next');
  assert.equal(calls[0].searchParams.get('forHandle'), '@ajt3-tech');
  assert.equal(calls[1].searchParams.get('playlistId'), 'uploads-id');
  assert.equal(calls.length, 3);
  await send();
  assert.equal(calls.length, 3);
  await send({ pageToken: 'next' });
  assert.equal(calls.length, 5);
  assert.equal(calls[3].searchParams.get('pageToken'), 'next');
});

test('rejects invalid tokens and unsupported methods without calling YouTube', async () => {
  const { send, calls } = service();
  assert.equal((await send({ pageToken: '../other' })).status, 400);
  assert.equal((await send([], 'POST')).status, 400);
  assert.equal((await send({}, 'GET')).status, 405);
  assert.equal((await send({}, 'OPTIONS')).status, 200);
  assert.equal(calls.length, 0);
});

test('missing configuration and upstream failures return useful errors without exposing the key', async () => {
  assert.equal((await service({ key: '' }).send()).status, 503);
  const response = await service({ fail: true }).send();
  assert.equal(response.status, 502);
  assert.ok(!(await response.text()).includes('private-test-key'));
});

test('concurrent first-page requests share the same upstream calls', async () => {
  const { send, calls } = service();
  const responses = await Promise.all([send(), send()]);
  assert.ok(responses.every((response) => response.status === 200));
  assert.equal(calls.length, 3);
});
