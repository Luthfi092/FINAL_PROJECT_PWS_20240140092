require('dotenv').config();
const express = require('express'), cors = require('cors'), bcrypt = require('bcryptjs'), path = require('path');
const db = require('./db'); 
const { signToken, requireJWT } = require('./auth'); 
const { generateApiKey, hashKey, requireApiKey } = require('./apiKey');

const app = express(); 
app.use(cors()); 
app.use(express.json()); 
app.use(express.static(path.join(__dirname, '../public')));

// Health Check Endpoint (Dengan logging error detail)
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ success: true, service: 'MelodyAPI', database: 'connected' });
  } catch (e) {
    console.error("DETIL ERROR DATABASE:", e);
    res.status(500).json({ success: false, message: 'Database error', error_detail: e.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'name,email,password(min 6) wajib' });
    }
    const x = await db.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
    if (x.rows.length) return res.status(409).json({ success: false, message: 'Email sudah terdaftar' });
    
    const hash = await bcrypt.hash(password, 12);
    const r = await db.query(
      'INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,email,created_at',
      [name, email.toLowerCase(), hash]
    );
    res.status(201).json({ success: true, user: r.rows[0], token: signToken(r.rows[0]) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const r = await db.query('SELECT * FROM users WHERE email=$1', [String(email || '').toLowerCase()]);
    if (!r.rows.length) return res.status(401).json({ success: false, message: 'Email/password salah' });
    
    const u = r.rows[0];
    if (!(await bcrypt.compare(password, u.password_hash))) {
      return res.status(401).json({ success: false, message: 'Email/password salah' });
    }
    res.json({ success: true, user: { id: u.id, name: u.name, email: u.email }, token: signToken(u) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/me', requireJWT, async (req, res) => {
  const r = await db.query('SELECT id,name,email,created_at FROM users WHERE id=$1', [req.user.sub]);
  res.json({ success: true, user: r.rows[0] });
});

app.post('/api/keys', requireJWT, async (req, res) => {
  try {
    const raw = generateApiKey();
    const r = await db.query(
      'INSERT INTO api_keys(user_id,name,key_prefix,key_hash) VALUES($1,$2,$3,$4) RETURNING id,name,key_prefix,created_at',
      [req.user.sub, req.body.name || 'My Music App', raw.slice(0, 15), hashKey(raw)]
    );
    res.status(201).json({ 
      success: true, 
      message: 'Full API key hanya tampil sekali', 
      api_key: raw, 
      key: r.rows[0] 
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/keys', requireJWT, async (req, res) => {
  const r = await db.query(
    'SELECT id,name,key_prefix,last_used_at,created_at,revoked_at FROM api_keys WHERE user_id=$1 ORDER BY created_at DESC',
    [req.user.sub]
  );
  res.json({ success: true, data: r.rows });
});

app.delete('/api/keys/:id', requireJWT, async (req, res) => {
  const r = await db.query(
    'UPDATE api_keys SET revoked_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING id',
    [req.params.id, req.user.sub]
  );
  if (!r.rows.length) return res.status(404).json({ success: false, message: 'Key tidak ditemukan' });
  res.json({ success: true, message: 'API key dicabut' });
});

app.use('/v1', requireApiKey);
app.use('/v1', (req, res, next) => {
  const start = Date.now();
  res.on('finish', async () => {
    try {
      await db.query(
        'INSERT INTO api_usage(api_key_id,endpoint,method,status_code,response_ms) VALUES($1,$2,$3,$4,$5)',
        [req.apiKey.id, req.originalUrl, req.method, res.statusCode, Date.now() - start]
      );
      await db.query('UPDATE api_keys SET last_used_at=NOW() WHERE id=$1', [req.apiKey.id]);
    } catch {}
  });
  next();
});

app.get('/v1/tracks', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const genre = req.query.genre || '';
    const artist = req.query.artist || '';
    
    const p = [`%${search}%`, `%${genre}%`, `%${artist}%`, limit, offset];
    
    const data = await db.query(
      `SELECT t.id,t.title,t.duration_seconds,t.track_number,t.release_date,t.popularity,t.explicit,t.language,t.bpm,t.energy,t.danceability,t.acousticness,a.title album,ar.name artist,ar.country,g.name genre 
       FROM tracks t 
       JOIN albums a ON a.id=t.album_id 
       JOIN artists ar ON ar.id=a.artist_id 
       JOIN genres g ON g.id=t.genre_id 
       WHERE t.title ILIKE $1 AND g.name ILIKE $2 AND ar.name ILIKE $3 
       ORDER BY t.popularity DESC,t.id LIMIT $4 OFFSET $5`,
      p
    );
    
    const c = await db.query(
      `SELECT COUNT(*) FROM tracks t 
       JOIN albums a ON a.id=t.album_id 
       JOIN artists ar ON ar.id=a.artist_id 
       JOIN genres g ON g.id=t.genre_id 
       WHERE t.title ILIKE $1 AND g.name ILIKE $2 AND ar.name ILIKE $3`,
      p.slice(0, 3)
    );
    
    const total = Number(c.rows[0].count);
    res.json({
      success: true,
      meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
      data: data.rows
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/v1/tracks/:id', async (req, res) => {
  const r = await db.query(
    `SELECT t.*,a.title album,ar.name artist,ar.country,g.name genre 
     FROM tracks t 
     JOIN albums a ON a.id=t.album_id 
     JOIN artists ar ON ar.id=a.artist_id 
     JOIN genres g ON g.id=t.genre_id 
     WHERE t.id=$1`,
    [req.params.id]
  );
  if (!r.rows.length) return res.status(404).json({ success: false, message: 'Track tidak ditemukan' });
  res.json({ success: true, data: r.rows[0] });
});

app.get('/v1/genres', async (req, res) => {
  const r = await db.query(
    `SELECT g.id,g.name,g.description,COUNT(t.id)::int track_count 
     FROM genres g 
     LEFT JOIN tracks t ON t.genre_id=g.id 
     GROUP BY g.id ORDER BY g.name`
  );
  res.json({ success: true, data: r.rows });
});

app.get('/v1/artists', async (req, res) => {
  const r = await db.query(
    `SELECT ar.id,ar.name,ar.country,ar.debut_year,ar.bio,COUNT(t.id)::int track_count 
     FROM artists ar 
     LEFT JOIN albums al ON al.artist_id=ar.id 
     LEFT JOIN tracks t ON t.album_id=al.id 
     GROUP BY ar.id ORDER BY ar.name`
  );
  res.json({ success: true, data: r.rows });
});

app.get('/v1/stats', async (req, res) => {
  const [t, a, al, g] = await Promise.all([
    db.query('SELECT COUNT(*)::int count FROM tracks'),
    db.query('SELECT COUNT(*)::int count FROM artists'),
    db.query('SELECT COUNT(*)::int count FROM albums'),
    db.query('SELECT COUNT(*)::int count FROM genres')
  ]);
  res.json({
    success: true,
    data: { tracks: t.rows[0].count, artists: a.rows[0].count, albums: al.rows[0].count, genres: g.rows[0].count }
  });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log('MelodyAPI running on http://localhost:' + PORT));
}

module.exports = app;