const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const ts = require('typescript');

const compile = (source) => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const contentExports = {};
runInNewContext(compile(readFileSync(join(__dirname, 'content.ts'), 'utf8')), { exports: contentExports });
const { cleanText, scrubProfanity } = contentExports;
const edge = compile(readFileSync(join(__dirname, 'index.ts'), 'utf8').replace(/^import .*;\n/gm, ''));

test('scrubs common profanity, mixed case, repetitions, accents, leetspeak, and separators', () => {
  for (const input of ['fuck', 'FUCK', 'fuuuuck', 'f.u.c.k', 'f u c k', 'sh1t', 'b!tch', 'f\u00fcck', '\uff46\uff55\uff43\uff4b', 'f\u200buck']) {
    assert.equal(scrubProfanity(cleanText(input, 500, 'Message')), '***', input);
  }
  assert.equal(scrubProfanity('Nice shit, asshole!'), 'Nice ***, ***!');
  assert.equal(scrubProfanity('classic passage assessment Scunthorpe'), 'classic passage assessment Scunthorpe');
  assert.equal(scrubProfanity('customword', 'customword'), '***');
  assert.equal(scrubProfanity('hello'), 'hello');
});

test('normalizes text and rejects empty, oversized, non-string, and link submissions', () => {
  assert.equal(cleanText('  hello\n world  ', 40, 'Name'), 'hello world');
  for (const value of ['', ' ', null, {}, 'x'.repeat(501), 'https://example.com', 'www.example.com', 'a@example.com', 'example . com']) {
    assert.throws(() => cleanText(value, 500, 'Message'));
  }
  assert.equal(scrubProfanity('Hello <script>alert(1)</script>'), 'Hello <script>alert(1)</script>');
});

