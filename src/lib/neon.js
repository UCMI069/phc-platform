// ── Neon Database Client ──
// All queries go through the server-side /api/query endpoint
// No database credentials are exposed to the browser

const AUTH_SERVER = ''; // Proxied through Vite — same origin

// ── Session management ──
const SESSION_KEY = 'phc_session';

function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setStoredSession(session) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

// Recursively pull an array of rows out of any server response shape.
function extractRows(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.rows)) return data.rows;
    if (data.rows && typeof data.rows === 'object') return extractRows(data.rows);
    const values = Object.values(data);
    if (values.length > 0 && Array.isArray(values[0])) return values[0];
  }
  return [];
}

// ── Server-side query helper ──
async function serverQuery(query, params = []) {
  const url = `${AUTH_SERVER}/api/query`;
  console.log('[neon] serverQuery calling:', url, { query: query.substring(0, 100), params });
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, params }),
    });
  } catch (err) {
    console.error('[neon] serverQuery network error:', url, err);
    throw new Error(`Network error contacting ${url}: ${err.message}`);
  }
  console.log('[neon] serverQuery response status:', res.status);
  console.log('[neon] serverQuery content-type:', res.headers.get('content-type'));
  const raw = await res.text();
  console.log('[neon] serverQuery raw body (first 400):', raw.slice(0, 400));
  if (!res.ok) {
    let msg = `Server error (${res.status})`;
    try { const j = JSON.parse(raw); msg = j.error?.message || j.error || msg; } catch (_) {}
    throw new Error(msg);
  }
  let result;
  try {
    result = JSON.parse(raw);
  } catch (err) {
    // Non-JSON body (e.g. SPA index.html served instead of the API function)
    throw new Error(`Expected JSON from ${url} but got a non-JSON response (${raw.slice(0, 80) || 'empty'}). Is the API deployed on Vercel?`);
  }
  console.log('[neon] serverQuery result:', result);
  if (result.error) throw new Error(result.error.message);
  // Recursively unwrap regardless of server response shape:
  //   { data: [...rows] }
  //   { data: { rows: [...] } }
  //   { data: { rows: { rows: [...] } } }
  const rows = extractRows(result.data);
  console.log('[neon] extracted rows:', rows);
  return rows;
}

// ── Query Builder ──
class QueryBuilder {
  constructor(table) {
    this._table = table;
    this._selectCols = '*';
    this._filters = [];
    this._orderCol = null;
    this._orderAsc = true;
    this._limitVal = null;
    this._offsetVal = null;
    this._single = false;
    this._maybeSingle = false;
    this._countOnly = false;
    this._headOnly = false;
    this._insertData = null;
    this._updateData = null;
    this._deleteMode = false;
    this._upsert = false;
  }

  select(cols = '*', opts = {}) {
    this._selectCols = cols;
    if (opts.count === 'exact') this._countOnly = true;
    if (opts.head) { this._countOnly = true; this._headOnly = true; }
    return this;
  }

  insert(data) { this._insertData = data; return this; }
  upsert(data) { this._insertData = data; this._upsert = true; return this; }
  update(data) { this._updateData = data; return this; }
  delete() { this._deleteMode = true; return this; }

  eq(col, val) { this._filters.push({ col, op: '=', val }); return this; }
  neq(col, val) { this._filters.push({ col, op: '!=', val }); return this; }
  gt(col, val) { this._filters.push({ col, op: '>', val }); return this; }
  lt(col, val) { this._filters.push({ col, op: '<', val }); return this; }
  gte(col, val) { this._filters.push({ col, op: '>=', val }); return this; }
  lte(col, val) { this._filters.push({ col, op: '<=', val }); return this; }
  like(col, val) { this._filters.push({ col, op: 'LIKE', val }); return this; }
  in(col, values) { this._filters.push({ col, op: 'IN', val: values }); return this; }

