const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const ts = require('typescript');

const source = readFileSync(join(__dirname, 'index.ts'), 'utf8').replace(/^import .*?;\n/, '');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;

function service({ failSave = false, failUpload = false, missingAlbum = false } = {}) {
  const state = { clients: 0, writes: [], uploads: [], removals: [] };
  const client = {
    from(table) {
      let row;
      const query = {
        select() { return query; }, order() { return query; }, eq() { return query; },
        upsert(value) { row = value; state.writes.push({ table, row }); return query; },
        async maybeSingle() { return { data: missingAlbum ? null : { id: 'dogs' }, error: null }; },
        async single() { return { data: row, error: failSave ? { message: 'Database unavailable' } : null }; },
        then(resolve, reject) { return Promise.resolve({ data: [], error: null }).then(resolve, reject); }
      };
      return query;
    },
    storage: { from() { return {
      async upload(path, file) { state.uploads.push({ path, file }); return { error: failUpload ? { message: 'Upload failed' } : null }; },
      getPublicUrl(path) { return { data: { publicUrl: `https://example.test/${path}` } }; },
      async remove(paths) { state.removals.push(...paths); return { error: null }; }
    }; } }
  };
  let handler;
  runInNewContext(compiled, {
    Request, Response, File, URL, FormData, crypto,
    Deno: { env: { get: (name) => ({ ADMIN_POST_SECRET: 'test-password', SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'test-service-key' })[name] }, serve: (callback) => { handler = callback; } },
    createClient: () => { state.clients += 1; return client; }
  });
  const send = (body, secret = 'test-password', method = 'POST') => handler(new Request('https://example.test/functions/v1/admin-photo-library', {
    method, headers: { 'x-admin-secret': secret, ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }) },
    ...(method === 'POST' ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {})
  }));
  return { send, state };
}

const validPhoto = { action: 'save_photo', id: 'drake', title: 'Drake', album_id: 'dogs', alt_text: 'Portrait of Drake', caption: 'At home', sort_order: 0, width: 3024, height: 4032, image_url: '/images/dogs/drake.jpg', is_published: true };

test('requires the admin secret before any database or storage access', async () => {
  const { send, state } = service();
  for (const action of ['list', 'save_photo', 'save_album']) assert.equal((await send({ action }, 'wrong')).status, 401);
  assert.equal(state.clients, 0);
  assert.equal(state.writes.length, 0);
});

test('lists library records and supports CORS preflight without writes', async () => {
  const { send, state } = service();
  assert.equal((await send(null, '', 'OPTIONS')).status, 200);
  assert.equal((await send(null, '', 'GET')).status, 405);
  assert.deepEqual(await (await send({ action: 'list' })).json(), { photos: [], albums: [] });
  assert.equal(state.writes.length, 0);
});

test('validates URL, order, dimensions, visibility, title and alt text before saving', async () => {
  const { send, state } = service();
  for (const fields of [{ image_url: 'javascript:alert(1)' }, { image_url: '//untrusted.test/a.jpg' }, { sort_order: -1 }, { width: 0 }, { is_published: 'maybe' }, { title: '' }, { alt_text: 'a'.repeat(501) }]) {
    assert.equal((await send({ ...validPhoto, ...fields })).status, 400);
  }
  assert.equal(state.writes.length, 0);
});

test('accepts blank or omitted alt text for photo edits and uploads', async () => {
  const { send, state } = service();
  for (const alt_text of ['', '   ', undefined]) {
    assert.equal((await send({ ...validPhoto, alt_text })).status, 200);
    assert.equal(state.writes.at(-1).row.alt_text, '');
  }
  const form = uploadForm();
  form.delete('alt_text');
  assert.equal((await send(form)).status, 200);
  assert.equal(state.writes.at(-1).row.alt_text, '');
});

test('persists hidden status and rejects unknown albums', async () => {
  const { send, state } = service();
  const saved = await send({ ...validPhoto, is_published: false });
  assert.equal(saved.status, 200);
  assert.equal((await saved.json()).photo.is_published, false);
  assert.equal(state.writes[0].row.id, 'drake');
  assert.equal((await service({ missingAlbum: true }).send(validPhoto)).status, 400);
});

test('saves albums and rejects unsupported actions', async () => {
  const { send, state } = service();
  assert.equal((await send({ action: 'save_album', title: 'Weekends', description: '', sort_order: 2 })).status, 200);
  assert.equal(state.writes[0].table, 'ajt3_photo_albums');
  assert.equal((await send({ action: 'delete_everything' })).status, 400);
});

function uploadForm(type = 'image/jpeg') {
  const form = new FormData();
  for (const [key, value] of Object.entries(validPhoto)) form.append(key, String(value));
  form.append('file', new File(['test image'], 'photo.jpg', { type }));
  return form;
}

test('uploads accepted images with generated paths and rejects SVG files', async () => {
  const { send, state } = service();
  assert.equal((await send(uploadForm('image/svg+xml'))).status, 400);
  assert.equal((await send(uploadForm())).status, 200);
  assert.equal(state.uploads.length, 1);
  assert.match(state.uploads[0].path, /^ajt3\/me\/photos\/[\da-f-]+\.jpg$/);
  assert.match(state.writes[0].row.image_url, /^https:\/\/example.test\//);
});

test('cleans up only a newly uploaded file when its database save fails', async () => {
  const { send, state } = service({ failSave: true });
  assert.equal((await send(uploadForm())).status, 500);
  assert.deepEqual(state.removals, [state.uploads[0].path]);
});

test('does not change the database after a failed upload', async () => {
  const { send, state } = service({ failUpload: true });
  assert.equal((await send(uploadForm())).status, 500);
  assert.equal(state.writes.length, 0);
});
