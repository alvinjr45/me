const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const ts = require('typescript');

const source = readFileSync(join(__dirname, 'index.ts'), 'utf8').replace(/^import .*?;\n/, '');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;

function service({ failSave = false, failList = false } = {}) {
  const state = { clients: 0, writes: [] };
  const client = { from(table) {
    assert.equal(table, 'ajt3_calendar_events');
    let row;
    const query = {
      select() { return query; }, order() { return query; },
      upsert(value) { row = value; state.writes.push(value); return query; },
      async single() { return { data: row, error: failSave ? {} : null }; },
      then(resolve, reject) { return Promise.resolve({ data: [], error: failList ? {} : null }).then(resolve, reject); }
    };
    return query;
  } };
  let handler;
  runInNewContext(compiled, {
    Request, Response, crypto,
    Deno: { env: { get: (name) => ({ ADMIN_POST_SECRET: 'test-password', SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'test-service-key' })[name] }, serve: (callback) => { handler = callback; } },
    createClient: () => { state.clients += 1; return client; }
  });
  const send = (body, secret = 'test-password', method = 'POST') => handler(new Request('https://example.test/functions/v1/admin-calendar', {
    method, headers: { 'x-admin-secret': secret, 'Content-Type': 'application/json' },
    ...(method === 'POST' ? { body: JSON.stringify(body) } : {})
  }));
  return { send, state };
}

const valid = { action: 'save', title: 'Meetup', calendar: 'personal', all_day: false, start_at: '2028-02-29T09:00:00.000Z', end_at: '2028-02-29T10:00:00.000Z', is_published: false };

test('requires a valid admin secret before database access', async () => {
  const { send, state } = service();
  for (const action of ['list', 'save']) assert.equal((await send({ ...valid, action }, 'wrong')).status, 401);
  assert.equal(state.clients, 0);
  assert.equal(state.writes.length, 0);
});

test('supports preflight, lists events, and rejects unsupported requests', async () => {
  const { send, state } = service();
  assert.equal((await send(null, '', 'OPTIONS')).status, 200);
  assert.equal((await send(null, '', 'GET')).status, 405);
  assert.deepEqual(await (await send({ action: 'list' })).json(), { events: [] });
  assert.equal((await send({ action: 'delete' })).status, 400);
  assert.equal((await send(null)).status, 400);
  assert.equal(state.writes.length, 0);
});

test('validates calendar, dates, visibility and text before any write', async () => {
  const { send, state } = service();
  for (const fields of [
    { title: '' }, { title: 'x'.repeat(161) }, { notes: 'x'.repeat(5001) }, { location: {} },
    { calendar: 'unknown' }, { is_published: 'false' }, { all_day: 'true' }, { id: 'invalid' },
    { end_at: valid.start_at }, { end_at: '2028-02-28T10:00:00.000Z' },
    { start_at: '2028-02-30T09:00:00.000Z' }, { start_at: '2028-02-29T09:00' },
    { all_day: true, start_date: '2027-02-29', end_date: '2027-03-01' }
  ]) assert.equal((await send({ ...valid, ...fields })).status, 400, JSON.stringify(fields));
  assert.equal(state.writes.length, 0);
});

test('creates a draft and publishes or hides an existing event without changing its ID', async () => {
  const { send, state } = service();
  const draft = await (await send(valid)).json();
  assert.equal(draft.event.is_published, false);
  assert.match(draft.event.id, /^[\da-f-]{36}$/);
  assert.equal(draft.event.start_date, null);
  for (const is_published of [true, false]) {
    const saved = await (await send({ ...valid, id: draft.event.id, is_published })).json();
    assert.equal(saved.event.id, draft.event.id);
    assert.equal(saved.event.is_published, is_published);
  }
  assert.equal(state.writes.length, 3);
});

test('preserves all-day calendar dates, permits one day, and rejects reversed dates', async () => {
  const { send } = service();
  const allDay = { ...valid, all_day: true, start_date: '2028-02-29', end_date: '2028-02-29' };
  const saved = await (await send(allDay)).json();
  assert.equal(saved.event.start_at, null);
  assert.equal(saved.event.end_at, null);
  assert.equal(saved.event.start_date, '2028-02-29');
  assert.equal(saved.event.end_date, '2028-02-29');
  assert.equal((await send({ ...allDay, end_date: '2028-02-28' })).status, 400);
});

test('reports database failures without claiming a save succeeded', async () => {
  assert.equal((await service({ failSave: true }).send(valid)).status, 500);
  assert.equal((await service({ failList: true }).send({ action: 'list' })).status, 503);
});