  order(col, opts = {}) { this._orderCol = col; this._orderAsc = opts.ascending !== false; return this; }
  limit(n) { this._limitVal = n; return this; }
  range(from, to) { this._offsetVal = from; this._limitVal = to - from + 1; return this; }
  single() { this._single = true; return this; }
  maybeSingle() { this._maybeSingle = true; return this; }

  async then(resolve, reject) {
    try {
      const result = await this._execute();
      resolve(result);
    } catch (err) {
      if (reject) reject(err);
      else resolve({ data: null, error: { message: err.message } });
    }
  }

  async _execute() {
    if (this._deleteMode) return this._execDelete();
    if (this._insertData) return this._execInsert();
    if (this._updateData) return this._execUpdate();
    return this._execSelect();
  }

  _buildWhere() {
    if (this._filters.length === 0) return { clause: '', params: [] };
    const conditions = [];
    const params = [];
    let i = 1;
    for (const f of this._filters) {
      if (f.op === 'LIKE') {
        conditions.push(`"${f.col}" LIKE $${i}`);
        params.push(f.val);
        i++;
      } else if (f.op === 'IN') {
        const vals = Array.isArray(f.val) ? f.val : [f.val];
        const placeholders = vals.map(() => `$${i++}`).join(', ');
        conditions.push(`"${f.col}" IN (${placeholders})`);
        params.push(...vals);
      } else {
        conditions.push(`"${f.col}" ${f.op} $${i}`);
        params.push(f.val);
        i++;
      }
    }
    return { clause: `WHERE ${conditions.join(' AND ')}`, params };
  }

  async _execSelect() {
    const { clause, params } = this._buildWhere();
    let query;
    let count = null;

    if (this._countOnly && this._headOnly) {
      query = `SELECT COUNT(*) as count FROM "${this._table}" ${clause}`;
      const data = await serverQuery(query, params);
      count = parseInt(data[0]?.count || '0');
      return { data: null, error: null, count };
    }

    query = `SELECT ${this._selectCols} FROM "${this._table}" ${clause}`;

    if (this._countOnly) {
      const countQuery = `SELECT COUNT(*) as count FROM "${this._table}" ${clause}`;
      const countResult = await serverQuery(countQuery, params);
      count = parseInt(countResult[0]?.count || '0');
    }

    if (this._orderCol) {
      query += ` ORDER BY "${this._orderCol}" ${this._orderAsc ? 'ASC' : 'DESC'}`;
    }
    if (this._limitVal !== null) {
      query += ` LIMIT ${this._limitVal}`;
    }
    if (this._offsetVal !== null) {
      query += ` OFFSET ${this._offsetVal}`;
    }

    console.log('[neon] QueryBuilder executing:', query, params);
    const data = await serverQuery(query, params);
    console.log('[neon] QueryBuilder got data:', data);

    if (this._single) {
      if (!data || data.length === 0) return { data: null, error: { message: 'Row not found' }, count };
      if (data.length > 1) return { data: null, error: { message: 'Multiple rows returned' }, count };
      return { data: data[0], error: null, count };
    }

    if (this._maybeSingle) {
      return { data: data?.[0] || null, error: null, count };
    }

    return { data, error: null, count };
  }

  async _execInsert() {
    const rows = Array.isArray(this._insertData) ? this._insertData : [this._insertData];
    const results = [];

    for (const row of rows) {
      const keys = Object.keys(row);
      const values = Object.values(row);
      const placeholders = keys.map((_, i) => `$${i + 1}`);
      const cols = keys.map(k => `"${k}"`);

      let query;
      if (this._upsert) {
        const updateCols = keys.filter(k => k !== 'id').map(k => `"${k}" = EXCLUDED."${k}"`);
        query = `INSERT INTO "${this._table}" (${cols.join(',')}) VALUES (${placeholders.join(',')}) ON CONFLICT (${cols[0]}) DO UPDATE SET ${updateCols.join(',')} RETURNING *`;
      } else {
        query = `INSERT INTO "${this._table}" (${cols.join(',')}) VALUES (${placeholders.join(',')}) RETURNING *`;
      }

      const result = await serverQuery(query, values);
      results.push(result[0]);
    }

    return { data: results.length === 1 ? results[0] : results, error: null };
  }