function service(options = {}) {
  const state = { rpc: [], clients: 0, challenges: [], mutations: [] };
  const env = {
    GUESTBOOK_ORIGINS: 'https://site.test', GUESTBOOK_HOSTNAMES: 'site.test',
    GUESTBOOK_TERMS_VERSION: 'test-v1',
    GUESTBOOK_HASH_SECRET: 'only-a-test-hash-key-not-for-production', TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
    ADMIN_POST_SECRET: 'admin-test', SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'service-test',
    ...options.env
  };
  const db = {
    async rpc(name, args) {
      state.rpc.push({ name, args });
      if (options.failDb) return { error: {} };
      if (args.p_kind === 'attempt') return { data: options.attempt || { ok: true } };
      return { data: options.post || { entry: { id: 'saved', conversation_id: args.p_conversation || 'new-conversation', display_name: args.p_name, message: args.p_message } } };
    },
    from(table) {
      const query = {
        select() { return query; }, eq() { return query; }, order() { return query; }, range() { return query; },
        update(value) { state.mutations.push({ table, value }); return query; },
        delete() { state.mutations.push({ table, deleted: true }); return query; },
        async single() { return { data: { id: 'saved', submissions_open: true } }; },
        then(resolve, reject) { return Promise.resolve({ data: [] }).then(resolve, reject); }
      };
      return query;
    }
  };
  let handler;
  runInNewContext(edge, {
    exports: {}, Request, Response, URL, crypto, TextEncoder, TextDecoder, Uint8Array, AbortSignal,
    cleanText, scrubProfanity,
    Deno: { env: { get: (key) => env[key] }, serve: (fn) => { handler = fn; } },
    createClient: () => { state.clients += 1; return db; },
    fetch: async (url, config) => {
      state.challenges.push({ url, body: JSON.parse(config.body) });
      if (options.challengeThrows) throw new Error('network failure');
      return { ok: true, json: async () => options.challenge || { success: true, hostname: 'site.test', action: 'guestbook' } };
    }
  });
  const send = (body, headers = {}, method = 'POST') => handler(new Request('https://example.test/functions/v1/guestbook', {
    method, headers: { origin: 'https://site.test', 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.4', ...headers },
    ...(method === 'POST' ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {})
  }));
  return { send, state };
}
const valid = { action: 'submit', name: 'Visitor', ageConfirmed: true, termsAccepted: true, termsVersion: 'test-v1', message: 'Hello there!', token: 'one-use-token', website: '', conversationId: '00000000-0000-4000-8000-000000000001' };

test('publishes automatically, scrubs both fields, and stores no raw network address or token', async () => {
  const { send, state } = service();
  const result = await send({ ...valid, name: 'sh1t', message: 'This is fucking nice', is_hidden: true });
  assert.equal(result.status, 201);
  const data = await result.json();
  assert.equal(data.scrubbed, true);
  assert.equal(data.entry.display_name, '***');
  assert.equal(data.entry.message, 'This is *** nice');
  assert.equal(state.rpc[0].args.p_kind, 'attempt');
  assert.equal(state.rpc[1].args.p_kind, 'post');
  assert.equal(state.rpc[1].name, 'ajt3_guestbook_submit_v2');
  assert.equal(state.rpc[1].args.p_conversation, valid.conversationId);
  assert.match(state.rpc[1].args.p_actor, /^[a-f0-9]{64}$/);
  assert.doesNotMatch(JSON.stringify(state.rpc), /203\.0\.113|one-use-token|fucking|sh1t/);
  assert.equal(state.challenges.length, 1);
});

test('requires exact allowed origin and supports preflight without touching the database', async () => {
  const { send, state } = service();
  assert.equal((await send(valid, { origin: 'https://evil.test' })).status, 403);
  assert.equal((await send(valid, { origin: '' })).status, 403);
  const preflight = await send(null, {}, 'OPTIONS');
  assert.equal(preflight.status, 200);
  assert.equal(preflight.headers.get('access-control-allow-origin'), 'https://site.test');
  assert.equal((await send(null, {}, 'GET')).status, 405);
  assert.equal((await send(valid, { 'content-type': 'text/plain' })).status, 415);
  assert.equal(state.clients, 0);
});

test('requires explicit adult and current terms declarations on replies and new conversations', async () => {
  for (const destination of [{ conversationId: valid.conversationId }, { conversationId: undefined, title: 'New board' }]) {
    for (const missing of [{ ageConfirmed: undefined }, { ageConfirmed: false }, { ageConfirmed: 'true' }, { termsAccepted: undefined }, { termsAccepted: false }, { termsAccepted: 'true' }]) {
      const { send, state } = service();
      const response = await send({ ...valid, ...destination, ...missing });
      assert.equal(response.status, 400);
      assert.equal((await response.json()).code, 'participation_required');
      assert.equal(state.rpc.length, 0);
      assert.equal(state.challenges.length, 0);
    }
  }
});

test('missing, stale, or unpublished terms cannot publish', async () => {
  for (const termsVersion of [undefined, '', 'old-version', true]) {
    const { send, state } = service();
    const response = await send({ ...valid, termsVersion });
    assert.equal(response.status, 409);
    assert.equal((await response.json()).code, 'terms_changed');
    assert.equal(state.rpc.length, 0);
    assert.equal(state.challenges.length, 0);
  }
  const { send, state } = service({ env: { GUESTBOOK_TERMS_VERSION: '' } });
  const response = await send(valid);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'terms_unavailable');
  assert.equal(state.rpc.length, 0);
});

test('fails closed without protection configuration, client address, database, or Turnstile', async () => {
  for (const options of [
    { env: { TURNSTILE_SECRET_KEY: '' } }, { env: { GUESTBOOK_HASH_SECRET: '' } },
    { env: { GUESTBOOK_HOSTNAMES: '' } }, { env: { GUESTBOOK_HASH_SECRET: 'short' } }, { failDb: true }, { challengeThrows: true }
  ]) {
    const { send, state } = service(options);
    assert.equal((await send(valid)).status, 503);
    assert.equal(state.rpc.filter((call) => call.args.p_kind === 'post').length, 0);
  }
  assert.equal((await service().send(valid, { 'x-forwarded-for': '' })).status, 503);
});

test('rejects failed, replayed, wrong-action, and wrong-host challenges', async () => {
  for (const challenge of [
    { success: false, 'error-codes': ['timeout-or-duplicate'] },
    { success: true, hostname: 'evil.test', action: 'guestbook' },
    { success: true, hostname: 'site.test', action: 'login' }
  ]) {
    const { send, state } = service({ challenge });
    assert.equal((await send(valid)).status, 400);
    assert.equal(state.rpc.length, 1);
  }
});