  async _execUpdate() {
    const { clause, params } = this._buildWhere();
    const keys = Object.keys(this._updateData);
    const values = Object.values(this._updateData);
    const setClauses = keys.map((k, i) => `"${k}" = $${i + 1}`);
    const allParams = [...values, ...params];

    const query = `UPDATE "${this._table}" SET ${setClauses.join(', ')} ${clause.replace(/\$\d+/g, (m) => `$${parseInt(m.slice(1)) + keys.length}`)} RETURNING *`;
    const data = await serverQuery(query, allParams);

    return { data, error: null };
  }

  async _execDelete() {
    const { clause, params } = this._buildWhere();
    const query = `DELETE FROM "${this._table}" ${clause} RETURNING *`;
    const data = await serverQuery(query, params);
    return { data, error: null };
  }
}

// ── Storage helper (presigned URLs are short-lived, keys still needed client-side for upload) ──
class StorageClient {
  from(bucket) {
    return {
      upload: async (path, file) => {
        try {
          const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
          const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

          const client = new S3Client({
            region: import.meta.env.VITE_NEON_S3_REGION || 'us-east-2',
            endpoint: import.meta.env.VITE_NEON_S3_ENDPOINT,
            credentials: {
              accessKeyId: import.meta.env.VITE_NEON_S3_ACCESS_KEY,
              secretAccessKey: import.meta.env.VITE_NEON_S3_SECRET_KEY,
            },
            forcePathStyle: true,
          });

          const command = new PutObjectCommand({
            Bucket: bucket,
            Key: path,
            ContentType: file.type || 'application/octet-stream',
          });

          const presignedUrl = await getSignedUrl(client, command, { expiresIn: 60 });

          const res = await fetch(presignedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type || 'application/octet-stream' },
            body: file,
          });

          if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
          return { data: { path }, error: null };
        } catch (err) {
          return { data: null, error: err };
        }
      },
      getPublicUrl: (path) => ({
        data: { publicUrl: `${import.meta.env.VITE_NEON_S3_ENDPOINT}/${bucket}/${path}` },
      }),
      remove: async (paths) => {
        try {
          const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
          const client = new S3Client({
            region: import.meta.env.VITE_NEON_S3_REGION || 'us-east-2',
            endpoint: import.meta.env.VITE_NEON_S3_ENDPOINT,
            credentials: {
              accessKeyId: import.meta.env.VITE_NEON_S3_ACCESS_KEY,
              secretAccessKey: import.meta.env.VITE_NEON_S3_SECRET_KEY,
            },
            forcePathStyle: true,
          });
          for (const p of (Array.isArray(paths) ? paths : [paths])) {
            await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: p }));
          }
          return { data: null, error: null };
        } catch (err) {
          return { data: null, error: err };
        }
      },
    };
  }
}