test('denied attempts never verify tokens or publish; final limits and duplicates are enforced', async () => {
  for (const [error, status] of [['limited', 429], ['paused', 503]]) {
    const { send, state } = service({ attempt: { error } });
    assert.equal((await send(valid)).status, status);
    assert.equal(state.challenges.length, 0);
    assert.equal(state.rpc.length, 1);
  }
  for (const [error, status] of [['limited', 429], ['paused', 503], ['duplicate', 409], ['conversation_unavailable', 404]]) {
    assert.equal((await service({ post: { error } }).send(valid)).status, status);
  }
});

test('rejects honeypots, missing tokens, invalid names/messages, malformed and oversized JSON', async () => {
  const { send, state } = service();
  for (const body of [{ ...valid, website: 'spam' }, { ...valid, token: '' }, { ...valid, name: '' }, { ...valid, message: 'x'.repeat(501) }, { ...valid, message: 'https://spam.test' }, '{', 'x'.repeat(12001)]) {
    assert.equal((await send(body)).status, 400);
  }
  assert.equal(state.challenges.length, 0);
});

test('uses the final forwarded address, ignoring spoofed prefixes', async () => {
  const { send, state } = service();
  await send(valid);
  await send(valid, { 'x-forwarded-for': '1.2.3.4, 203.0.113.4' });
  assert.equal(state.rpc[0].args.p_actor, state.rpc[2].args.p_actor);
});

test('admin actions require authentication before database access', async () => {
  const { send, state } = service();
  for (const action of ['list', 'list_conversations', 'visibility', 'conversation_visibility', 'delete', 'pause']) assert.equal((await send({ action })).status, 401);
  assert.equal(state.clients, 0);
  assert.equal((await send({ action: 'list' }, { 'x-admin-secret': 'admin-test' })).status, 200);
  assert.equal((await send({ action: 'pause', open: false }, { 'x-admin-secret': 'admin-test' })).status, 200);
  assert.equal(state.mutations[0].value.submissions_open, false);
});

test('creates a conversation and its first message together with a scrubbed title', async () => {
  const { send, state } = service();
  const result = await send({ ...valid, conversationId: undefined, title: 'Fucking great projects' });
  assert.equal(result.status, 201);
  assert.equal((await result.json()).scrubbed, true);
  assert.equal(state.rpc[1].args.p_title, '*** great projects');
  assert.equal(state.rpc[1].args.p_conversation, null);
  assert.doesNotMatch(JSON.stringify(state.rpc), /Fucking/);
});

test('rejects ambiguous, missing, oversized and invalid conversation destinations', async () => {
  const { send, state } = service();
  for (const fields of [{ title: 'Also a title' }, { conversationId: '' }, { conversationId: 'fake' }, { conversationId: undefined }, { conversationId: undefined, title: 'x'.repeat(81) }]) {
    assert.equal((await send({ ...valid, ...fields })).status, 400);
  }
  assert.equal(state.challenges.length, 0);
  assert.equal(state.rpc.some((call) => call.args.p_kind === 'post'), false);
});

test('conversation migration preserves messages and restricts hidden-board reads and writes', () => {
  const sql = readFileSync(join(__dirname, '../../migrations/20260927000000_guestbook_conversations.sql'), 'utf8');
  assert.match(sql, /security_invoker = true/);
  assert.match(sql, /update public\.ajt3_guestbook set conversation_id/);
  assert.match(sql, /alter column conversation_id set not null/);
  assert.match(sql, /p_conversation and is_hidden = false for share/);
  assert.match(sql, /conversation_unavailable/);
  assert.match(sql, /upgrade_required/);
  assert.match(sql, /revoke all on function public\.ajt3_guestbook_submit_v2[\s\S]*from public, anon, authenticated/);
  assert.doesNotMatch(sql, /delete from public\.ajt3_guestbook\s/);
});

test('migration restricts public writes and RPC access, and serializes shared counters', () => {
  const sql = readFileSync(join(__dirname, '../../migrations/20260925000000_create_guestbook.sql'), 'utf8');
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /using \(is_hidden = false\)/);
  assert.match(sql, /revoke all on function[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /submissions_open boolean not null default false/);
  assert.match(sql, /interval '24 hours'/);
  assert.match(sql, /interval '1 minute'/);
  assert.match(sql, /content_hash = p_content/);
});