// ── Auth helper ──
class AuthClient {
  async signInWithPassword({ email, password }) {
    try {
      const res = await fetch(`${AUTH_SERVER}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { data: { user: null, session: null }, error: { message: data.error || 'Sign in failed' } };
      const session = { user: data, access_token: data.id };
      setStoredSession(session);
      try { const { emitAuthChange } = await import('../context/AuthContext'); emitAuthChange(session); } catch (_) { /* circular import */ }
      return { data: { user: data, session }, error: null };
    } catch (err) {
      return { data: { user: null, session: null }, error: { message: err.message || 'Sign in failed' } };
    }
  }

  async signUp({ email, password, options = {} }) {
    try {
      const meta = options.data || {};
      const res = await fetch(`${AUTH_SERVER}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, password,
          firstName: meta.first_name,
          lastName: meta.last_name,
          accountType: meta.account_type,
        }),
      });
      const data = await res.json();
      if (!res.ok) return { data: { user: null, session: null }, error: { message: data.error || 'Sign up failed' } };
      const session = { user: data, access_token: data.id };
      setStoredSession(session);
      try { const { emitAuthChange } = await import('../context/AuthContext'); emitAuthChange(session); } catch (_) { /* circular import */ }
      return { data: { user: data, session }, error: null };
    } catch (err) {
      return { data: { user: null, session: null }, error: { message: err.message || 'Sign up failed' } };
    }
  }

  async signOut() {
    setStoredSession(null);
    try { const { emitAuthChange } = await import('../context/AuthContext'); emitAuthChange(null); } catch (_) { /* circular import */ }
    return { error: null };
  }

  async getSession() {
    const session = getStoredSession();
    if (!session?.user?.id) return { data: { session: null }, error: null };
    return { data: { session }, error: null };
  }

  async getUser() {
    const session = getStoredSession();
    if (!session?.user?.id) return { data: { user: null }, error: { message: 'Not authenticated' } };
    try {
      // Static route (id via query param) — dynamic /auth/user/[id] is not reliably
      // deployed as a serverless function on Vercel.
      const url = `${AUTH_SERVER}/api/auth/user?id=${encodeURIComponent(session.user.id)}`;
      console.log('[neon] getUser calling:', url);
      const res = await fetch(url);
      console.log('[neon] getUser response status:', res.status);
      console.log('[neon] getUser content-type:', res.headers.get('content-type'));
      const raw = await res.text();
      if (!raw.trim().startsWith('{')) {
        // Non-JSON response (e.g. SPA index.html served instead of the API).
        // Fall back to the stored session so the dashboard still renders.
        console.warn('[neon] getUser got non-JSON (", raw.slice(0,60), "); using stored session');
        return { data: { user: session.user }, error: null };
      }
      const data = JSON.parse(raw);
      console.log('[neon] getUser result:', data);
      if (!res.ok) {
        // Server error — keep the app usable from the stored session.
        console.warn('[neon] getUser server error; using stored session:', data);
        return { data: { user: session.user }, error: null };
      }
      return { data: { user: data }, error: null };
    } catch (err) {
      console.error('[neon] getUser error:', err);
      // API unreachable — keep the app usable from the stored session.
      return { data: { user: session.user }, error: null };
    }
  }

  async resetPasswordForEmail() {
    return { error: { message: 'Password reset not available. Contact support.' } };
  }

  async updateUser(updates) {
    const session = getStoredSession();
    if (!session?.user?.id) return { data: { user: null }, error: { message: 'Not authenticated' } };
    try {
      const res = await fetch(`${AUTH_SERVER}/api/auth/user?id=${encodeURIComponent(session.user.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) return { data: { user: null }, error: { message: data.error || 'Update failed' } };
      const updatedUser = { ...session.user, ...updates };
      session.user = updatedUser;
      setStoredSession(session);
      return { data: { user: updatedUser }, error: null };
    } catch (err) {
      return { data: { user: null }, error: { message: err.message || 'Update failed' } };
    }
  }

  onAuthStateChange(callback) {
    const session = getStoredSession();
    callback('INITIAL_SESSION', session?.user ? session : null);

    const handler = (e) => {
      if (e.key === SESSION_KEY) {
        const session = getStoredSession();
        callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      }
    };
    window.addEventListener('storage', handler);
    return { data: { subscription: { unsubscribe: () => window.removeEventListener('storage', handler) } } };
  }
}

// ── Main Client ──
class NeonClient {
  constructor() {
    this.auth = new AuthClient();
    this.storage = new StorageClient();
  }

  from(table) {
    return new QueryBuilder(table);
  }

  channel() {
    const ch = {
      _listeners: [],
      on(event, filter, callback) {
        if (typeof filter === 'function') { callback = filter; filter = {}; }
        this._listeners.push({ event, filter, callback });
        return this;
      },
      subscribe(cb) { if (cb) cb('SUBSCRIBED'); return this; },
      unsubscribe() {},
    };
    return ch;
  }
  removeChannel() {}
}

export const neonClient = new NeonClient();
export { neonClient as neon };
